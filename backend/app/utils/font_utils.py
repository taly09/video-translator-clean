# utils/font_utils.py
import json
from pathlib import Path

FONTMAP_PATH = Path("C:/font/fontmap.json")

def load_fontmap():
    with open(FONTMAP_PATH, encoding="utf-8") as f:
        return json.load(f)

def get_ass_font_name(font_family: str) -> str:
    fontmap = load_fontmap()
    font_key = font_family.lower().replace(" ", "").replace("-", "")
    font_info = fontmap.get(font_key)

    if not font_info:
        print(f"⚠️ פונט לא נמצא במפה: '{font_family}' -> נופל לברירת מחדל (Impact)")
        return "Impact"

    return font_info.get("assName", "Impact")
