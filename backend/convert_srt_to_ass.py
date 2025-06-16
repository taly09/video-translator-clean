from pathlib import Path
import pysubs2

def convert_srt_to_ass(srt_path, ass_path, resolution=(1280, 720), style_config=None, rtl=False):
    subs = pysubs2.load(str(srt_path), encoding="utf-8")
    subs.video_width, subs.video_height = resolution
    style = subs.styles["Default"]

    style.fontname = style_config.get("font", "Noto Sans") if style_config else "Noto Sans"
    style.fontsize = style_config.get("size", 36) if style_config else 36

    alignment_map = {
        "bottom_center": 2,
        "bottom_right": 3,
        "bottom_left": 1
    }

    alignment = alignment_map.get(style_config.get("alignment", "bottom_center"), 2) if style_config else 2
    style.alignment = alignment
    style.margin_v = style_config.get("margin_v", 60) if style_config else 60
    style.outline = style_config.get("outline", 2) if style_config else 2
    style.shadow = style_config.get("shadow", 0) if style_config else 0

    def hex_to_color(hx):
        hx = hx.lstrip("#")
        return pysubs2.Color(int(hx[0:2], 16), int(hx[2:4], 16), int(hx[4:6], 16))

    style.primarycolor = hex_to_color(style_config.get("primary_color", "#FFFFFF")) if style_config else pysubs2.Color(255, 255, 255)
    style.outlinecolor = hex_to_color(style_config.get("outline_color", "#000000")) if style_config else pysubs2.Color(0, 0, 0)

    if rtl:
        style.alignment = 3  # bottom_right
        style.direction = "rtl"

    subs.save(str(ass_path))


if __name__ == "__main__":
    srt_path = Path(r"C:\Users\X\subtitles.srt")
    ass_path = srt_path.with_suffix(".ass")
    convert_srt_to_ass(srt_path, ass_path)
    print(f"✅ המרת {srt_path} ל־{ass_path} בוצעה בהצלחה!")
