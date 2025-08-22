import subprocess
import os
import logging
import re
from datetime import timedelta
from app.utils.font_utils import get_ass_font_name
from app.utils.text_utils import prepare_text_for_ass
from app.utils.subtitle_utils import is_rtl_text

DEFAULT_FONT = "Rubik"
def style_to_ass_override(style):
    buf = []
    # פונט
    if style.get("fontFamily"):
        buf.append(rf"\fn{style['fontFamily']}")
    # גודל
    if style.get("fontSize"):
        buf.append(rf"\fs{int(style['fontSize'])}")
    # צבע ראשי
    if style.get("color"):
        col = style['color'].replace("#", "")
        ass_col = f"&H00{col[4:6]}{col[2:4]}{col[0:2]}&"
        buf.append(rf"\c{ass_col}")
    # קו מתאר
    if style.get("outlineColor"):
        col = style['outlineColor'].replace("#", "")
        ass_col = f"&H00{col[4:6]}{col[2:4]}{col[0:2]}&"
        buf.append(rf"\3c{ass_col}")
    # צל
    if style.get("textShadow"):  # textShadow ב־style זה מחרוזת, למשל "2px 2px 8px rgba(0,0,0,0.9)"
        buf.append(r"\shad1")
    # עובי קו מתאר (אם קיים)
    if style.get("outlineWidth"):
        buf.append(rf"\bord{int(style['outlineWidth'])}")
    # הדגשה
    if int(style.get("fontWeight", 400)) >= 700:
        buf.append(r"\b1")
    else:
        buf.append(r"\b0")
    return "{" + "".join(buf) + "}"

def highlight_word_in_text(text, highlight_word, style, rtl=False):
    if not highlight_word or not text:
        return prepare_text_for_ass(text, rtl=rtl)

    highlight_color = style.get("highlightColor", "#FFFF00").lstrip("#")
    highlight_color_ass = f"&H00{highlight_color[4:6]}{highlight_color[2:4]}{highlight_color[0:2]}&"

    # ניקוי בסיסי של highlight_word – ללא סימני פיסוק וללא רווחים
    target_clean = re.sub(r'[^\w\u0590-\u05FF]', '', highlight_word).lower()

    words = text.split()
    result = []
    highlighted = False

    for word in words:
        clean_word = re.sub(r'[^\w\u0590-\u05FF]', '', word).lower()
        if not highlighted and clean_word == target_clean:
            result.append(rf"{{\b1\c{highlight_color_ass}}}{word}{{\r}}")
            highlighted = True
        else:
            result.append(word)

    highlighted_text = " ".join(result)
    return prepare_text_for_ass(highlighted_text, rtl=rtl)



def highlight_keywords_in_text(text, keywords, style, rtl=False):
    if not keywords:
        return prepare_text_for_ass(text, rtl=rtl)

    highlight_color = style.get("highlightColor", "#00FFFF").lstrip("#")
    highlight_color_ass = f"&H00{highlight_color[4:6]}{highlight_color[2:4]}{highlight_color[0:2]}&"

    def replacer(match):
        return rf"{{\b1\c{highlight_color_ass}}}{match.group(0)}{{\r}}"

    for word in keywords:
        pattern = re.compile(rf'\b{re.escape(word)}\b', re.IGNORECASE)
        text = pattern.sub(replacer, text)

    return prepare_text_for_ass(text, rtl=rtl)


