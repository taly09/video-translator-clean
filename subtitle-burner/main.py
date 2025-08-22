import pysubs2
import subprocess
import os

# 🧠 חשוב! מגדיר מיקום הפונטים בתוך הקונטיינר
os.environ["ASS_FONTDIR"] = "/usr/share/fonts/truetype/custom"
os.environ["FONTCONFIG_FILE"] = "/etc/fonts/fonts.conf"

# נתיבים לקבצים
input_video = "input.mp4"
input_srt = "subtitles.srt"
output_video = "output_burned.mp4"

# יצירת כתוביות עם סגנון Impact
subs = pysubs2.load(input_srt)
subs.styles["Default"].fontname = "Noto Sans Hebrew"
subs.styles["Default"].fontsize = 52
subs.styles["Default"].primarycolor = pysubs2.Color(255, 255, 255, 0)
subs.styles["Default"].outlinecolor = pysubs2.Color(0, 0, 0, 0)
subs.styles["Default"].bold = True
subs.styles["Default"].borderstyle = 1
subs.styles["Default"].outline = 2
subs.styles["Default"].shadow = 0
subs.styles["Default"].alignment = pysubs2.Alignment.BOTTOM_CENTER
subs.save("subtitles.ass")

# צריבת כתוביות
cmd = [
    "ffmpeg",
    "-y",  # ← זו השורה שמוסיפה את אישור הדריסה
    "-i", input_video,
    "-vf", "ass=subtitles.ass",
    "-c:a", "copy",
    output_video
]


print("🧨 Running FFmpeg...")
subprocess.run(cmd, check=True)
print("✅ Done! Burned subtitles saved to", output_video)
