# from celery_worker import celery
# from backend.old.transcribe_video import Config, HebrewTranscriber
# import logging
# from load_env import *
# import traceback
# from celery.exceptions import Ignore
# import time
# import uuid
# import requests  # לשליחת Webhook
#
# logger = logging.getLogger(__name__)
# R2_PUBLIC_BASE = "https://eb0e988de4e9fb026f45d9e3038314e2.r2.cloudflarestorage.com/talkscribe-uploads"
#
# # כתובת webhook לשגיאות חמורות (לדוגמה: Slack, Discord, Email gateway)
# ERROR_WEBHOOK_URL = os.getenv("ERROR_WEBHOOK_URL")  # שים את זה בקובץ .env
#
#
# @celery.task(
#     bind=True,
#     name="tasks.transcribe_task",
#     max_retries=3,
#     default_retry_delay=30
# )
# def transcribe_task(self, task_id, filepath, config_dict):
#     start_time = time.time()
#     trace_id = str(uuid.uuid4())
#
#     try:
#         print(f"⚡ התחיל Celery Task | trace_id={trace_id}")
#         logger.info(f"📥 התחלת משימה {task_id} לקובץ: {filepath} | trace_id={trace_id}")
#
#         config = Config()
#         config.__dict__.update(config_dict)
#         print("🎨 subtitle_style =", config.subtitle_style)
#
#         transcriber = HebrewTranscriber(config)
#         user_id = config_dict.get("user_id")
#         print("📛 USER ID IN CELERY =", user_id)
#
#         result = transcriber.transcribe_and_process(filepath, user_id=user_id)
#         print("🧠 הסתיים transcribe_and_process()")
#         print("📦 result =", result)
#
#         if not isinstance(result, dict):
#             raise ValueError("Task result is not a dictionary")
#         if result.get("status") != "completed":
#             raise ValueError(f"Transcription failed: {result.get('message', 'Unknown error')}")
#
#         output_base = config.output_video.rsplit(".", 1)[0]
#         base_name = os.path.basename(output_base)
#
#         result["task_id"] = task_id
#         result["base_name"] = base_name
#         result["trace_id"] = trace_id
#         result["runtime_seconds"] = round(time.time() - start_time, 2)
#
#         return result
#
#     except Exception as e:
#         tb = traceback.format_exc()
#         logger.error(f"❌ Task {task_id} failed: {e} | trace_id={trace_id}")
#
#         # 🛑 שליחת הודעה על שגיאה
#         if ERROR_WEBHOOK_URL:
#             try:
#                 error_msg = {
#                     "text": f"🚨 *Transcription Task Failed*\n• Task ID: `{task_id}`\n• Trace ID: `{trace_id}`\n• Error: `{str(e)}`\n```{tb[-1000:]}```"
#                 }
#                 requests.post(ERROR_WEBHOOK_URL, json=error_msg)
#             except Exception as webhook_error:
#                 logger.warning(f"⚠️ Webhook failed: {webhook_error}")
#
#         try:
#             self.retry(exc=e)
#             raise Ignore()
#         except self.MaxRetriesExceededError:
#             logger.critical(f"🚨 Max retries exceeded for task {task_id} | trace_id={trace_id}")
#
#         return {
#             "task_id": task_id,
#             "status": "failed",
#             "message": str(e),
#             "traceback": tb,
#             "trace_id": trace_id,
#             "runtime_seconds": round(time.time() - start_time, 2)
#         }
