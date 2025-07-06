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

logger = logging.getLogger(__name__)

router = Blueprint('transcriptions', __name__)

# ⬇️ העלאת קובץ והתחלת משימה
@router.route("/api/transcribe/upload", methods=["POST"])
def upload_transcription():
    user = session.get("user")
    if not user:
        return error_response("Unauthorized", code=401)

    file = request.files.get("video")
    if not file:
        return error_response("No file provided", code=400)

    language = request.form.get("language", "auto")
    translate_to = request.form.get("translate_to")

    task_id = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4()}"

    input_path, output_base = generate_file_paths(file.filename, task_id)

    os.makedirs(os.path.dirname(input_path), exist_ok=True)
    file.save(input_path)

    config = build_config(input_path, output_base, language, translate_to)
    task = transcribe_task.delay(task_id, input_path, config, user["email"])

    transcriptions_collection.insert_one({
        "task_id": task_id,
        "celery_task_id": task.id,
        "user_id": user["email"],
        "file_name": file.filename,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "lock_timestamp": datetime.utcnow()
    })

    return success_response({
        "task_id": task.id,
        "custom_task_id": task_id
    }, message="Transcription task started")

# ⬇️ רשימת תמלולים
@router.route("/api/transcriptions", methods=["GET"])
def list_transcriptions():
    user = session.get("user")
    logger.info(f"Session user: {user}")
    if not user:
        logger.error("Unauthorized: No user in session")
        return error_response("Unauthorized", code=401)

    try:
        limit = int(request.args.get("limit", 10))
        skip = int(request.args.get("skip", 0))
    except ValueError:
        return error_response("Invalid limit or skip", code=400)

    cursor = transcriptions_collection.find({"user_id": user["email"]}).skip(skip).limit(limit)
    items = list(cursor)

    for item in items:
        item["_id"] = str(item["_id"])

    return success_response(items, message="Transcriptions fetched")

# ⬇️ פרטי תמלול לפי task_id
@router.route("/api/transcriptions/<task_id>", methods=["GET"])
def get_transcription(task_id):
    t = transcriptions_collection.find_one({
        "$or": [
            {"task_id": task_id},
            {"task_id": {"$regex": f"^{task_id}"}}
        ]
    })
    if not t:
        return error_response("Not found", code=404)
    t["_id"] = str(t["_id"])
    return success_response(t)

# ⬇️ קבצים של תמלול
@router.route("/api/transcriptions/<task_id>/files", methods=["GET"])
def get_transcription_files(task_id):
    t = transcriptions_collection.find_one({"task_id": task_id})
    if not t:
        return error_response("Not found", code=404)
    return success_response({"r2_urls": t.get("r2_urls", {})})

@router.route("/api/transcriptions/<task_id>/update", methods=["POST"])
def update_transcription(task_id):
    data = request.get_json()
    segments = data.get("segments")
    if not segments:
        return error_response("Missing segments", code=400)

    srt_path = f"results/{task_id}_edited.srt"
    with open(srt_path, "w", encoding="utf-8") as f:
        for idx, seg in enumerate(segments, 1):
            start = seg.get("start", "00:00:00,000")
            end = seg.get("end", "00:00:00,000")
            text = seg.get("text", "")
            f.write(f"{idx}\n{start} --> {end}\n{text}\n\n")

    from app.utils.file_generation import generate_outputs_from_srt
    txt_path, docx_path, pdf_path = generate_outputs_from_srt(srt_path, f"{task_id}_edited")

    from app.services.file_service import upload_outputs_and_update_db
    result = upload_outputs_and_update_db(task_id, {
        "srt": srt_path,
        "txt": txt_path,
        "docx": docx_path,
        "pdf": pdf_path
    })

    transcriptions_collection.update_one(
        {"task_id": task_id},
        {"$set": {
            "content": "\n".join([seg["text"] for seg in segments]),
            "r2_files": result["uploaded"]
        }}
    )

    return success_response({"message": "Transcription updated", "r2_files": result["uploaded"]})


