import os
import time
import json
import uuid
from datetime import datetime
from flask import Blueprint, request, session, Response, stream_with_context, redirect, make_response
from app.utils.file_utils import generate_file_paths, build_config
from app.services.mongo_service import transcriptions_collection
from app.tasks.transcription_task import transcribe_task
from app.response_utils import success_response, error_response
import logging
from app.services.file_service import s3_client
import requests
from app.services.file_service import generate_signed_url_from_r2_url
from app.utils.subtitle_utils import format_time, is_rtl_text
from app.services.remotion_service import render_with_remotion_and_convert
import subprocess


logger = logging.getLogger(__name__)

router = Blueprint('transcriptions', __name__)

def get_video_duration(input_path):
    result = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries",
            "format=duration", "-of",
            "default=noprint_wrappers=1:nokey=1", input_path
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    return float(result.stdout.strip())

# ⬇️ העלאת קובץ והתחלת משימה
# פונקציה עזר לזיהוי משתמש או אורח
def _identify_user_or_guest(req):
    """מזהה משתמש מחובר או אורח (מ-header/cookie); אם אין—יוצר guest_id חדש."""
    user = session.get("user")
    if user:
        return {"type": "user", "id": user["email"], "new_guest": None}

    guest_id = req.headers.get("X-Guest-Id") or req.cookies.get("guest_id")
    if guest_id:
        return {"type": "guest", "id": guest_id, "new_guest": None}

    # אין כלום → ניצור guest_id חדש
    new_guest = str(uuid.uuid4())
    return {"type": "guest", "id": new_guest, "new_guest": new_guest}


# ⬇️ העלאת קובץ והתחלת משימה (תומך במשתמשים ואורחים)
@router.route("/api/transcribe/upload", methods=["POST"])
def upload_transcription():
    ident = _identify_user_or_guest(request)

    # קבלת קובץ וידאו (ודא שבפרונט השם תואם – "video" או "file")
    file = request.files.get("video") or request.files.get("file")
    if not file:
        return error_response("No file provided", code=400)

    language = request.form.get("language", "auto")
    translate_to = request.form.get("translate_to")

    task_id = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4()}"

    input_path, output_base = generate_file_paths(file.filename, task_id)

    os.makedirs(os.path.dirname(input_path), exist_ok=True)
    file.save(input_path)

    duration = get_video_duration(input_path)

    config = build_config(input_path, output_base, language, translate_to)

    # שמירה למסד – user_id יכול להיות אימייל או guest_id
    transcriptions_collection.insert_one({
        "task_id": task_id,
        "celery_task_id": None,
        "user_id": ident["id"],
        "file_name": file.filename,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "lock_timestamp": datetime.utcnow(),
        "duration": duration
    })

    # הפעלת משימת תמלול
    task = transcribe_task.delay(task_id, input_path, config, ident["id"])

    # עדכון celery_task_id במסד
    transcriptions_collection.update_one(
        {"task_id": task_id},
        {"$set": {"celery_task_id": task.id}}
    )

    # הכנת תשובה
    resp = make_response(success_response({
        "task_id": task.id,
        "custom_task_id": task_id,
        "identity_type": ident["type"],
        "guest_id": ident["new_guest"]  # יוחזר רק אם זה אורח חדש
    }, message="Transcription task started"))

    # אם זה אורח חדש – נגדיר קוקי עם guest_id
    if ident["new_guest"]:
        resp.set_cookie("guest_id", ident["new_guest"], samesite="Lax")

    return resp


