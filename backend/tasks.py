from celery_worker import celery
from transcribe_video import Config, HebrewTranscriber
import os
import logging
from load_env import *

from r2_client import upload_file_to_r2  # ← בתחילת הקובץ אם עדיין לא קיים
R2_PUBLIC_BASE = "https://eb0e988de4e9fb026f45d9e3038314e2.r2.cloudflarestorage.com/talkscribe-uploads"

logger = logging.getLogger(__name__)

@celery.task(bind=True, name="tasks.transcribe_task")
def transcribe_task(self, task_id, filepath, config_dict):
    try:
        print("⚡ התחיל Celery Task")  # ← שורת וידוא שהפונקציה התחילה לפעול

        logger.info(f"📥 התחלת משימה {task_id} לקובץ: {filepath}")

        # טעינת קונפיגורציה
        config = Config()
        for k, v in config_dict.items():
            setattr(config, k, v)

        # יצירת מתמלל
        transcriber = HebrewTranscriber(config)

        # תמלול
        result = transcriber.transcribe_and_process(filepath)
        print("🧠 הסתיים transcribe_and_process()")
        print("📦 result =", result)

        print("DEBUG: result =", result)
        print("DEBUG: type =", type(result))

        if isinstance(result, dict):
            if result.get("status") != "completed":
                raise ValueError(f"Transcription failed: {result.get('message')}")

            output_base = config.output_video.rsplit(".", 1)[0]  # בלי הסיומת
            base_name = os.path.basename(output_base)

            result["task_id"] = task_id  # לוודא קיים
            result["base_name"] = base_name

            return result

        raise ValueError(f"Unexpected result from transcribe_and_process: {result}")


    except Exception as e:
        import traceback
        logger.error(f"❌ Task {task_id} failed: {str(e)}")

        return {
            "task_id": task_id,
            "status": "failed",
            "message": str(e),
            "traceback": traceback.format_exc()
        }