logger = logging.getLogger(__name__)
def convert_srt_to_ass_with_styles(segments, ass_path, resolution=(1280, 720), rtl=False, style_type="default"):
    from app.utils.text_utils import prepare_text_for_ass
    from app.utils.ffmpeg_utils import highlight_word_in_text, highlight_keywords_in_text

    logger.info(f"🎨 Generating ASS with style_type={style_type}, {len(segments)} segments")

    width, height = resolution

    def format_time(t):
        td = timedelta(seconds=t)
        total = int(td.total_seconds())
        h = total // 3600
        m = (total % 3600) // 60
        s = total % 60
        cs = int((td.total_seconds() - total) * 100)
        return f"{h:01}:{m:02}:{s:02}.{cs:02}"

    with open(ass_path, "w", encoding="utf-8") as f:
        # Header
        f.write("[Script Info]\n")
        f.write("ScriptType: v4.00+\n")
        f.write(f"PlayResX: {width}\n")
        f.write(f"PlayResY: {height}\n")
        f.write("Collisions: Normal\n\n")

        # Styles
        f.write("[V4+ Styles]\n")
        f.write("Format: Name, Fontname, Fontsize, PrimaryColour, BackColour, OutlineColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n")

        # הגדרת סגנונות עם פונטים שונים
        f.write("Style: RubikBold,Rubik Bold,52,&H00FFFFFF,&H00000000,&H00000000,-1,0,1,1,0,5,10,10,10,1\n")
        f.write("Style: Impact,Impact,52,&H00FFFFFF,&H00000000,&H00000000,-1,0,1,1,0,5,10,10,10,1\n")
        f.write("Style: TimesNewRoman,Times New Roman,52,&H00FFFFFF,&H00000000,&H00000000,0,0,1,1,0,5,10,10,10,1\n")
        f.write("Style: Assistant,Assistant,52,&H00FFFFFF,&H00000000,&H00000000,0,0,1,1,0,5,10,10,10,1\n")
        f.write("Style: Heebo,Heebo,52,&H00FFFFFF,&H00000000,&H00000000,0,0,1,1,0,5,10,10,10,1\n")

        # הוסף כאן עוד סגנונות אם צריך

        # Events
        f.write("\n[Events]\n")
        f.write("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")

        # מיפוי שם פונט לשם Style
        font_map = {
            "rubik bold": "RubikBold",
            "impact": "Impact",
            "times new roman": "TimesNewRoman",
            "assistant": "Assistant",
            "heebo": "Heebo",

            # הוסף לפי הצורך
        }

        for seg in segments:
            start = format_time(seg["start"])
            end = format_time(seg["end"])

            style_data = seg.get("style", {})
            text = seg.get("text", "")
            ass_text = seg.get("assText")  # אם נבנה מראש
            print("DEBUG ASS SEG:", {
                "style_type": style_type,
                "text": text,
                "style_data": style_data,
                "highlightWord": style_data.get("highlightWord"),
                "highlightKeywords": style_data.get("highlightKeywords"),
            })

            override = style_to_ass_override(style_data)

            if ass_text:
                formatted = ass_text
            elif style_type == "plain":
                formatted = override + prepare_text_for_ass(text, rtl=rtl)
            elif style_type == "boldSegment":
                formatted = override + rf"{{\b1}}{prepare_text_for_ass(text, rtl=rtl)}{{\b0}}"
            elif style_type == "boldWord":
                text_with_highlight = highlight_word_in_text(
                    text,
                    style_data.get("highlightWord", ""),
                    style_data,
                    rtl=rtl
                )
                formatted = override + text_with_highlight
            elif style_type == "highlightWords":
                formatted = override + highlight_keywords_in_text(
                    text,
                    style_data.get("highlightKeywords", []),
                    style_data,
                    rtl=rtl
                )
            elif style_type == "wordByWord":
                formatted = override + highlight_word_in_text(
                    text,
                    style_data.get("highlightWord", ""),
                    style_data,
                    rtl=rtl
                )
            elif style_type == "cumulativeWordByWord":
                formatted = override + highlight_word_in_text(
                    text,
                    style_data.get("highlightWord", ""),
                    style_data,
                    rtl=rtl
                )
            else:  # ברירת מחדל
                formatted = override + prepare_text_for_ass(text, rtl=rtl)

            font_family = style_data.get("fontFamily", "").lower()
            style_name = font_map.get(font_family, "RubikBold")  # ברירת מחדל

            f.write(f"Dialogue: 0,{start},{end},{style_name},,0,0,0,,{{\\an5}}{formatted}{{\\r}}\n")

def burn_ass_subtitles(video_path, ass_path, output_path, resolution=(1280, 720)):
    try:
        ass_path_fixed = ass_path.replace("\\", "/")
        fonts_conf_path = "C:/גיבוי נוסף/גג/גיבוי מעולה!!!!!/13video-translator-restored/backend/app/assets/fonts/fonts.conf"

        env = os.environ.copy()
        env["ASS_FONTDIR"] = r"C:/font"
        env["FONTCONFIG_FILE"] = r"C:/font/fonts.conf"

        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vf", f"scale={resolution[0]}:{resolution[1]},ass={ass_path_fixed}",
            "-c:a", "copy",
            output_path
        ]

        logger.info(f"🔥 Burning subtitles into {output_path}")
        print("🧨 FFmpeg CMD:", " ".join(cmd))
        print("📁 ASS_FONTDIR:", env.get("ASS_FONTDIR"))
        print("📄 FONTCONFIG_FILE:", env.get("FONTCONFIG_FILE"))

        process = subprocess.Popen(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in process.stdout:
            print("📦 FFmpeg:", line.strip())
        process.wait()
        if process.returncode != 0:
            logger.error(f"FFmpeg exited with code {process.returncode}")
            raise RuntimeError("FFmpeg failed")

        logger.info(f"✅ Subtitles burned into {output_path}")

    except subprocess.TimeoutExpired:
        logger.error(f"❌ FFmpeg burn operation timed out for {video_path}")
        raise
    except Exception as e:
        logger.exception(f"❌ Failed to burn subtitles: {e}")
        raise


def get_video_resolution(video_path):
    try:
        cmd = [
            "ffprobe",
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height",
            "-of", "csv=s=x:p=0",
            video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=30)
        res = result.stdout.strip()
        width, height = map(int, res.split('x'))
        logger.debug(f"📐 Video resolution: {width}x{height}")
        return width, height
    except subprocess.TimeoutExpired:
        logger.error(f"❌ FFprobe resolution check timed out for {video_path}")
        return (1280, 720)
    except Exception as e:
        logger.warning(f"⚠️ Could not determine resolution, defaulting: {e}")
        return (1280, 720)
