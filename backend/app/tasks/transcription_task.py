from dotenv import load_dotenv
import os
import logging
from celery import Celery
from app.services.transcription_service import HebrewTranscriber
from app.services.mongo_service import transcriptions_collection
from app.services.file_service import init_s3_client
from app.utils.config_loader import load_transcription_config
from datetime import datetime

# טעינת .env.local
env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
load_dotenv(dotenv_path=env_path)

# אתחול S3/R2 client
init_s3_client()

# אתחול Celery
celery = Celery(
    "tasks",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
)

# הגדרת לוגים
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("transcription_task.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@celery.task(bind=True, max_retries=0)
def transcribe_task(self, task_id, input_path, config_dict, user_id):
    from app.services.file_service import upload_outputs_and_update_db

    try:
        logger.info(f"[{task_id}] Starting transcription task")
        # עדכון סטטוס לנעילה ומצב פעיל
        transcriptions_collection.update_one(
            {"task_id": task_id},
            {"$set": {
                "status": "processing",
                "lock_timestamp": datetime.utcnow().isoformat()
            }},
            upsert=True
        )

        # טעינת קונפיג לתמלול
        default_config = load_transcription_config()
        final_config = {**default_config, **(config_dict or {})}
        logger.info(f"[{task_id}] Final config: {final_config}")

        # יצירת מופע מתמלל והרצת התהליך
        transcriber = HebrewTranscriber(config=final_config)
        # חשוב: להעביר את ה-task_id כך שכל השמות והתיעוד במסד יהיו אחידים
        result = transcriber.transcribe_and_process(input_path, task_id=task_id, user_id=user_id)

        logger.info(f"[{task_id}] Transcription finished. Processing result.")

        # חילוץ נתונים לשמירה
        final_status = result.get("status", "completed")
        content = result.get("content", "")  # שם המתוקן מתייחס ל-"content" ולא "text_content"

        # העלאת קבצים ל-R2 ועדכון במסד
        outputs = {
            "srt": f"results/{task_id}.srt",
            "txt": f"results/{task_id}.txt",
            "pdf": f"results/{task_id}.pdf",
            "docx": f"results/{task_id}.docx"
        }
        r2_files = upload_outputs_and_update_db(task_id, outputs)

        transcriptions_collection.update_one(
            {"task_id": task_id},
            {"$set": {
                "status": final_status,
                "r2_files": r2_files,
                "content": content,
                "completed_at": datetime.utcnow()
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
                "error": str(e)
            }}
        )
        self.update_state(state="FAILURE", meta={"exc_message": str(e)})
        raise