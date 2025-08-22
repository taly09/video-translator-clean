from celery import shared_task
import os
from datetime import datetime
import requests

from app.utils.cache_utils import make_render_key
from app.services.remotion_service import get_presigned_video_url
from app.services.mongo_service import transcriptions_collection

@shared_task(
    name="app.tasks.remotion_task.remotion_render_task",
    bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3
)
def remotion_render_task(self, task_id, segments=None, resolution=None, fps=30):
    # 0) טסק
    t = transcriptions_collection.find_one({"task_id": task_id})
    if not t:
        raise RuntimeError(f"Task not found: {task_id}")

    segments   = segments or t.get("segments", [])
    resolution = resolution or {"width": 1920, "height": 1080}
    width, height = int(resolution["width"]), int(resolution["height"])
    fps = int(fps or 30)

    video_key = t.get("video_r2_key")
    if not video_key:
        raise RuntimeError("video_r2_key missing on task")

    # 1) פרמטרי איכות (נכנסים גם ל-key כדי לקבל cache יציב)
    crf    = int(os.getenv("REMOTION_CRF", "18"))
    preset = os.getenv("REMOTION_PRESET", "slow")
    codec  = "h264"   # אם תרצה webm תשנה גם בוורקר Node

    # 2) renderKey דטרמיניסטי
    render_key = make_render_key(video_key, segments, width, height, fps, codec, crf, preset)

    # 3) Cache: אם קיים רנדר זהה – חזור מיידית
    existing_url = (t.get("final_renders") or {}).get(render_key)
    if existing_url:
        transcriptions_collection.update_one(
            {"task_id": task_id},
            {"$set": {
                "status": "render_done",
                "updated_at": datetime.utcnow(),
                "r2_urls.mp4": existing_url  # או webm בהתאם למה שיש
            }}
        )
        return {"cached": True, "public_url": existing_url, "render_key": render_key}

    # 4) Presigned URL טרי לווידאו (יעבור ל-Remotion כ-videoUrl)
    presigned = get_presigned_video_url(task_id, expires_seconds=3600)

    props = {
        "segments": segments,
        "width": width, "height": height,
        "fps": fps,
        "videoUrl": presigned,
        "language": t.get("language", "auto"),
        "rtl": bool(t.get("rtl", False)),
    }

    # 5) enqueue לשירות ה-Node
    render_base = os.getenv("RENDER_BASE", "http://127.0.0.1:3002")
    body = {
        "taskId": task_id,
        "props": props,
        "renderKey": render_key,
        "outExt": "mp4",   # לשנות ל-"webm" אם צריך
        "crf": crf,
        "preset": preset
    }

    r = requests.post(f"{render_base}/enqueue", json=body, timeout=15)
    r.raise_for_status()
    job_id = r.json().get("jobId")

    # 6) סטטוס: בתור – הוורקר יעדכן ל-render_done כשיסיים
    transcriptions_collection.update_one(
        {"task_id": task_id},
        {"$set": {"status": "render_queued", "updated_at": datetime.utcnow()}}
    )

    return {"queued": True, "jobId": job_id, "render_key": render_key}
