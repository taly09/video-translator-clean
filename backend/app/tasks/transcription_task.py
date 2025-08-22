from dotenv import load_dotenv
import os
import logging
from celery import Celery
from app.services.transcription_service import HebrewTranscriber
from app.services.mongo_service import transcriptions_collection
from app.services.file_service import init_s3_client
from app.utils.config_loader import load_transcription_config
from datetime import datetime

# -------------------------------------------------
# לוגים (מוגדרים מוקדם כדי שנראה הודעות טעינה)
# -------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("transcription_task.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# -------------------------------------------------
# טעינת .env.local עם override=True
# -------------------------------------------------
env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
load_dotenv(dotenv_path=env_path, override=True)
logger.info(f"🌱 Loading environment from: {os.path.abspath(env_path)}")

# לא להדפיס סודות! רק ערכים לא-רגישים / או לבדוק שהם קיימים
def _mask(s: str | None, show: int = 4) -> str | None:
    if not s:
        return None
    return s[:show] + "…" if len(s) > show else "…"

# אימות ערכים קריטיים (ללא חשיפת סודות)
logger.info(f"CELERY_BROKER_URL = {os.getenv('CELERY_BROKER_URL')}")
logger.info(f"CELERY_RESULT_BACKEND = {os.getenv('CELERY_RESULT_BACKEND')}")
logger.info(f"R2_BUCKET_NAME = {os.getenv('R2_BUCKET_NAME')}")
logger.info(f"MONGO_URI present: {bool(os.getenv('MONGO_URI'))}")
logger.info(f"GOOGLE_CLIENT_ID = {_mask(os.getenv('GOOGLE_CLIENT_ID'))}")
logger.info("GOOGLE_CLIENT_SECRET loaded" if os.getenv("GOOGLE_CLIENT_SECRET") else "GOOGLE_CLIENT_SECRET missing")

# אבטחה בסיסית ל-SECRET_KEY בפרודקשן
if os.getenv("FLASK_ENV") == "production" and not os.getenv("SECRET_KEY"):
    raise RuntimeError("❌ SECRET_KEY must be set in production for security reasons!")

# -------------------------------------------------
# אתחול S3/R2 client (אחרי טעינת ENV)
# -------------------------------------------------
init_s3_client()

# -------------------------------------------------
# אתחול Celery
# -------------------------------------------------
celery = Celery(
    "tasks",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
)

# לטעון את משימת הרמושן כדי שלא תהיה שגיאת KeyError
celery.conf.update(
    include=["app.tasks.remotion_task"],
    task_default_queue="celery",
)
celery.autodiscover_tasks(["app", "app.tasks"])
import app.tasks.remotion_task  # טעינה כפויה

# לוג אימות שהוגדר בפועל ב-Celery
logger.info(f"Celery broker_url = {celery.conf.broker_url}")
logger.info(f"Celery result_backend = {celery.conf.result_backend}")

# -------------------------------------------------
# משימת התמלול
# -------------------------------------------------
@celery.task(bind=True, max_retries=0)
def transcribe_task(self, task_id, input_path, config_dict, user_id):
    from app.services.file_service import upload_outputs_and_update_db

    try:
        logger.info(f"[{task_id}] Starting transcription task")

        # ✅ פונקציית עדכון התקדמות לשידור חי
        def on_progress_handler(data):
            transcriptions_collection.update_one(
                {"task_id": task_id},
                {"$set": {
                    "status": data.get("status", "processing"),
                    "progress": data.get("progress", 0),
                    "updated_at": datetime.utcnow()
                }}
            )

        # סטטוס ראשוני
        transcriptions_collection.update_one(
            {"task_id": task_id},
            {"$set": {
                "status": "processing",
                "progress": 0,
                "lock_timestamp": datetime.utcnow().isoformat()
            }},
            upsert=True
        )

        # 🎛️ טעינת קונפיג
        default_config = load_transcription_config()
        final_config = {**default_config, **(config_dict or {})}
        logger.info(f"[{task_id}] Final config loaded")

        # 🎙️ יצירת מתמלל והרצת תהליך
        transcriber = HebrewTranscriber(config=final_config)

        result = transcriber.transcribe_and_process(
            input_path=input_path,
            task_id=task_id,
            user_id=user_id,
            on_progress=on_progress_handler
        )

        logger.info(f"[{task_id}] Transcription finished. Uploading files...")

        final_status = result.get("status", "completed")
        content = result.get("content", "")

        outputs = {
            "srt": f"results/{task_id}.srt",
            "txt": f"results/{task_id}.txt",
            "pdf": f"results/{task_id}.pdf",
            "docx": f"results/{task_id}.docx"
        }

        r2_files = upload_outputs_and_update_db(task_id, outputs)

        # ✅ מחיקת קבצים זמניים רק אחרי ההעלאה
        try:
            transcriber.clean_temp_files(list(outputs.values()))
        except Exception as e:
            logger.warning(f"[{task_id}] Could not cleanup temp files: {e}")

        # עדכון במסד
        transcriptions_collection.update_one(
            {"task_id": task_id},
            {"$set": {
                "status": final_status,
                "r2_files": r2_files,
                "content": content,
                "completed_at": datetime.utcnow(),
                "progress": 100
            }}
        )

        logger.info(f"[{task_id}] Saved transcription metadata successfully.")
        return result

    except Exception as e:
        logger.exception(f"[{task_id}] Error during transcription: {e}")
        transcriptions_collection.update_one(
            {"task_id": task_id},
            {"$set": {
                "status": "failed",
                "error": str(e),
                "progress": 0
            }}
        )
        self.update_state(state="FAILURE", meta={"exc_message": str(e)})
        raise
