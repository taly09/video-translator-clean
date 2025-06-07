import whisper
import os
import subprocess
import logging
from datetime import timedelta
from pathlib import Path
import json
import sys
import openai
from docx import Document
from fpdf import FPDF
import cv2  # שים למעלה אם עדיין לא מיובא
from r2_client import upload_file_to_r2


from utils import translate_segments

# הגדרת PATH ל־ffmpeg
os.environ["PATH"] = r"C:\\ffmpeg-2025-05-15-git-12b853530a-full_build\\bin" + os.pathsep + os.environ["PATH"]

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def update_status(step, progress):
    with open("../status.json", "w", encoding="utf-8") as f:
        json.dump({"step": step, "progress": progress}, f)

class Config:
    def __init__(self):
        self.load_config()

    def load_config(self):
        default_config = {
            "openai_api_key": "",
            "whisper_model": "large-v3",
            "ffmpeg_path": "C:/ffmpeg-2025-05-15-git-12b853530a-full_build/bin/ffmpeg.exe",
            "input_video": "video.mp4",
            "output_audio": "temp_audio.wav",
            "output_srt": "subtitles.srt",
            "language": "auto",
            "translation_target": None
        }
        try:
            with open('config.json', 'r', encoding='utf-8') as f:
                config = json.load(f)
            self.__dict__.update({k: v for k, v in config.items() if v is not None})
        except FileNotFoundError:
            logger.warning("Config file not found, using default settings")
            self.__dict__.update(default_config)
        except json.JSONDecodeError:
            logger.error("Invalid config file format")
            sys.exit(1)

