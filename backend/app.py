from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
from transcribe_video import Config
from authlib.integrations.flask_client import OAuth
import os, uuid, json, wave, traceback
from tasks import transcribe_task
from celery.result import AsyncResult
from datetime import datetime
from flask import redirect,Response
import time
from celery.result import AsyncResult
from celery_worker import celery
import json  # ← חשוב
import re
from flask import make_response
from flask import Response, stream_with_context
from functools import wraps
from flask import session, jsonify
from werkzeug.datastructures import FileStorage
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from load_env import *
import boto3

# --- Load .env ---
import os
from pathlib import Path
from dotenv import load_dotenv

from pymongo import MongoClient
import requests


env_path = Path(__file__).resolve().parent / ".env.local"
print(f"🔎 טוען את הקובץ מ: {env_path}")
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    with env_path.open(encoding="utf-8") as f:
        print("📄 תוכן קובץ .env.local:\n" + f.read())
else:
    print("⚠️ קובץ .env.local לא קיים!")
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user" not in session:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function
# --- טוען את הקובץ .env.local לפני כל שימוש במשתני סביבה ---


from mongo_client import transcriptions_collection
from r2_client import upload_file_to_r2

# --- יצירת חיבור ל־MongoDB לאחר טעינת משתני הסביבה ---
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
mongo_db = client["video_platform"]
transcriptions_collection = mongo_db["transcriptions"]




# --- Init Flask ---
app = Flask(__name__)
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379",
    default_limits=["100 per hour"]
)
app.secret_key = os.environ["SECRET_KEY"]  # בלי fallback – חובה להגדיר!
app.config.update(
    UPLOAD_FOLDER='uploads',
    RESULT_FOLDER='results',
    SESSION_COOKIE_SAMESITE="Lax",   # ✅ בטוח ל־localhost
    SESSION_COOKIE_SECURE=False,      # ✅ False ל-localhost בלבד
    MAX_CONTENT_LENGTH=500 * 1024 * 1024  # ✅ הגבלה: עד 500MB
)

# צור לקוח S3/R2
s3_client = boto3.client(
    "s3",
    endpoint_url=os.getenv("R2_ENDPOINT_URL"),
    aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
    region_name="",  # דרוש ב-R2
)
def generate_presigned_url(object_key: str, expiration=600):
    bucket_name = os.getenv("R2_BUCKET_NAME")
    try:
        url = s3_client.generate_presigned_url(
            ClientMethod='get_object',
            Params={'Bucket': bucket_name, 'Key': object_key},
            ExpiresIn=expiration
        )
        return url
    except Exception as e:
        print(f"❌ Failed to generate presigned URL: {e}")
        return None

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['RESULT_FOLDER'], exist_ok=True)

# --- CORS ---
ALLOWED_ORIGINS = {
    os.getenv("FRONTEND_URL", "http://localhost:5174"),
    "http://localhost:5174",
    "https://video-translator-gibuy.vercel.app"
}
CORS(app, supports_credentials=True)

@app.route('/api/proxy/results/<task_id>/<filename>')
def proxy_result_file(task_id, filename):
    try:
        transcription = transcriptions_collection.find_one({"id": task_id})
        if not transcription:
            print("❌ לא נמצא תמלול עם task_id:", task_id)
            return jsonify({"error": "לא נמצא תמלול תואם"}), 404

        owner_email = transcription.get("user_email")
        current_email = session.get("user", {}).get("email")
        print(f"👤 המשתמש הנוכחי: {current_email}")
        print(f"📄 בעל הקובץ: {owner_email}")

        if owner_email not in (None, "", "guest"):
            if owner_email != current_email:
                print("⛔ גישה לא מורשית")
                return jsonify({"error": "אין הרשאה לצפות בקובץ זה"}), 403

        # DEBUG לפני קריאה ל־S3
        bucket_name = os.getenv("R2_BUCKET_NAME")
        object_key = f"{task_id}/{filename}"

        print(f"📦 bucket_name = {bucket_name}")
        print(f"📦 object_key = {object_key}")

        obj = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        data = obj['Body'].read()

        content_type = obj.get('ContentType') or "application/octet-stream"
        headers = {
            "Content-Type": content_type,
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Allow-Origin": "*",
        }
        return Response(data, headers=headers)

    except s3_client.exceptions.NoSuchKey:
        print(f"❌ מפתח לא קיים: {object_key}")
        return jsonify({"error": "File not found"}), 404

    except Exception as e:
        print(f"❌ שגיאה כללית בהורדה: {str(e)}")
        return jsonify({"error": str(e)}), 500