# ⬇️ רשימת תמלולים
@router.route("/api/transcriptions", methods=["GET"])
def list_transcriptions():
    ident = _identify_user_or_guest(request)
    logger.info(f"Identity: {ident['type']} {ident['id']}")

    try:
        limit = int(request.args.get("limit", 10))
        skip = int(request.args.get("skip", 0))
    except ValueError:
        return error_response("Invalid limit or skip", code=400)

    cursor = (
        transcriptions_collection
        .find({"user_id": ident["id"]})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    items = list(cursor)

    for item in items:
        item["_id"] = str(item["_id"])
        for field in ["created_at", "updated_at", "completed_at"]:
            if field in item and isinstance(item[field], datetime):
                item[field] = item[field].isoformat()

    return success_response(items, message="Transcriptions fetched")


def _ensure_owner(task, ident):
    return bool(task and ident and task.get("user_id") == ident["id"])


@router.route("/api/transcriptions/<task_id>", methods=["GET"])
def get_transcription(task_id):
    ident = _identify_user_or_guest(request)

    t = transcriptions_collection.find_one({
        "$or": [
            {"task_id": task_id},
            {"task_id": {"$regex": f"^{task_id}"}}
        ]
    })
    if not t:
        return error_response("Not found", code=404)

    if not _ensure_owner(t, ident):
        return error_response("Forbidden", code=403)

    t["_id"] = str(t["_id"])

    r2_urls = t.get("r2_urls", {})
    raw_url = r2_urls.get("mp4")
    if raw_url:
        signed_url = generate_signed_url_from_r2_url(raw_url)
        if signed_url:
            t["signed_video_url"] = signed_url

    return success_response(t)

@router.route("/api/transcriptions/<task_id>/files", methods=["GET"])
def get_transcription_files(task_id):
    ident = _identify_user_or_guest(request)

    t = transcriptions_collection.find_one({"task_id": task_id})
    if not t:
        return error_response("Not found", 404)
    if not _ensure_owner(t, ident):
        return error_response("Forbidden", 403)

    return success_response({"r2_urls": t.get("r2_urls", {})})


@router.route("/api/transcriptions/<task_id>", methods=["PUT"])
def update_transcription(task_id):
    ident = _identify_user_or_guest(request)

    data = request.json or {}
    segments = data.get("segments")
    settings = data.get("settings")

    result = transcriptions_collection.update_one(
        {"task_id": task_id, "user_id": ident["id"]},
        {"$set": {
            "segments": segments,
            "settings": settings,
            "updated_at": datetime.utcnow()
        }}
    )

    if result.matched_count == 0:
        return error_response("Not found", code=404)

    return success_response(message="Transcription updated")


# ⬇️ שריפת כתוביות לסרטון
# @router.route("/api/transcriptions/<task_id>/burn", methods=["POST"])
# def burn_subtitles(task_id):
#     t = transcriptions_collection.find_one({"task_id": task_id})
#     if not t:
#         return error_response("Not found", code=404)
#
#     try:
#         # נתיבים
#         srt_path = f"results/{task_id}.srt"
#         ass_path = f"results/{task_id}.ass"
#         input_video = f"uploads/{task_id}.mp4"
#         output_video = f"results/{task_id}_burned.mp4"
#
#         # בדוק אם יש segments עדכניים וכתוב מחדש את ה־SRT
#         data = request.get_json()
#         segments = data.get("segments") or t.get("segments")
#         caption_mode = data.get("animationMode") or data.get("captionMode") or t.get("caption_mode") or "full"
#         print(f"🔥 קיבלתי caption_mode = {caption_mode} (מהקליינט: {data.get('animationMode')})")
#
#         from app.services.transcription_service import get_style_type_from_caption_mode
#         style = get_style_type_from_caption_mode(caption_mode)
#
#         if segments:
#             with open(srt_path, "w", encoding="utf-8") as f:
#                 for idx, seg in enumerate(segments, 1):
#                     start = format_time(seg["start"])
#                     end = format_time(seg["end"])
#                     text = seg["text"]
#                     f.write(f"{idx}\n{start} --> {end}\n{text}\n\n")
#         else:
#             if not os.path.exists(srt_path):
#                 return error_response("No subtitles available to burn", code=400)
#
#         if not os.path.exists(input_video):
#             return error_response("Video file is missing", code=400)
#
#
#         from app.utils.ffmpeg_utils import convert_srt_to_ass_with_styles as convert_srt_to_ass, burn_ass_subtitles, \
#             get_video_resolution
#
#         resolution = get_video_resolution(input_video)
#         convert_srt_to_ass(
#             segments=segments,
#             ass_path=ass_path,
#             resolution=resolution,
#             rtl=any(is_rtl_text(seg.get("text", "")) for seg in segments),
#             style_type=style  # ✅ זה שם הפרמטר הנכון בפונקציה
#         )
#
#         burn_ass_subtitles(input_video, ass_path, output_video)
#
#         # העלאה ל־R2
#         from app.services.file_service import upload_file_to_r2
#         base_name = os.path.splitext(os.path.basename(output_video))[0]
#         key = f"{task_id}/{base_name}.mp4"
#         upload_success = upload_file_to_r2(output_video, key)
#
#         if not upload_success:
#             return error_response("Upload to storage failed", code=500)
#
#         # עדכון DB עם URL ציבורי + פרוקסי
#         R2_PUBLIC_BASE = os.getenv("R2_PUBLIC_BASE", "https://example.com")
#         public_url = f"{R2_PUBLIC_BASE}/{key}"
#         proxy_url = f"/api/proxy/results/{task_id}/mp4"
#
#         transcriptions_collection.update_one(
#             {"task_id": task_id},
#             {"$set": {
#                 "r2_urls.mp4": public_url,
#                 "proxy_urls.mp4": proxy_url
#             }}
#         )
#
#         # ניקוי קבצים זמניים
#         # for path in [srt_path, ass_path, output_video]:
#         #     try:
#         #         if os.path.exists(path):
#         #             os.remove(path)
#         #     except Exception as e:
#         #         logger.warning(f"[{task_id}] Could not delete file {path}: {e}")
#
#         return success_response({
#             "video_url": proxy_url
#         }, message="Subtitles burned and uploaded")
#
#     except Exception as e:
#         logger.exception(f"[{task_id}] Error in burn_subtitles: {e}")
#         return error_response("Internal error during subtitle burning", code=500)
@router.route("/api/remotion/render/<task_id>", methods=["POST"])
def render_remotion_video(task_id):
    from app.tasks.remotion_task import remotion_render_task
    t = transcriptions_collection.find_one({"task_id": task_id})
    if not t:
        return error_response("Task not found", code=404)

    data = request.get_json() or {}
    job = remotion_render_task.delay(task_id, data.get("segments"), data.get("resolution"), data.get("fps", 30))

    transcriptions_collection.update_one(
        {"task_id": task_id},
        {"$set": {"remotion_celery_task_id": job.id, "status": "render_queued", "updated_at": datetime.utcnow()}}
    )

    return success_response({"celery_task_id": job.id, "custom_task_id": task_id}, "Remotion job queued")

# ⬇️ סטטוס לפי celery_task_id
@router.route("/api/transcriptions/status/<celery_task_id>", methods=["GET"])
def check_task_status(celery_task_id):
    res = transcribe_task.AsyncResult(celery_task_id)
    return success_response({
        "celery_task_id": celery_task_id,
        "status": res.status,
        "result": res.result if res.successful() else None
    })

# ⬇️ סטטוס לפי custom_task_id
@router.route("/api/transcriptions/status-by-custom/<task_id>", methods=["GET"])
def check_task_status_by_custom(task_id):
    ident = _identify_user_or_guest(request)

    t = transcriptions_collection.find_one({"task_id": task_id})
    if not t:
        return error_response("Not found", code=404)

    if t.get("user_id") != ident["id"]:
        return error_response("Forbidden", code=403)

    celery_task_id = t.get("celery_task_id")
    if not celery_task_id:
        return error_response("No celery_task_id found for this task", code=404)

    res = transcribe_task.AsyncResult(celery_task_id)
    return success_response({
        "celery_task_id": celery_task_id,
        "status": res.status,
        "result": res.result if res.successful() else None
    })



# ⬇️ SSE events
@router.route("/api/events/<celery_task_id>")
def sse_events(celery_task_id):
    ident = _identify_user_or_guest(request)

    t = transcriptions_collection.find_one({"celery_task_id": celery_task_id})
    if not t or t.get("user_id") != ident["id"]:
        return error_response("Forbidden", 403)

    def event_stream():
        res = transcribe_task.AsyncResult(celery_task_id)
        while not res.ready():
            yield f"data: {json.dumps({'status': res.status})}\n\n"
            time.sleep(2)
        yield f"data: {json.dumps({'status': res.status, 'result': res.result if res.successful() else None})}\n\n"

    return Response(stream_with_context(event_stream()), mimetype='text/event-stream')

# ⬇️ פרוקסי להורדת קבצים עם presigned URL ו-CORS תקין

@router.route("/api/proxy/results/<task_id>/<filetype>", methods=["GET", "OPTIONS"])
def proxy_result_file(task_id, filetype):
    if request.method == "OPTIONS":
        response = make_response()
        origin = request.headers.get('Origin')
        if origin:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        else:
            response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    print(f"📥 Request for task_id={task_id}, filetype={filetype}")

    file_ext = filetype.lower()
    print(f"[DEBUG] Extracted file extension: {file_ext}")

    t = transcriptions_collection.find_one({"task_id": task_id})
    if not t:
        print(f"❌ Task {task_id} not found in DB")
        return error_response("Task not found", code=404)

    r2_files = t.get("r2_files", {})
    file_info = r2_files.get(file_ext)

    key = None
    if file_info and isinstance(file_info, dict):
        if "key" in file_info:
            key = file_info["key"]
            print(f"✅ Found key in r2_files for {file_ext}: {key}")
        elif any("Local file not found" in str(v) for v in file_info.values()):
            print(f"⚠️ File info for {file_ext} indicates local file not found, ignoring r2_files")

    if not key:
        r2_urls = t.get("r2_urls", {})
        url = r2_urls.get(file_ext)
        if not url:
            print(f"❌ File type {file_ext} not found in r2_files or r2_urls for task {task_id}")
            return error_response("File type not found", code=404)

        if ".com/" not in url:
            print(f"❌ Invalid URL format in r2_urls: {url}")
            return error_response("Invalid URL format", code=500)

        full_path = url.split(".com/")[1]
        bucket = os.getenv("R2_BUCKET_NAME")

        key = full_path
        while key.startswith(bucket + "/"):
            key = key[len(bucket) + 1:]

        print(f"[DEBUG] Final key to be used for presigned URL: {key}")
    else:
        bucket = os.getenv("R2_BUCKET_NAME")
        print(f"[DEBUG] Bucket from else branch: {bucket}")

    if not bucket:
        print("❌ R2_BUCKET_NAME not configured")
        return error_response("Server misconfiguration", code=500)

    try:
        print(f"[DEBUG] Generating presigned URL with Bucket='{bucket}', Key='{key}'")
        signed_url = s3_client.generate_presigned_url(
            ClientMethod='get_object',
            Params={'Bucket': bucket, 'Key': key},
            ExpiresIn=3600
        )
        print(f"🔗 Generated presigned URL: {signed_url}")

        if file_ext == "vtt":
            import requests
            r = requests.get(signed_url)
            if r.status_code != 200:
                return error_response("Failed to fetch VTT")

            response = make_response(r.content)
            response.headers['Content-Type'] = 'text/vtt'
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Cache-Control'] = 'no-cache'
            return response
        else:
            return success_response({
                "signed_url": signed_url
            })

    except Exception as e:
        print(f"❌ Error proxying file: {e}")
        return error_response("Error fetching file", code=500)


@router.route("/api/proxy/subtitles/<task_id>/<filetype>", methods=["GET", "OPTIONS"])
def proxy_subtitle_file(task_id, filetype):
    if request.method == "OPTIONS":
        response = make_response()
        origin = request.headers.get('Origin')
        if origin:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        else:
            response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    t = transcriptions_collection.find_one({"task_id": task_id})
    if not t:
        return error_response("Task not found", code=404)

    r2_files = t.get("r2_files", {})
    file_info = r2_files.get(filetype)
    if not file_info or not isinstance(file_info, dict):
        return error_response("File type not found", code=404)

    key = file_info.get("key")
    if not key:
        return error_response("File key not found", code=404)

    bucket = os.getenv("R2_BUCKET_NAME")
    if not bucket:
        return error_response("Server misconfiguration", code=500)

    try:
        signed_url = s3_client.generate_presigned_url(
            ClientMethod='get_object',
            Params={'Bucket': bucket, 'Key': key},
            ExpiresIn=300
        )
        r = requests.get(signed_url, stream=True)
        if r.status_code != 200:
            return error_response("Failed to fetch file from storage", code=500)

        response = make_response(r.content)
        content_type = r.headers.get('Content-Type', 'application/octet-stream')
        response.headers['Content-Type'] = content_type
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        logger.error(f"Error proxying subtitle file: {e}")
        return error_response("Error fetching file", code=500)



# ⬇️ יצירת Signed URL לקובץ לפי task_id ו-type
@router.route("/api/transcriptions/<task_id>/signed-url")
def get_signed_url(task_id):
    ident = _identify_user_or_guest(request)

    file_type = request.args.get("file")
    if not file_type:
        return error_response("Missing file type", code=400)

    t = transcriptions_collection.find_one({"task_id": task_id})
    if not t:
        return error_response("Task not found", code=404)
    if t.get("user_id") != ident["id"]:
        return error_response("Forbidden", code=403)

    r2_urls = t.get("r2_urls", {})
    url = r2_urls.get(file_type)
    if not url:
        return error_response("File type not found", code=404)

    if ".com/" not in url:
        return error_response("Invalid URL format", code=500)

    key = url.split(".com/")[1]
    bucket = os.getenv("R2_BUCKET_NAME")
    if not bucket:
        return error_response("R2_BUCKET_NAME is not configured", code=500)

    try:
        signed_url = s3_client.generate_presigned_url(
            ClientMethod='get_object',
            Params={'Bucket': bucket, 'Key': key},
            ExpiresIn=3600
        )
        logger.info(f"[signed-url] Presigned URL: {signed_url}")
        return {"status": "success", "data": {"url": signed_url}}
    except Exception as e:
        logger.error(f"Error generating signed URL: {e}", exc_info=True)
        return error_response("Error generating signed URL", code=500)
