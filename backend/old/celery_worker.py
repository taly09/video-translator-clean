# # celery_worker.py
# import os  # ← תוודא שזה קיים למעלה
# os.environ["PATH"] += os.pathsep + r"C:\ffmpeg-2025-05-15-git-12b853530a-full_build\bin"
# os.environ["CUDA_VISIBLE_DEVICES"] = "0"
# from celery import Celery
# import logging
#
# print("✅ celery_worker.py נטען בהצלחה עם Redis כ־backend")
#
# # הגדרת לוגים
# logging.basicConfig(
#     level=logging.INFO,
#     format='[%(asctime)s] [%(levelname)s] %(message)s',
# )
#
# logging.getLogger('celery').setLevel(logging.WARNING)
# logging.getLogger('kombu').setLevel(logging.WARNING)
# logging.getLogger('urllib3').setLevel(logging.WARNING)
#
# # יצירת מופע Celery
# celery = Celery(
#     "tasks",
#     broker="redis://localhost:6379/0",
#     backend="redis://localhost:6379/0"
# )
#
# celery.conf.update(
#     task_serializer='json',
#     result_serializer='json',
#     accept_content=['json'],
# )
#
# # מייבא את המשימות (שישבו בקובץ tasks.py באותה תיקיה)