class HebrewTranscriber:
    def __init__(self, config):
        self.config = config
        self.setup_ffmpeg()

    def setup_ffmpeg(self):
        try:
            subprocess.run([self.config.ffmpeg_path, "-version"], capture_output=True, check=True)
            logger.info("✅ FFmpeg זוהה ומוכן")
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.error("❌ FFmpeg לא נמצא. ודא שהנתיב נכון")
            sys.exit(1)

    def extract_audio(self):
        logger.info(f"🎵 חילוץ אודיו מ־{self.config.input_video}")
        try:
            subprocess.run([
                self.config.ffmpeg_path,
                "-y",
                "-i", self.config.input_video,
                "-vn",
                "-acodec", "pcm_s16le",
                "-ar", "16000",
                "-ac", "1",
                self.config.output_audio
            ], check=True, capture_output=True, text=True)
            if not os.path.exists(self.config.output_audio):
                raise FileNotFoundError(f"קובץ {self.config.output_audio} לא נוצר")
            logger.info(f"✅ אודיו נוצר: {self.config.output_audio}")
        except Exception as e:
            logger.error(f"❌ שגיאה בחילוץ האודיו: {str(e)}")
            raise

    def transcribe_audio(self):
        logger.info("🧠 הרצת תמלול עם Whisper")
        try:
            model = whisper.load_model(self.config.whisper_model)
            # קובע האם לבצע תרגום או תמלול, לפי הקונפיג
            task_mode = "translate" if self.config.translation_target else "transcribe"

            # מריץ את Whisper עם המשימה המתאימה
            language = None if self.config.language == "auto" else self.config.language

            result = model.transcribe(
                self.config.output_audio,
                language=language,
                word_timestamps=True,
                task=task_mode
            )

            # משתמש בפלט כרגיל
            segments = result["segments"]
            text = result["text"]

            # לא צריך יותר תרגום חיצוני
            # כלומר: תוכל למחוק או לבטל את translate_segments

            self.source_language = result.get("language", "unknown")
            return result['segments']
        except Exception as e:
            logger.error(f"❌ שגיאה בתמלול: {str(e)}")
            raise

        except Exception as e:
            logger.error(f"❌ שגיאה בתמלול (faster-whisper): {str(e)}")
            raise

    def format_timestamp(self, seconds):
        td = timedelta(seconds=seconds)
        total = str(td)
        if '.' in total:
            total = total.split('.')[0] + ',' + total.split('.')[1][:3]
        else:
            total = total + ',000'
        if len(total.split(':')[0]) == 1:
            total = "0" + total
        return total

    def generate_txt(self, segments, output_path):
        try:
            with open(output_path, "w", encoding="utf-8") as f:
                for seg in segments:
                    f.write(seg["text"].strip() + "\n")
            logger.info(f"✅ קובץ TXT נוצר: {output_path}")
        except Exception as e:
            logger.error(f"❌ שגיאה ביצירת TXT: {str(e)}")

    def generate_docx(self, segments, output_path):
        try:
            doc = Document()
            for seg in segments:
                doc.add_paragraph(seg["text"].strip())
            doc.save(output_path)
            logger.info(f"✅ קובץ DOCX נוצר: {output_path}")
        except Exception as e:
            logger.error(f"❌ שגיאה ביצירת DOCX: {str(e)}")

    def generate_pdf(self, segments, output_path):
        try:
            pdf = FPDF()
            pdf.add_page()
            pdf.add_font("Arial", "", fname="C:\\Windows\\Fonts\\arial.ttf", uni=True)
            pdf.set_font("Arial", size=12)
            for seg in segments:
                pdf.multi_cell(0, 10, seg["text"].strip())
            pdf.output(output_path)
            logger.info(f"✅ קובץ PDF נוצר: {output_path}")
        except Exception as e:
            logger.error(f"❌ שגיאה ביצירת PDF: {str(e)}")

    def generate_srt(self, segments):
        srt_path = self.config.output_srt
        logger.info(f"📄 יצירת קובץ SRT: {srt_path}")
        try:
            with open(srt_path, "w", encoding="utf-8") as f:
                for i, seg in enumerate(segments, start=1):
                    start = self.format_timestamp(seg['start'])
                    end = self.format_timestamp(seg['end'])
                    text = seg['text'].strip()
                    f.write(f"{i}\n{start} --> {end}\n{text}\n\n")
            logger.info("✅ קובץ SRT נוצר בהצלחה")
        except Exception as e:
            logger.error(f"❌ שגיאה ביצירת SRT: {str(e)}")
            raise

    def embed_subtitles(self, video_path, srt_path, output_video_path):
        logger.info(f"📹 הסרת כתוביות קיימות והוספת חדשות מ־{srt_path} ל־{video_path}")
        try:
            video_path = os.path.abspath(video_path)
            srt_path = os.path.abspath(srt_path)
            output_video_path = os.path.abspath(output_video_path)
            temp_clean_video = video_path.replace(".mp4", "_no_subs.mp4")

            # 🔁 שלב 1 – הסרת כל רצועות הכתוביות הקיימות מהווידאו
            remove_cmd = [
                self.config.ffmpeg_path,
                "-y",
                "-i", video_path,
                "-map", "0",
                "-map", "-0:s",  # הסרה של כל כתוביות
                "-c", "copy",
                temp_clean_video
            ]
            subprocess.run(remove_cmd, check=True, capture_output=True)

            # 🎯 שלב 2 – הוספת כתוביות חדשות בלבד
            command = [
                self.config.ffmpeg_path,
                "-y",
                "-i", temp_clean_video,
                "-f", "srt",
                "-i", srt_path,
                "-map", "0",
                "-map", "1",
                "-c:v", "copy",
                "-c:a", "copy",
                "-c:s", "mov_text",
                "-metadata:s:s:0", "language=heb",
                output_video_path
            ]
            result = subprocess.run(command, capture_output=True, text=True)
            if result.returncode != 0:
                raise RuntimeError(result.stderr)

            logger.info(f"✅ סרטון עם כתוביות צורף בהצלחה: {output_video_path}")

            # 🧹 ניקוי קובץ ביניים
            if os.path.exists(temp_clean_video):
                os.remove(temp_clean_video)

        except Exception as e:
            logger.error(f"❌ שגיאה בהוספת כתוביות: {str(e)}")
            raise

    def clean_temp_files(self):
        try:
            if os.path.exists(self.config.output_audio):
                os.remove(self.config.output_audio)
                logger.info(f"🧹 נמחק קובץ זמני: {self.config.output_audio}")
        except Exception as e:
            logger.warning(f"⚠️ בעיה במחיקת קובץ זמני: {str(e)}")

    def is_video_file(self, filepath):
        return os.path.splitext(filepath)[1].lower() in [".mp4", ".mov", ".avi", ".webm"]

    def transcribe_and_process(self, filepath):
        print("⚙️ נכנסנו ל־transcribe_and_process()")
        logger.info(f"▶️ התחלת תהליך תמלול עבור: {filepath}")

        try:
            update_status("extracting_audio", 10)
            print("🎧 extracting audio...")
            self.extract_audio()

            # חישוב משך
            try:
                self.duration = self.get_video_duration(filepath)
                print("⏱️ video duration =", self.duration)
            except Exception as e:
                logger.warning(f"⚠️ שגיאה בחישוב משך וידאו: {e}")
                self.duration = 0

            update_status("transcribing", 30)
            print("📝 מתחיל תמלול...")
            try:
                segments = self.transcribe_audio()
                print(f"📚 תמלול הניב {len(segments)} סגמנטים")
            except Exception as e:
                logger.error(f"❌ שגיאה בתמלול: {str(e)}")
                import traceback
                print(traceback.format_exc())
                return {
                    "status": "failed",
                    "message": str(e),
                    "traceback": traceback.format_exc(),
                    "duration": getattr(self, 'duration', 0)
                }

            if not segments:
                logger.error("❌ לא התקבלו סגמנטים מהתמלול")
                return {
                    "status": "failed",
                    "message": "No transcription segments returned",
                    "duration": self.duration
                }

            self.detected_lang = getattr(self, 'source_language', "unknown")

            # יצירת שמות קבצים
            base_name = os.path.splitext(os.path.basename(self.config.output_video))[0]
            task_id = base_name.split("_")[-1]
            txt_path = os.path.join("results", f"{base_name}.txt")
            docx_path = os.path.join("results", f"{base_name}.docx")
            pdf_path = os.path.join("results", f"{base_name}.pdf")
            srt_path = self.config.output_srt
            video_path = self.config.output_video

            # יצירת קבצים
            update_status("creating_documents", 50)
            print("🛠️ מייצר txt/docx/pdf...")
            self.generate_txt(segments, txt_path)
            self.generate_docx(segments, docx_path)
            self.generate_pdf(segments, pdf_path)

            update_status("generating_srt", 75)
            print("🎬 מייצר SRT...")
            self.generate_srt(segments)

            # העלאה ל־R2
            update_status("uploading", 95)
            print("🔼 מעלה קבצי תוצאה ל־R2...")
            print("🧪 debug output_video =", self.config.output_video)
            print("🧪 base_name =", base_name)
            print("🧪 task_id =", task_id)
            print("🧪 קבצים בתיקיית results:", os.listdir("results"))

            R2_PUBLIC_BASE = os.getenv("R2_PUBLIC_BASE") or \
                             "https://eb0e988de4e9fb026f45d9e3038314e2.r2.cloudflarestorage.com/talkscribe-uploads"
            print("📂 תוכן תיקיית results:", os.listdir("results"))

            def try_upload(path, r2_key, label):
                if os.path.exists(path):
                    success = upload_file_to_r2(path, r2_key)
                    print(f"✅ {label} uploaded:", success)
                else:
                    print(f"❌ {label} לא קיים:", path)

            try_upload(txt_path, f"{task_id}/{base_name}.txt", "TXT")
            try_upload(docx_path, f"{task_id}/{base_name}.docx", "DOCX")
            try_upload(pdf_path, f"{task_id}/{base_name}.pdf", "PDF")
            try_upload(srt_path, f"{task_id}/{base_name}.srt", "SRT")

            if self.is_video_file(filepath):
                try:
                    print("🎞️ צורב כתוביות לסרטון...")
                    self.embed_subtitles(filepath, srt_path, video_path)
                    try_upload(video_path, f"{task_id}/{base_name}.mp4", "MP4")
                except Exception as e:
                    logger.error(f"❌ שגיאה בצריבת כתוביות: {str(e)}")
                    import traceback
                    print(traceback.format_exc())

            # ניקוי
            update_status("cleaning", 98)
            self.clean_temp_files()

            update_status("done", 100)
            logger.info(f"🎉 סיום: {len(segments)} סגמנטים, משך {self.duration} שניות")

            return {
                "status": "completed",
                "task_id": task_id,
                "base_name": base_name,
                "duration": self.duration,
                "detected_language": self.detected_lang,
                "transcript_text": " ".join([s["text"] for s in segments]),
                "r2_urls": {
                    "txt": f"{R2_PUBLIC_BASE}/{task_id}/{base_name}.txt",
                    "docx": f"{R2_PUBLIC_BASE}/{task_id}/{base_name}.docx",
                    "pdf": f"{R2_PUBLIC_BASE}/{task_id}/{base_name}.pdf",
                    "srt": f"{R2_PUBLIC_BASE}/{task_id}/{base_name}.srt",
                    "mp4": f"{R2_PUBLIC_BASE}/{task_id}/{base_name}.mp4" if self.is_video_file(filepath) else None
                }
            }

        except Exception as e:
            logger.error(f"❌ שגיאה בתהליך כולו: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return {
                "status": "failed",
                "message": str(e),
                "traceback": traceback.format_exc(),
                "duration": getattr(self, 'duration', 0)
            }

    def get_video_duration(self, path):
        try:
            cap = cv2.VideoCapture(path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            duration = int(frame_count / fps) if fps else 0
            cap.release()
            return duration
        except Exception as e:
            logger.warning(f"⚠️ שגיאה בחישוב זמן וידאו: {e}")
            return 0
