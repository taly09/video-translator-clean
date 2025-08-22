
import os
import json
import logging
import uuid
import tempfile
import shutil
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List

import requests
import torch
from faster_whisper import WhisperModel

from app.utils.ffmpeg_utils import (
    convert_srt_to_ass_with_styles,
    burn_ass_subtitles,            # נשאר ל-עתיד (כרגע לא בשימוש)
    get_video_resolution,
)
from app.utils.file_generation import generate_outputs_from_srt
from app.services.file_service import upload_file_to_r2
from app.services.mongo_service import (
    transcriptions_collection,
    update_user_usage,
    get_user_usage_and_plan,
)
from billing import is_allowed_to_transcribe
from app.utils.config_loader import load_transcription_config
from app.utils.subtitle_utils import split_segment_by_punctuation_and_timing

logger = logging.getLogger(__name__)

# ===============================
#       Whisper singleton
# ===============================
_DEVICE = (
    "cuda"
    if torch.cuda.is_available() and torch.backends.cudnn.is_available()
    else "cpu"
)
_MODEL_NAME = os.getenv("WHISPER_MODEL", "medium")
_COMPUTE_TYPE = "float16" if _DEVICE == "cuda" else "float32"

try:
    _WHISPER = WhisperModel(_MODEL_NAME, device=_DEVICE, compute_type=_COMPUTE_TYPE)
    logger.info(
        f"[whisper-init] model={_MODEL_NAME} device={_DEVICE} compute_type={_COMPUTE_TYPE}"
    )
except Exception as e:
    logger.exception(f"[whisper-init] failed loading Whisper model: {e}")
    _WHISPER = None  # נזרוק שגיאה ידידותית אם ננסה להשתמש

# מגבלת אורך וידאו (בשניות) – כדי לא לשרוף משאבים על קבצים לא הגיוניים
MAX_VIDEO_SECONDS = int(os.getenv("MAX_VIDEO_SECONDS", "7200"))  # ברירת מחדל 2 שעות


def get_style_type_from_caption_mode(caption_mode: Optional[str]) -> str:
    return {
        "word-by-word": "wordByWord",
        "word-by-word-cumulative": "cumulativeWordByWord",
        "typewriter-highlight": "cumulativeWordByWord",
        "typewriter": "cumulativeWordByWord",
        "word-pop": "wordByWord",
        "karaoke": "boldWord",
        "bounce": "boldWord",
        "wave": "boldWord",
        "glow": "boldWord",
        "slide-up": "boldWord",
        "fade-in": "boldWord",
        "highlight-sweep": "boldWord",
        "split-reveal": "boldWord",
        "bold-word": "boldWord",
        "highlight-words": "highlightWords",
    }.get(caption_mode or "", "default")


def _ffprobe_path(ffmpeg_path: str) -> str:
    """
    מנסה לאתר ffprobe בהתאם ל-ffmpeg שסופק, או משתמש ב-ffprobe מה-Path.
    """
    if ffmpeg_path.lower().endswith("ffmpeg.exe"):
        candidate = ffmpeg_path.replace("ffmpeg.exe", "ffprobe.exe")
        if Path(candidate).exists():
            return candidate
    elif ffmpeg_path.lower().endswith("ffmpeg"):
        candidate = ffmpeg_path.replace("ffmpeg", "ffprobe")
        # לא תמיד קיים באותו נתיב – ננסה which
    p = shutil.which("ffprobe")
    return p or "ffprobe"


def _safe_mkdir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def _download_from_r2(task_id: str, timeout_sec: int = 60) -> str:
    """
    הורדת הווידאו המקורי מ-R2 לתיקיית tmp פר-משימה, אם אין קובץ לוקלי.
    """
    from app.services.file_service import s3_client

    bucket = os.getenv("R2_BUCKET_NAME")
    if not bucket:
        raise RuntimeError("R2_BUCKET_NAME is not configured")

    t = transcriptions_collection.find_one(
        {"task_id": task_id}, {"video_r2_key": 1, "_id": 0}
    )
    if not t or not t.get("video_r2_key"):
        raise RuntimeError(f"video_r2_key missing for task {task_id}")

    key = t["video_r2_key"]
    url = s3_client.generate_presigned_url(
        "get_object", Params={"Bucket": bucket, "Key": key}, ExpiresIn=1800
    )

    tmp_dir = Path(tempfile.gettempdir()) / f"transcribe_{task_id}"
    _safe_mkdir(tmp_dir)
    local_path = tmp_dir / "input.mp4"

    logger.info(f"[{task_id}] downloading source video from R2 -> {local_path}")
    with requests.get(url, stream=True, timeout=timeout_sec) as r:
        r.raise_for_status()
        with open(local_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)
    return str(local_path)