# ⬇️ שריפת כתוביות לסרטון
@router.route("/api/transcriptions/<task_id>/burn", methods=["POST"])
def burn_subtitles(task_id):
    t = transcriptions_collection.find_one({"task_id": task_id})
    if not t:
        return error_response("Not found", code=404)

    srt_path = f"results/{task_id}.srt"
    ass_path = f"results/{task_id}.ass"
    input_video = f"uploads/{task_id}.mp4"
    output_video = f"results/{task_id}_burned.mp4"

    if not os.path.exists(srt_path) or not os.path.exists(input_video):
        return error_response("Source files missing", code=400)

    from app.utils.ffmpeg_utils import convert_srt_to_ass, burn_ass_subtitles, get_video_resolution

    resolution = get_video_resolution(input_video)
    convert_srt_to_ass(
        srt_path, ass_path,
        resolution=resolution,
        style_config=t.get("subtitle_style", {}),
        rtl=t.get("language") in ["he", "ar", "fa"]
    )
    burn_ass_subtitles(input_video, ass_path, output_video)

    from app.services.file_service import upload_file_to_r2
    base_name = os.path.splitext(os.path.basename(output_video))[0]
    key = f"{task_id}/{base_name}.mp4"
    upload_file_to_r2(output_video, key)

    R2_PUBLIC_BASE = os.getenv("R2_PUBLIC_BASE", "https://example.com")
    video_url = f"{R2_PUBLIC_BASE}/{key}"

    transcriptions_collection.update_one(
        {"task_id": task_id},
        {"$set": {"r2_urls.mp4": video_url}}
    )

    return success_response({"video_url": video_url}, message="Subtitles burned and uploaded")

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
    t = transcriptions_collection.find_one({"task_id": task_id})
    if not t:
        return error_response("Not found", code=404)

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
    def event_stream():
        res = transcribe_task.AsyncResult(celery_task_id)
        while not res.ready():
            yield f"data: {json.dumps({'status': res.status})}\n\n"
            time.sleep(2)
        if res.successful():
            yield f"data: {json.dumps({'status': res.status, 'result': res.result})}\n\n"
        else:
            yield f"data: {json.dumps({'status': 'FAILURE'})}\n\n"

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

    # חותכים את הסיומת מהפרמטר filetype (למשל 'filename.pdf' -> 'pdf')
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

        r = requests.get(signed_url, stream=True)
        print(f"📡 Response status code from R2: {r.status_code}")
        print(f"📡 Response Content-Type from R2: {r.headers.get('Content-Type')}")
        print(f"📡 Response content preview (first 200 bytes): {r.content[:200]!r}")

        response = make_response(r.content, r.status_code)

        content_type = r.headers.get('Content-Type')
        if not content_type:
            if file_ext == 'srt':
                content_type = 'application/x-subrip'
            elif file_ext == 'txt':
                content_type = 'text/plain'
            elif file_ext == 'pdf':
                content_type = 'application/pdf'
            elif file_ext == 'docx':
                content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            elif file_ext == 'mp4':
                content_type = 'video/mp4'
            else:
                content_type = 'application/octet-stream'
        response.headers['Content-Type'] = content_type

        response.headers['Content-Disposition'] = f'attachment; filename="{task_id}.{file_ext}"'
        print(f"[DEBUG] Content-Disposition header: attachment; filename=\"{task_id}.{file_ext}\"")

        origin = request.headers.get('Origin')
        if origin:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        else:
            response.headers['Access-Control-Allow-Origin'] = '*'

        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'

        return response
    except Exception as e:
        print(f"❌ Error proxying file: {e}")
        return error_response("Error fetching file", code=500)


# ⬇️ יצירת Signed URL לקובץ לפי task_id ו-type
@router.route("/api/transcriptions/<task_id>/signed-url")
def get_signed_url(task_id):
    from app.services.file_service import s3_client
    import os

    file_type = request.args.get("file")
    if not file_type:
        return error_response("Missing file type", code=400)

    t = transcriptions_collection.find_one({"task_id": task_id})
    if not t:
        return error_response("Task not found", code=404)

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

        # מחזירים JSON עם ה-URL החתום
        return {
            "status": "success",
            "data": {
                "url": signed_url
            }
        }
    except Exception as e:
        logger.error(f"Error generating signed URL: {e}", exc_info=True)
        return error_response("Error generating signed URL", code=500)
