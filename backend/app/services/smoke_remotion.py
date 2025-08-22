# app/services/smoke_remotion.py
import os
import shutil
import subprocess
from pathlib import Path

def _run(cmd, timeout=10):
    return subprocess.run(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True, timeout=timeout, check=True
    )

def smoke():
    problems = []

    # 1) REMOTION_CWD חייב להצביע לפרויקט Remotion
    remotion_cwd = os.getenv("REMOTION_CWD")
    if not remotion_cwd:
        problems.append("REMOTION_CWD is not set")
    else:
        p = Path(remotion_cwd)
        if not p.exists():
            problems.append(f"REMOTION_CWD not found: {p}")
        else:
            # בדיקה מינימלית שיש פרויקט (package.json ו/או src/index.tsx)
            has_pkg = (p / "package.json").exists()
            has_index = (p / "src" / "index.tsx").exists()
            if not (has_pkg or has_index):
                problems.append(f"REMOTION_CWD looks wrong (no package.json or src/index.tsx in {p})")

    # 2) npx צריך להיות זמין
    npx = shutil.which("npx") or shutil.which("npx.cmd")
    if not npx:
        problems.append("npx not found in PATH")
    else:
        try:
            _ = _run([npx, "--version"], timeout=10)
        except Exception as e:
            problems.append(f"npx --version failed: {e}")

    # 3) ffmpeg/ffprobe זמינים
    ffmpeg = shutil.which("ffmpeg") or shutil.which("ffmpeg.exe")
    ffprobe = shutil.which("ffprobe") or shutil.which("ffprobe.exe")
    if not ffmpeg:
        problems.append("ffmpeg not found in PATH")
    else:
        try:
            _ = _run([ffmpeg, "-version"], timeout=10)
        except Exception as e:
            problems.append(f"ffmpeg -version failed: {e}")
    if not ffprobe:
        problems.append("ffprobe not found in PATH")
    else:
        try:
            _ = _run([ffprobe, "-version"], timeout=10)
        except Exception as e:
            problems.append(f"ffprobe -version failed: {e}")

    # 4) משתני סביבה בסיסיים
    if not os.getenv("R2_BUCKET_NAME"):
        problems.append("R2_BUCKET_NAME is not set")
    if not os.getenv("CELERY_BROKER_URL"):
        problems.append("CELERY_BROKER_URL is not set")
    if not os.getenv("CELERY_RESULT_BACKEND"):
        problems.append("CELERY_RESULT_BACKEND is not set")

    # 5) (אופציונלי) בדיקת node_modules cache של remotion (לא חובה, רק אזהרה)
    if remotion_cwd:
        node_modules = Path(remotion_cwd) / "node_modules"
        if not node_modules.exists():
            # לא נכשל—רק אזהרה: ההתקנות ייקחו זמן בריצה הראשונה
            pass

    if problems:
        raise RuntimeError("Remotion smoke failed:\n- " + "\n- ".join(problems))
