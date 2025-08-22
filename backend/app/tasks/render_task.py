# tasks/render_task.py

from celery import Celery
import subprocess
import os
from app.services.mongo_service import transcriptions_collection

celery = Celery('render', broker='redis://localhost:6379/0')

@celery.task(bind=True)
def remotion_render_task(self, task_id, segments, options):
    try:
        # שמירת JSON לסגמנטים זמני
        segments_path = f'/tmp/{task_id}_segments.json'
        with open(segments_path, 'w', encoding='utf-8') as f:
            import json
            json.dump(segments, f)

        # נתיב פלט
        output_path = f'/tmp/{task_id}_output.webm'

        # פקודת הרינדור
        cmd = [
            'npx', 'remotion', 'render',
            'src/index.tsx', 'MyComp', output_path,
            '--props', segments_path,
            '--codec', 'vp8',
            '--overwrite',
        ]

        # אפשר להוסיף פרמטרים לפי options, למשל רינדור מהיר

        # ריצה של הפקודה
        subprocess.run(cmd, check=True)

        # העלאה ל-S3 או R2 - מימוש שלך
        from app.services.file_service import upload_file_to_r2
        upload_file_to_r2(output_path, f'{task_id}/{task_id}_output.webm')

        # עדכון DB
        transcriptions_collection.update_one(
            {'task_id': task_id},
            {'$set': {'status': 'completed', 'output_video_url': f'https://your-r2-url/{task_id}/{task_id}_output.webm'}}
        )

        return {'status': 'success', 'url': f'https://your-r2-url/{task_id}/{task_id}_output.webm'}

    except subprocess.CalledProcessError as e:
        transcriptions_collection.update_one({'task_id': task_id}, {'$set': {'status': 'failed'}})
        raise self.retry(exc=e, countdown=10, max_retries=3)