class HebrewTranscriber:
    def __init__(self, config: Optional[dict]):
        self.trace_id = str(uuid.uuid4())
        default_config = load_transcription_config()
        default_config.update(config or {})
        self.config = default_config

        # ffmpeg/ffprobe
        ffmpeg_path = self.config.get("ffmpeg_path", "ffmpeg")
        self.config["ffmpeg_path"] = ffmpeg_path
        self.FFPROBE_PATH = _ffprobe_path(ffmpeg_path)

        self.duration = 0
        self.source_language = "unknown"

        logger.info(f"[{self.trace_id}] New transcription started with config")

    # ---------- Media ops ----------

    def extract_audio(self):
        cmd = [
            self.config["ffmpeg_path"],
            "-y",
            "-i",
            self.config["input_video"],
            "-vn",
            "-af",
            "highpass=f=200, lowpass=f=3000, afftdn=nf=-25",
            "-acodec",
            "pcm_s16le",
            "-ar",
            "16000",
            "-ac",
            "1",
            self.config["output_audio"],
        ]
        logger.info(f"[{self.trace_id}] ffmpeg extract start")
        try:
            subprocess.run(
                cmd,
                check=True,
                timeout=300,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
        except subprocess.TimeoutExpired:
            logger.error(f"[{self.trace_id}] ffmpeg extract timeout")
            raise
        except subprocess.CalledProcessError as e:
            logger.error(
                f"[{self.trace_id}] ffmpeg extract failed: {e.stderr[:1000] if e.stderr else e}"
            )
            raise

    # ---------- Main flow ----------

    def transcribe_and_process(
            self,
            input_path: Optional[str],
            task_id: str,
            user_id: Optional[str] = None,
            on_progress=None,
    ):
        try:
            # --- קלט: מקומי או הורדה מ-R2 (עם בדיקת ENV וטיפול שגיאות) ---
            if input_path and os.path.exists(input_path):
                video_input = input_path
            else:
                bucket = os.getenv("R2_BUCKET_NAME")
                if not bucket:
                    logger.error(f"[{self.trace_id}] Missing R2_BUCKET_NAME, cannot download from R2")
                    return {
                        "status": "failed",
                        "trace_id": self.trace_id,
                        "message": "Video file missing and R2 storage is not configured",
                    }
                try:
                    video_input = _download_from_r2(task_id)  # משתמש ב-video_r2_key מה-DB
                except Exception as e:
                    logger.exception(f"[{self.trace_id}] Error downloading from R2: {e}")
                    return {
                        "status": "failed",
                        "trace_id": self.trace_id,
                        "message": f"Could not download source video from storage: {e}",
                    }

            work_dir = Path(tempfile.gettempdir()) / f"transcribe_{task_id}"
            _safe_mkdir(work_dir)
            self.config["input_video"] = video_input
            self.config["output_audio"] = str(work_dir / f"{task_id}.wav")
            self.config["output_srt"] = str(work_dir / f"{task_id}.srt")

            # הרשאות לפי תכנית
            if user_id:
                plan, usage = get_user_usage_and_plan(user_id)
                if not is_allowed_to_transcribe(plan, usage):
                    logger.info(f"[{self.trace_id}] User {user_id} exceeded plan limits")
                    return {
                        "status": "denied",
                        "trace_id": self.trace_id,
                        "message": "Exceeded plan limit",
                    }

            transcriptions_collection.update_one(
                {"task_id": task_id},
                {
                    "$setOnInsert": {
                        "task_id": task_id,
                        "user_id": user_id,
                        "file_name": os.path.basename(video_input),
                        "created_at": datetime.utcnow(),
                        "trace_id": self.trace_id,
                    },
                    "$set": {
                        "status": "processing",
                        "updated_at": datetime.utcnow(),
                    },
                },
                upsert=True,
            )

            # משך וידאו + הגבלת אורך
            self.duration = self._get_video_duration(video_input)
            if self.duration and self.duration > MAX_VIDEO_SECONDS:
                transcriptions_collection.update_one(
                    {"task_id": task_id},
                    {
                        "$set": {
                            "status": "failed",
                            "error": f"Video too long ({self.duration}s > {MAX_VIDEO_SECONDS}s limit)",
                            "updated_at": datetime.utcnow(),
                        }
                    },
                )
                return {
                    "status": "failed",
                    "trace_id": self.trace_id,
                    "message": "Video duration exceeds plan limit",
                }

            if on_progress:
                on_progress({"status": "extracting_audio", "progress": 5})
            self.extract_audio()

            if on_progress:
                on_progress({"status": "transcribing", "progress": 15})

            # Whisper singleton
            if _WHISPER is None:
                raise RuntimeError("Whisper model not initialized")
            model = _WHISPER

            task_mode = "translate" if self.config.get("translation_target") else "transcribe"
            language = None if self.config.get("language") == "auto" else self.config.get("language")

            segments_for_srt: List[dict] = []
            segments_for_burn: List[dict] = []

            segment_generator, info = model.transcribe(
                self.config["output_audio"],
                language=language,
                task=task_mode,
                word_timestamps=True,
                beam_size=self.config.get("beam_size", 5),
                temperature=self.config.get("temperature", 0.0),
            )

            self.source_language = info.language
            rtl_flag = self.source_language in ["he", "ar", "fa", "ur"]

            caption_mode = self.config.get("caption_mode", "full")

            for seg in segment_generator:
                base_segment = {
                    "start": seg.start,
                    "end": seg.end,
                    "text": seg.text,
                    "words": [
                        {"word": w.word, "start": w.start, "end": w.end}
                        for w in getattr(seg, "words", [])
                    ],
                }

                split_segments = split_segment_by_punctuation_and_timing(
                    base_segment,
                    max_chars=80,
                    max_duration=6.0,
                    language=self.source_language,
                )

                for s in split_segments:
                    s["words"] = [
                        w for w in base_segment["words"]
                        if s["start"] <= w["start"] <= s["end"]
                    ]

                    style = {"highlightColor": "#FFFF00"}

                    if caption_mode in [
                        "word-by-word", "word-pop", "word-by-word-cumulative",
                        "typewriter", "typewriter-highlight"
                    ]:
                        if s["words"]:
                            style["highlightWord"] = s["words"][0]["word"]

                    if caption_mode == "highlight-words":
                        style["highlightKeywords"] = [w["word"] for w in s["words"]]

                    s["style"] = style

                    segments_for_srt.append(s)
                    segments_for_burn.append(s)

                if on_progress and self.duration > 0:
                    percent = int((seg.end / self.duration) * 60)
                    on_progress({"status": "transcribing", "progress": min(percent, 60)})

            # קבצי פלט כתוביות/טקסט
            srt_path = self.generate_srt(segments_for_srt)
            vtt_path = srt_path.replace(".srt", ".vtt")
            self.srt_to_vtt(srt_path, vtt_path)
            txt_path, docx_path, pdf_path = generate_outputs_from_srt(srt_path, task_id)

            # הכנה לקובץ ASS (אם תרצה לצרוב בעתיד)
            ass_path = str(work_dir / f"{task_id}.ass")
            burned_path = str(work_dir / f"{task_id}_burned.mp4")  # כרגע לא בשימוש
            resolution = get_video_resolution(video_input)
            style_type = get_style_type_from_caption_mode(caption_mode)

            convert_srt_to_ass_with_styles(
                segments=segments_for_burn,
                ass_path=ass_path,
                resolution=resolution,
                rtl=self.source_language in ["he", "ar", "fa"],
                style_type=style_type,
            )

            if on_progress:
                on_progress({"status": "uploading", "progress": 90})

            # ===== URLs =====
            R2_PUBLIC_BASE = os.getenv("R2_PUBLIC_BASE", "https://example.com")

            def upload_and_url(local_path: str, r2_key: str) -> Optional[str]:
                try:
                    ok = upload_file_to_r2(local_path, r2_key)
                    return f"{R2_PUBLIC_BASE}/{r2_key}" if ok else None
                except Exception as e:
                    logger.error(f"[{self.trace_id}] Upload error: {local_path} - {e}")
                    return None

            # אם יש כבר video_r2_key – אל תעלה מחדש mp4; פשוט תבנה URL
            rec = transcriptions_collection.find_one(
                {"task_id": task_id}, {"video_r2_key": 1, "_id": 0}
            )
            video_key = rec.get("video_r2_key") if rec else None
            if not video_key and os.path.exists(video_input):
                inferred_key = f"{task_id}/{os.path.basename(video_input)}"
                if upload_file_to_r2(video_input, inferred_key):
                    video_key = inferred_key
                    transcriptions_collection.update_one(
                        {"task_id": task_id}, {"$set": {"video_r2_key": video_key}}
                    )

            urls = {
                "srt": upload_and_url(srt_path, f"{task_id}/{task_id}.srt"),
                "vtt": upload_and_url(vtt_path, f"{task_id}/{task_id}.vtt"),
                "txt": upload_and_url(txt_path, f"{task_id}/{task_id}.txt"),
                "docx": upload_and_url(docx_path, f"{task_id}/{task_id}.docx"),
                "pdf": upload_and_url(pdf_path, f"{task_id}/{task_id}.pdf"),
            }
            if video_key:
                urls["mp4"] = f"{R2_PUBLIC_BASE}/{video_key}"

            text_content = "\n".join([seg["text"] for seg in segments_for_srt])

            if on_progress:
                on_progress({"status": "completed", "progress": 100})

            transcriptions_collection.update_one(
                {"task_id": task_id},
                {
                    "$set": {
                        "language": self.source_language,
                        "rtl": rtl_flag,
                        "duration": self.duration,
                        "completed_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow(),
                        "r2_urls": urls,
                        "segments": segments_for_srt,
                        "status": "completed",
                        "content": text_content,
                    }
                },
            )

            if user_id:
                update_user_usage(user_id, self.duration)

            # ניקוי קבצים זמניים
            tmp_files = [
                self.config["output_audio"],
                srt_path,
                vtt_path,
                txt_path,
                docx_path,
                pdf_path,
                ass_path,
                # burned_path,
            ]
            self.clean_temp_files(tmp_files)

            return {
                "status": "completed",
                "trace_id": self.trace_id,
                "duration": self.duration,
                "language": self.source_language,
                "r2_urls": urls,
                "content": text_content,
            }

        except Exception as e:
            logger.error(f"[{self.trace_id}] Error during processing: {e}", exc_info=True)
            transcriptions_collection.update_one(
                {"task_id": task_id},
                {"$set": {"status": "failed", "error": str(e), "updated_at": datetime.utcnow()}},
            )
            return {"status": "failed", "trace_id": self.trace_id, "message": str(e)}

    # ---------- Helpers ----------

    def generate_srt(self, segments: List[dict]) -> str:
        srt_path = self.config["output_srt"]
        with open(srt_path, "w", encoding="utf-8") as f:
            for idx, seg in enumerate(segments, 1):
                start = self._format_time(seg["start"])
                end = self._format_time(seg["end"])
                f.write(f"{idx}\n{start} --> {end}\n{seg['text']}\n\n")
        logger.info(f"[{self.trace_id}] SRT generated at {srt_path}")
        return srt_path

    def srt_to_vtt(self, srt_path: str, vtt_path: str) -> None:
        with open(srt_path, "r", encoding="utf-8") as srt_file:
            lines = srt_file.readlines()
        with open(vtt_path, "w", encoding="utf-8") as vtt_file:
            vtt_file.write("WEBVTT\n\n")
            for line in lines:
                if "-->" in line:
                    line = line.replace(",", ".")
                vtt_file.write(line)
        logger.info(f"[{self.trace_id}] Converted SRT to VTT at {vtt_path}")

    def _format_time(self, seconds: float) -> str:
        td = timedelta(seconds=seconds)
        total_seconds = int(td.total_seconds())
        milliseconds = int((td.total_seconds() - total_seconds) * 1000)
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        secs = total_seconds % 60
        return f"{hours:02}:{minutes:02}:{secs:02},{milliseconds:03}"

    def _get_video_duration(self, path: str) -> int:
        try:
            result = subprocess.run(
                [self.FFPROBE_PATH, "-v", "error", "-show_entries", "format=duration", "-of", "json", path],
                capture_output=True,
                text=True,
                check=True,
                timeout=30,
            )
            data = json.loads(result.stdout)
            duration = int(float(data["format"]["duration"]))
            logger.info(f"[{self.trace_id}] Video duration: {duration} sec")
            return duration
        except Exception as e:
            logger.warning(f"[{self.trace_id}] Could not get video duration: {e}")
            return 0

    def clean_temp_files(self, paths: List[str]) -> None:
        # מחיקת קבצים ספציפיים
        for p in paths:
            try:
                if p and os.path.exists(p):
                    os.remove(p)
                    logger.info(f"[{self.trace_id}] Deleted temp file: {p}")
            except Exception as e:
                logger.warning(f"[{self.trace_id}] Could not delete temp file {p}: {e}")
        # מחיקת תקיית העבודה אם היא ב-tmp
        try:
            if paths:
                base_dir = Path(paths[0]).parent
                tmp_root = Path(tempfile.gettempdir())
                if base_dir.exists() and str(base_dir).startswith(str(tmp_root)):
                    shutil.rmtree(base_dir, ignore_errors=True)
        except Exception as e:
            logger.warning(f"[{self.trace_id}] cleanup dir failed: {e}")

