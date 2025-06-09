import os
import torch
import whisper
import time

# 🛠 ודא ש־FFmpeg זמין
os.environ["PATH"] += os.pathsep + r"C:\ffmpeg-2025-05-15-git-12b853530a-full_build\bin"

print("✅ CUDA זמין:", torch.cuda.is_available())
print("🎮 כרטיס:", torch.cuda.get_device_name(0))

model = whisper.load_model("large-v3", device="cuda")
print("🚀 המודל נטען!")

AUDIO_FILE = "example.wav"
if not os.path.exists(AUDIO_FILE):
    print(f"❌ הקובץ {AUDIO_FILE} לא נמצא.")
    exit(1)

print(f"🎧 תמלול {AUDIO_FILE}...")
start = time.time()
result = model.transcribe(AUDIO_FILE)
end = time.time()

print(f"✅ הסתיים תוך {round(end - start, 2)} שניות")

allocated = round(torch.cuda.memory_allocated(0) / 1024**2, 1)
reserved = round(torch.cuda.memory_reserved(0) / 1024**2, 1)
total = round(torch.cuda.get_device_properties(0).total_memory / 1024**2, 1)
print(f"💾 GPU: מוקצה {allocated} MB / שמור {reserved} MB מתוך {total} MB")

print("📝 טקסט:")
print(result["text"][:200])
