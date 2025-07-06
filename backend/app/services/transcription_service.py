import subprocess
from faster_whisper import WhisperModel
import os
import json
import logging
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from app.utils.ffmpeg_utils import convert_srt_to_ass, burn_ass_subtitles, get_video_resolution
from app.utils.file_generation import generate_outputs_from_srt
from app.services.file_service import upload_file_to_r2
from app.services.mongo_service import transcriptions_collection, update_user_usage, get_user_usage_and_plan
from billing import is_allowed_to_transcribe
import torch
from app.utils.config_loader import load_transcription_config  # תוסיף את הייבוא הזה למעלה

logger = logging.getLogger(__name__)

class HebrewTranscriber:
    def __init__(self, config):
        self.trace_id = str(uuid.uuid4())  # קודם זה
        default_config = load_transcription_config()
        default_config.update(config or {})
        self.config = default_config
        print(f"[{self.trace_id}] Config used: {self.config}")

        self.duration = 0
        self.source_language = "unknown"
        ffmpeg_path = self.config.get("ffmpeg_path", "ffmpeg")
        self.FFPROBE_PATH = ffmpeg_path.replace("ffmpeg.exe", "ffprobe.exe")
        self.config["ffmpeg_path"] = ffmpeg_path
        logger.info(f"[{self.trace_id}] New transcription started")

    def extract_audio(self):
        cmd = [
            self.config["ffmpeg_path"], "-y",
            "-i", self.config["input_video"],
            "-vn", "-af", "highpass=f=200, lowpass=f=3000, afftdn=nf=-25",
            "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
            self.config["output_audio"]
        ]
        logger.info(f"[{self.trace_id}] Running ffmpeg to extract audio")
        subprocess.run(cmd, check=True, timeout=300)

    def transcribe_audio(self):
        # 🖥️ קביעת device
        device = self.config.get("device", "cuda" if torch.cuda.is_available() else "cpu")

        # בדוק אם cuDNN זמין
        if device == "cuda" and not torch.backends.cudnn.is_available():
            logger.warning(f"[{self.trace_id}] cuDNN not available — switching to CPU")
            device = "cpu"

        logger.info(
            f"[{self.trace_id}] Using device: {device}, CUDA available: {torch.cuda.is_available()}, cuDNN available: {torch.backends.cudnn.is_available()}")

        # 🚀 טעינת מודל
        try:
            model_name = self.config.get("whisper_model", "medium")
            logger.info(f"[{self.trace_id}] Loading model: {model_name}")
            model = WhisperModel(model_name, device=device, compute_type="float16" if device == "cuda" else "float32")
        except Exception as e:
            logger.error(f"[{self.trace_id}] Failed to load model: {e}")
            raise

        # 📌 קביעת מצב (תמלול / תרגום)
        task_mode = "translate" if self.config.get("translation_target") else "transcribe"
        language = None if self.config.get("language") == "auto" else self.config.get("language")

        # 🔍 הדפסת פרמטרים לדיבוג
        logger.info(
            f"[{self.trace_id}] Starting transcription with parameters: "
            f"task={task_mode}, language={language}, "
            f"beam_size={self.config.get('beam_size', 5)}, "
            f"best_of={self.config.get('best_of', 5)}, "
            f"temperature={self.config.get('temperature', 0.0)}, "
            f"compression_ratio_threshold={self.config.get('compression_ratio_threshold', 2.4)}"
        )

        # 📝 הרצת התמלול
        try:
            segments, info = model.transcribe(
                self.config["output_audio"],
                language=language,
                task=task_mode,
                word_timestamps=True,
                beam_size=self.config.get("beam_size", 5),
                temperature=self.config.get("temperature", 0.0),
            )
        except Exception as e:
            logger.error(f"[{self.trace_id}] Transcription failed: {e}", exc_info=True)
            raise

        # 🏁 עדכון שפה וזיהוי תוצאה
        self.source_language = info.language if info else "unknown"
        logger.info(f"[{self.trace_id}] Transcription completed. Detected language: {self.source_language}")

        return [
            {"start": seg.start, "end": seg.end, "text": seg.text}
            for seg in segments
        ]

    def generate_srt(self, segments):
        srt_path = self.config["output_srt"]
        with open(srt_path, "w", encoding="utf-8") as f:
            for idx, seg in enumerate(segments, 1):
                start = self._format_time(seg["start"])
                end = self._format_time(seg["end"])
                f.write(f"{idx}\n{start} --> {end}\n{seg['text']}\n\n")
        logger.info(f"[{self.trace_id}] SRT generated at {srt_path}")
        return srt_path

    def _format_time(self, seconds):
        td = timedelta(seconds=seconds)
        total_seconds = int(td.total_seconds())
        milliseconds = int((td.total_seconds() - total_seconds) * 1000)
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        secs = total_seconds % 60
        return f"{hours:02}:{minutes:02}:{secs:02},{milliseconds:03}"

    def _get_video_duration(self, path):
        try:
            result = subprocess.run(
                [self.FFPROBE_PATH, "-v", "error", "-show_entries", "format=duration", "-of", "json", path],
                capture_output=True, text=True, check=True, timeout=30
            )
            data = json.loads(result.stdout)
            duration = int(float(data["format"]["duration"]))
            logger.info(f"[{self.trace_id}] Video duration: {duration} sec")
            return duration
        except Exception as e:
            logger.warning(f"[{self.trace_id}] Could not get video duration: {e}")
            return 0

    def clean_temp_files(self, paths):
        for path in paths:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                    logger.info(f"[{self.trace_id}] Deleted temp file: {path}")
                except Exception as e:
                    logger.warning(f"[{self.trace_id}] Could not delete temp file {path}: {e}")

    def transcribe_and_process(self, input_path, task_id, user_id=None):
        try:
            self.config["input_video"] = input_path
            self.config["output_audio"] = f"{task_id}.wav"
            self.config["output_srt"] = f"{task_id}.srt"

            # בדוק מגבלות משתמש
            if user_id:
                plan, usage = get_user_usage_and_plan(user_id)
                if not is_allowed_to_transcribe(plan, usage):
                    logger.info(f"[{self.trace_id}] User {user_id} exceeded plan limits")
                    return {"status": "denied", "trace_id": self.trace_id, "message": "Exceeded plan limit"}

            # עדכן למסד: התחלת עיבוד
            transcriptions_collection.update_one(
                {"task_id": task_id},
                {"$setOnInsert": {
                    "task_id": task_id,
                    "user_id": user_id,
                    "file_name": os.path.basename(input_path),
                    "created_at": datetime.utcnow(),
                    "trace_id": self.trace_id
                },
                    "$set": {
                        "status": "processing",
                        "updated_at": datetime.utcnow()
                    }},
                upsert=True
            )

            self.duration = self._get_video_duration(input_path)
            self.extract_audio()
            segments = self.transcribe_audio()
            srt_path = self.generate_srt(segments)
            txt_path, docx_path, pdf_path = generate_outputs_from_srt(srt_path, task_id)

            ass_path = f"{task_id}.ass"
            burned_path = f"{task_id}_burned.mp4"
            resolution = get_video_resolution(input_path)
            convert_srt_to_ass(
                srt_path, ass_path,
                resolution=resolution,
                style_config=self.config["subtitle_style"],
                rtl=self.source_language in ["he", "ar", "fa"]
            )
            burn_ass_subtitles(input_path, ass_path, burned_path)

            # העלאה
            R2_PUBLIC_BASE = os.getenv("R2_PUBLIC_BASE", "https://example.com")

            def upload_and_url(local_path, r2_key):
                try:
                    success = upload_file_to_r2(local_path, r2_key)
                    if success:
                        return f"{R2_PUBLIC_BASE}/{r2_key}"
                    else:
                        logger.warning(f"[{self.trace_id}] Upload failed: {local_path}")
                        return None
                except Exception as e:
                    logger.error(f"[{self.trace_id}] Upload error: {local_path} - {e}")
                    return None

            urls = {
                "srt": upload_and_url(srt_path, f"{task_id}/{task_id}.srt"),
                "txt": upload_and_url(txt_path, f"{task_id}/{task_id}.txt"),
                "docx": upload_and_url(docx_path, f"{task_id}/{task_id}.docx"),
                "pdf": upload_and_url(pdf_path, f"{task_id}/{task_id}.pdf"),
                "mp4": upload_and_url(burned_path, f"{task_id}/{task_id}_burned.mp4"),
            }

            text_content = "\n".join([seg["text"] for seg in segments])

            transcriptions_collection.update_one(
                {"task_id": task_id},
                {"$set": {
                    "language": self.source_language,
                    "duration": self.duration,
                    "completed_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "r2_urls": urls,
                    "status": "completed",
                    "content": text_content
                }}
            )

            if user_id:
                update_user_usage(user_id, self.duration)

            self.clean_temp_files([
                self.config["output_audio"], srt_path, txt_path, docx_path,
                pdf_path, ass_path, burned_path
            ])

            logger.info(f"[{self.trace_id}] Task {task_id} completed successfully.")
            return {
                "status": "completed",
                "trace_id": self.trace_id,
                "duration": self.duration,
                "language": self.source_language,
                "r2_urls": urls,
                "content": text_content
            }

        except Exception as e:
            logger.error(f"[{self.trace_id}] Error during processing: {e}", exc_info=True)
            transcriptions_collection.update_one(
                {"task_id": task_id},
                {"$set": {
                    "status": "failed",
                    "error": str(e),
                    "updated_at": datetime.utcnow()
                }}
            )
            return {"status": "failed", "trace_id": self.trace_id, "message": str(e)}