@app.route('/api/transcriptions/<task_id>/download/<filename>')
def get_presigned_download(task_id, filename):
    object_key = f"{task_id}/{filename}"
    url = generate_presigned_url(object_key)
    if url:
        return jsonify({"url": url})
    else:
        return jsonify({"error": "Could not generate download URL"}), 500

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin", "")
    frontend_url = os.getenv("FRONTEND_URL", "")
    is_dev = "localhost" in origin or "127.0.0.1" in origin  # ⬅ זה מה שחשוב בפועל

    if is_dev:
        if origin.startswith("http://localhost") or origin.startswith("http://127.0.0.1"):
            response.headers["Access-Control-Allow-Origin"] = origin
    else:
        if origin == frontend_url:
            response.headers["Access-Control-Allow-Origin"] = origin

    if "Access-Control-Allow-Origin" in response.headers:
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"

    return response


@app.after_request
def set_security_headers(response):
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"  # ⚠️ רק בפרודקשן עם HTTPS
    return response



@app.route('/login/google')
@limiter.limit("10 per minute")

def login_google():
    redirect_uri = os.getenv("BACKEND_URL", "http://localhost:8765") + '/auth/google/callback'
    return google.authorize_redirect(redirect_uri)


@app.route('/auth/google/callback')
def google_callback():
    try:
        token = google.authorize_access_token()
        print("🪪 טוקן:", token)

        user_info = google.get('userinfo').json()
        print("👤 מידע מה־Google:", user_info)

        if not user_info.get("email"):
            print("⚠️ אין אימייל")
            return jsonify({"error": "לא ניתן לאמת משתמש"}), 400

        session['user'] = {
            "email": user_info.get("email"),
            "full_name": user_info.get("name"),
            "picture": user_info.get("picture"),
        }
        print("✅ נשמר ב־session:", session['user'])

        frontend = request.headers.get("Origin") or os.getenv("FRONTEND_URL", "http://localhost:5174")
        print("➡️ REDIRECTING TO FRONTEND:", frontend)
        print("🔁 FINAL REDIRECT TO:", frontend)
        return redirect(frontend)

    except Exception as e:
        print("❌ שגיאה ב־callback:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/api/events/<task_id>")
def sse_task_status(task_id: str):
    def event_stream():
        try:
            while True:
                result = AsyncResult(task_id, app=celery)
                status = result.status

                match status:
                    case "SUCCESS":
                        yield f"data: {json.dumps(result.result or {})}\n\n"
                        break
                    case "FAILURE":
                        error_msg = str(result.result or "לא ידוע")
                        yield f"data: {json.dumps({'status': 'failed', 'error': error_msg})}\n\n"
                        break
                    case _:
                        yield f"data: {json.dumps({'status': status.lower()})}\n\n"

                time.sleep(1.5)

        except Exception as e:
            error_msg = f"⚠️ שגיאה פנימית ב־SSE: {str(e)}"
            print(error_msg)
            yield f"data: {json.dumps({'status': 'error', 'error': error_msg})}\n\n"

    return Response(stream_with_context(event_stream()), mimetype="text/event-stream")


@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_preflight(path):
    return add_cors_headers(jsonify({'status': 'ok'}))

# --- OAuth ---
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID'),
    client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
    access_token_url='https://accounts.google.com/o/oauth2/token',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    userinfo_endpoint='https://www.googleapis.com/oauth2/v1/userinfo',
    client_kwargs={'scope': 'email profile'},
)

