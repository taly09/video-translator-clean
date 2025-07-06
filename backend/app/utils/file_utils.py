import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def delete_temp_file(path):
    """ מוחק קובץ זמני אם קיים """
    if os.path.exists(path):
        try:
            os.remove(path)
            logger.info(f"🧹 Deleted temp file: {path}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to delete {path}: {e}")
    else:
        logger.debug(f"Temp file not found, skipping delete: {path}")

def generate_file_paths(original_filename, task_id):
    """
    יוצר נתיבים לקבצים תוך שימוש ב-task_id שניתן מבחוץ
    """
    ext = os.path.splitext(original_filename)[1] or ".mp4"

    uploaded_filename = f"{task_id}{ext}"
    input_path = os.path.join("uploads", uploaded_filename)
    output_base = os.path.join("results", task_id)

    # ודא שהתיקיות קיימות
    Path("uploads").mkdir(parents=True, exist_ok=True)
    Path("results").mkdir(parents=True, exist_ok=True)

    logger.debug(f"Generated file paths for task {task_id}: {input_path}, {output_base}")
    return input_path, output_base

def build_config(input_path, output_base, language="auto", translate_to=None):
    """
    בונה קונפיגורציה מלאה עבור HebrewTranscriber
    """
    config = {
        "input_video": input_path,
        "output_audio": output_base + ".wav",
        "output_srt": output_base + ".srt",
        "output_video": output_base + ".mp4",
        "language": None if language == "auto" else language,
        "translation_target": translate_to or None,
        "ffmpeg_path": os.getenv("FFMPEG_PATH", "ffmpeg"),
        "whisper_model": os.getenv("WHISPER_MODEL") or "medium",
        "subtitle_style": {
            "font": "Noto Sans",
            "size": 36,
            "alignment": "bottom_center",
            "primary_color": "#FFFFFF",
            "outline_color": "#000000",
            "outline": 2,
            "shadow": 0,
            "margin_v": 60
        }
    }

    logger.debug(f"Built config: {config}")
    return config
