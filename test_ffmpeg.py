import subprocess

try:
    result = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True)
    print("FFmpeg output:\n", result.stdout)
except FileNotFoundError:
    print("❌ FFmpeg not found inside Python environment")