# --- Utility ---
def clean_transcriptions_file():
    valid = []
    try:
        with open("transcriptions.json", "r", encoding="utf-8") as f:
            for line in f:
                t = json.loads(line.strip())
                if "id" in t and t["id"]:
                    valid.append(t)
    except FileNotFoundError:
        return
    with open("transcriptions.json", "w", encoding="utf-8") as f:
        for t in valid:
            f.write(json.dumps(t, ensure_ascii=False) + "\n")

def get_audio_duration_wav(wav_path):
    try:
        with wave.open(wav_path, 'r') as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            return int(frames / rate)
    except Exception:
        return 0

# --- Utility ---
def is_allowed_file(filename: str) -> bool:
    allowed_extensions = {".mp4", ".mp3", ".m4a", ".wav", ".opus", ".ogg", ".webm"}
    return os.path.splitext(filename)[1].lower() in allowed_extensions

def sanitize_filename(filename: str) -> str:
    name, ext = os.path.splitext(filename)
    name = re.sub(r'[^\w\-\.]', '_', name)
    return name[:50] + ext

def validate_upload_request() -> tuple[FileStorage | None, dict]:
    file = request.files.get('video')
    if not file:
        return None, {"error": "לא נשלח קובץ"}
    if not is_allowed_file(file.filename):
        return None, {"error": "פורמט קובץ לא נתמך"}
    return file, {}

def generate_file_paths(original_filename: str) -> tuple[str, str, str]:
    task_id = str(uuid.uuid4())
    base_name = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{task_id}"
    ext = os.path.splitext(original_filename)[1] or ".mp4"
    uploaded_filename = base_name + ext
    input_path = os.path.join(app.config['UPLOAD_FOLDER'], uploaded_filename)
    output_base = os.path.join(app.config['RESULT_FOLDER'], base_name)
    return input_path, output_base, task_id

def build_config(input_path: str, output_base: str, language: str, translate_to: str) -> Config:
    config = Config()
    config.input_video = input_path
    config.language = None if language == "auto" else language
    config.translation_target = translate_to or None

    config.output_video = output_base + ".mp4"
    config.output_srt = output_base + ".srt"
    config.output_txt = output_base + ".txt"
    config.output_pdf = output_base + ".pdf"
    config.output_docx = output_base + ".docx"

    return config

# --- נקודת API ---

@app.route('/api/transcribe/upload', methods=['POST'])
@limiter.limit("10 per minute")
def api_upload():
    file, error = validate_upload_request()
    if not file:
        return jsonify(error), 400

    language = request.form.get("language", "auto")
    translate_to = request.form.get("translate_to", "")
    embed_subtitles = request.form.get("embed_subtitles", "true") == "true"

    sanitized_name = sanitize_filename(file.filename)
    input_path, output_base, task_id = generate_file_paths(sanitized_name)

    os.makedirs(os.path.dirname(input_path), exist_ok=True)
    file.save(input_path)
    basename = os.path.basename(input_path)
    object_name = f"{task_id}/{basename}"
    success = upload_file_to_r2(input_path, object_name=object_name)
    if not success:
        print("❌ העלאה ל־R2 נכשלה")
        return jsonify({"error": "העלאה ל־R2 נכשלה"}), 500
    else:
        print("✅ קובץ הועלה ל־R2 בהצלחה:", object_name)

    config = build_config(input_path, output_base, language, translate_to)
    config_dict = config.__dict__

    print("🚀 שולח משימה ל־Celery עם task_id =", task_id)
    transcribe_task.apply_async(args=[task_id, input_path, config_dict], task_id=task_id)
    print("✅ apply_async נשלח בהצלחה")

    return jsonify({"task_id": task_id}), 200




from typing import Any

