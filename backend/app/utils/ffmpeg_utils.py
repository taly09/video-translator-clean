import subprocess
import os
import pysubs2
import logging

logger = logging.getLogger(__name__)

def convert_srt_to_ass(srt_path, ass_path, resolution=(1280, 720), style_config=None, rtl=False):
    style_config = style_config or {}
    try:
        subs = pysubs2.load(srt_path, encoding="utf-8")
        subs.video_width, subs.video_height = resolution
        style = subs.styles["Default"]

        style.fontname = style_config.get("font", "Noto Sans")
        style.fontsize = style_config.get("size", 36)
        style.margin_v = style_config.get("margin_v", 60)
        style.outline = style_config.get("outline", 2)
        style.shadow = style_config.get("shadow", 0)

        alignment_map = {"bottom_center": 2, "bottom_right": 3, "bottom_left": 1}
        style.alignment = alignment_map.get(style_config.get("alignment", "bottom_center"), 2)

        def hex_to_color(hx):
            hx = hx.lstrip("#")
            return pysubs2.Color(int(hx[0:2], 16), int(hx[2:4], 16), int(hx[4:6], 16))

        style.primarycolor = hex_to_color(style_config.get("primary_color", "#FFFFFF"))
        style.outlinecolor = hex_to_color(style_config.get("outline_color", "#000000"))

        if rtl:
            style.alignment = alignment_map["bottom_right"]

        subs.save(ass_path)
        logger.info(f"✅ ASS subtitles saved at {ass_path}")

    except Exception as e:
        logger.exception(f"❌ Failed to convert SRT to ASS: {e}")
        raise

def burn_ass_subtitles(video_path, ass_path, output_path):
    try:
        ass_path_fixed = ass_path.replace("\\", "/")
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vf", f"ass={ass_path_fixed}",
            "-c:a", "copy",
            output_path
        ]
        logger.info(f"🔥 Burning subtitles into {output_path}")
        subprocess.run(cmd, check=True, timeout=600)
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