def build_success_response(data: dict[str, Any]) -> dict:
    import os

    R2_PUBLIC_BASE = os.getenv("R2_PUBLIC_BASE")
    task_id = data.get("task_id", "")
    base_name = data.get("base_name", "")  # ← חדש, מגיע מה־task

    return {
        "status": data.get("status", "completed"),
        "step": "done",
        "progress": 100,
        "transcript_text": data.get("transcript_text", ""),
        "srt_url": f"{R2_PUBLIC_BASE}/{task_id}/{base_name}.srt",
        "txt_url": f"{R2_PUBLIC_BASE}/{task_id}/{base_name}.txt",
        "pdf_url": f"{R2_PUBLIC_BASE}/{task_id}/{base_name}.pdf",
        "docx_url": f"{R2_PUBLIC_BASE}/{task_id}/{base_name}.docx",
        "original_file_url": f"{R2_PUBLIC_BASE}/{task_id}/{base_name}.mp4",
        "video_with_subs_url": f"{R2_PUBLIC_BASE}/{task_id}/{base_name}.mp4",
        "audio_url": f"{R2_PUBLIC_BASE}/{task_id}/{base_name}.mp4",
        "detected_language": data.get("detected_language"),
        "duration": data.get("duration", 0)
    }



@app.route('/api/transcribe/status/<task_id>', methods=['GET'])
def api_status(task_id: str):
    try:
        result = AsyncResult(task_id, app=celery)

        print("🧪 בדיקת סטטוס תהליך")
        print("🔎 task_id:", task_id)
        print("📦 state:", result.state)
        print("📦 result:", result.result)
        print("📦 result type:", type(result.result))

        if result.state == "PENDING":
            return jsonify({
                "status": "processing",
                "step": "pending",
                "progress": 0
            })

        elif result.state == "PROGRESS":
            return jsonify({
                "status": "processing",
                "step": "working",
                "progress": result.info.get("progress", 0)
            })


        elif result.state == "SUCCESS":
            try:
                if isinstance(result.result, dict):
                    return jsonify(build_success_response(result.result))
                else:
                    print("⚠️ תוצאה לא תקינה מ־Celery:", result.result)
                    return jsonify({
                        "status": "failed",
                        "message": "תוצאה לא תקינה מה־task",
                        "progress": 0
                    }), 500
            except Exception as e:
                print("❌ שגיאה בבניית תשובה:", str(e))
                return jsonify({
                    "status": "error",
                    "message": str(e),
                    "progress": 0
                }), 500

        elif result.state == "FAILURE":
            return jsonify({
                "status": "failed",
                "message": str(result.result),
                "progress": 0
            })

        else:
            return jsonify({
                "status": result.state.lower(),
                "progress": 0
            })

    except Exception as e:
        print("❌ שגיאה כללית ב־/api/transcribe/status:", str(e))
        return jsonify({
            "status": "error",
            "message": str(e),
            "progress": 0
        }), 500

# --- Auth routes ---
@app.route("/api/user/me")

def get_current_user():
    print("📥 /api/user/me נקרא")
    print("🧠 session =", dict(session))
    if "user" not in session:
        return jsonify({"user": None}), 200
    return jsonify({"user": session["user"]})

@app.route('/api/logout', methods=['POST'])
def logout():
    print("🔒 logout התחיל")
    session.clear()

    response = make_response(jsonify({"message": "התנתקת בהצלחה"}))
    response = add_cors_headers(response)

    response.delete_cookie(
        key="session",  # ← תוקן: במקום app.session_cookie_name
        path='/',
        domain=None,
        samesite="Lax",  # אם אתה ב־localhost או dev
        secure=False     # True רק בפרודקשן עם HTTPS
    )

    return response



@app.route("/login/fake")
def login_fake():
    session["user"] = {"email": "test@example.com", "full_name": "Test User"}
    return jsonify({"message": "משתמש מדומה התחבר"})

# --- Settings & transcriptions ---
@app.route('/api/settings', methods=['GET', 'POST'])
@login_required
def user_settings():
    if 'user' not in session:
        return jsonify({"error": "לא מחובר"}), 401

    email = session['user']
    settings_file = f"settings_{email.replace('@', '_').replace('.', '_')}.json"

    if request.method == 'POST':
        data = request.get_json()
        with open(settings_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
        return jsonify({"message": "Settings saved successfully"})

    if os.path.exists(settings_file):
        with open(settings_file, "r", encoding="utf-8") as f:
            settings = json.load(f)
        return jsonify(settings)
    else:
        return jsonify({})

@app.route('/api/transcriptions', methods=['POST'])

def save_transcription():
    data = request.get_json()
    data["id"] = data.get("id", str(uuid.uuid4()))
    data["created_date"] = data.get("created_date", datetime.now().isoformat())

    # 🧠 שמירת המשתמש המחובר (אם יש)
    user_email = session.get("user", {}).get("email")
    data["user_email"] = user_email if user_email else "guest"

    # --- שמירה למסד MongoDB במקום קובץ ---
    transcriptions_collection.update_one(
        {"id": data["id"]}, {"$set": data}, upsert=True
    )

    return jsonify(data), 200



@app.route('/api/transcriptions/<id>', methods=['GET'])

def get_transcription_by_id(id):
    t = transcriptions_collection.find_one({"id": id})
    if t:
        t["_id"] = str(t["_id"])  # להמיר את ObjectId למחרוזת
        return jsonify(t)
    return jsonify({"error": "לא נמצא"}), 404

from pymongo import DESCENDING

@app.route('/api/transcriptions', methods=['GET'])
@login_required
def get_transcriptions():
    try:
        # 🧠 המשתמש הנוכחי
        user_email = session.get("user", {}).get("email")
        if not user_email:
            return jsonify({"error": "משתמש לא מחובר"}), 401

        # 🧾 פרמטרים מה-query string
        language = request.args.get("language")
        start_date = request.args.get("start_date")  # ISO format
        end_date = request.args.get("end_date")      # ISO format
        limit = int(request.args.get("limit", 50))
        skip = int(request.args.get("skip", 0))

        # 🔍 בניית מסנן
        query = {"user_email": user_email}
        if language:
            query["detected_language"] = language
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = datetime.fromisoformat(start_date)
            if end_date:
                date_filter["$lte"] = datetime.fromisoformat(end_date)
            query["created_date"] = date_filter

        # 📥 שליפה ממסד הנתונים
        cursor = transcriptions_collection.find(query)\
            .sort("created_date", DESCENDING)\
            .skip(skip)\
            .limit(limit)

        transcriptions = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])  # ← JSON-safe
            transcriptions.append(doc)

        return jsonify({
            "total": transcriptions_collection.count_documents(query),
            "results": transcriptions
        })

    except Exception as e:
        print("❌ שגיאה ב־get_transcriptions:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route('/api/transcriptions/clean_duplicates', methods=['POST'])
def clean_duplicate_transcriptions():
    try:
        seen = set()
        unique_lines = []
        with open("transcriptions.json", "r", encoding="utf-8") as f:
            for line in f:
                t = json.loads(line.strip())
                if t.get("id") and t["id"] not in seen:
                    seen.add(t["id"])
                    unique_lines.append(json.dumps(t, ensure_ascii=False))

        with open("transcriptions.json", "w", encoding="utf-8") as f:
            f.write("\n".join(unique_lines) + "\n")

        return jsonify({"message": f"{len(unique_lines)} תמלולים נשמרו לאחר ניקוי"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500




# --- File serving ---
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/results/<filename>')
def result_file(filename):
    return send_from_directory(app.config['RESULT_FOLDER'], filename, as_attachment=True)

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react_app(path):
    react_dist_dir = os.path.join(os.path.dirname(__file__), '../frontend/build')
    file_path = os.path.join(react_dist_dir, path)
    if path != "" and os.path.exists(file_path):
        return send_from_directory(react_dist_dir, path)
    else:
        return send_from_directory(react_dist_dir, 'index.html')

@app.errorhandler(Exception)
def handle_exception(e):
    print(traceback.format_exc())
    return add_cors_headers(jsonify({"error": str(e)})), 500

# --- Run ---
if __name__ == '__main__':
    clean_transcriptions_file()
    app.run(host="0.0.0.0", port=8765, debug=True)