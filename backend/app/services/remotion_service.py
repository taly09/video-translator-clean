# app/services/remotion_service.py

import os
import json
import tempfile
import time
import logging
import shutil
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional

from app.services.mongo_service import transcriptions_collection

logger = logging.getLogger(__name__)

def get_presigned_video_url(task_id: str, expires_seconds: int = 1800) -> str:
    """
    Presigned URL לווידאו המקורי ב-R2. מסתמך על video_r2_key ב-DB.
    """
    from app.services.file_service import s3_client

    bucket = os.getenv("R2_BUCKET_NAME")
    if not bucket:
        raise RuntimeError("R2_BUCKET_NAME is not configured")

    t = transcriptions_collection.find_one({"task_id": task_id}, {"video_r2_key": 1, "_id": 0})
    if not t or not t.get("video_r2_key"):
        raise RuntimeError(f"video_r2_key missing for task {task_id}")

    key = t["video_r2_key"]
    try:
        return s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires_seconds,
        )
    except Exception as e:
        logger.error(f"[remotion] Failed to presign video for task {task_id}: {e}", exc_info=True)
        raise


def _resolve_npx_path() -> str:
    """
    מאתר את פקודת npx בסביבה. נופל חזרה לנתיב של Node ב-Windows אם צריך.
    """
    npx = shutil.which("npx")
    if npx:
        return npx
    # Fallbackים נפוצים
    candidates = [
        r"C:\Program Files\nodejs\npx.cmd",
        r"C:\Program Files (x86)\nodejs\npx.cmd",
        "/usr/local/bin/npx",
        "/usr/bin/npx",
    ]
    for c in candidates:
        if Path(c).exists():
            return c
    raise RuntimeError("npx not found in PATH. Install Node.js or set PATH properly.")


def render_with_remotion_and_convert(
    segments: list,
    resolution: Optional[Dict[str, int]],
    duration: float,
    task_id: str,
    fps: int = 30,
    cwd_path: Optional[str] = None,
    remotion_codec: str = "h264",
    render_timeout_sec: int = 60 * 30,  # 30 דקות hard timeout לרינדור
) -> str:
    """
    מרנדר וידאו עם Remotion לקובץ MP4/WebM (בהתאם לדגלים) ברזולוציה המבוקשת.
    כולל:
    - timeouts
    - לוגים מפורטים
    - ניקוי קבצי tmp
    - פאת׳ים יציבים (Pathlib)
    """
    logger.info(f"[remotion] >>> START render task_id={task_id}")

    # 1) רזולוציה בטוחה
    if not resolution or "width" not in resolution or "height" not in resolution:
        resolution = {"width": 1920, "height": 1080}
    width, height = int(resolution["width"]), int(resolution["height"])

    # 2) איתור תיקיית הפרויקט של Remotion
    remotion_cwd = Path(cwd_path or os.getenv("REMOTION_CWD") or os.getcwd()).resolve()
    if not remotion_cwd.exists():
        raise RuntimeError(f"REMOTION_CWD not found: {remotion_cwd}")

    results_dir = remotion_cwd / "results"
    results_dir.mkdir(parents=True, exist_ok=True)

    # 3) קובץ פלט (שם דטרמיניסטי + רזולוציה)
    output_path = results_dir / f"{task_id}_remotion_output_{width}x{height}.mp4"

    # 4) Presigned URL לווידאו המקורי
    video_url = get_presigned_video_url(task_id)

    # 5) פרופסי Remotion
    task = transcriptions_collection.find_one({"task_id": task_id}) or {}
    language = task.get("language", "auto")
    rtl_flag = bool(task.get("rtl", False))

    props: Dict[str, Any] = {
        "segments": segments or [],
        "width": width,
        "height": height,
        "duration": float(duration or 10.0),
        "fps": int(fps or 30),
        "videoUrl": video_url,
        "language": language,
        "rtl": rtl_flag,
    }

    logger.info(f"[remotion] Props (task={task_id}): "
                f"w={width} h={height} fps={fps} dur={props['duration']} segs={len(props['segments'])}")

    # 6) יצירת קובץ props זמני + sandbox tmp פר-משימה
    tmp_root = Path(tempfile.gettempdir())
    sandbox = tmp_root / f"remotion_{task_id}"
    sandbox.mkdir(parents=True, exist_ok=True)

    props_path = sandbox / "props.json"
    props_path.write_text(json.dumps(props, ensure_ascii=False, indent=2), encoding="utf-8")

    # 7) איתור npx
    npx_path = _resolve_npx_path()

    # 8) פקודת Remotion (renderer CLI)
    #    - תן עדיפות לפרופילים שמרנדרים יציב (למשל crf 18, preset slow בסדר).
    cmd = [
        npx_path, "remotion", "render",
        "src/index.tsx",
        "MyVideo",
        f"--props={str(props_path)}",
        "--codec", remotion_codec,
        "--output", str(output_path),
        "--concurrency", os.getenv("REMOTION_CONCURRENCY", "4"),
        "--crf", os.getenv("REMOTION_CRF", "18"),
        "--preset", os.getenv("REMOTION_PRESET", "slow"),
    ]

    # 9) הרצה עם timeout ולכידת stderr/stdout
    logger.info(f"[remotion] Running: {' '.join(cmd)} (cwd={remotion_cwd})")
    started = time.time()
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(remotion_cwd),
            check=True,
            capture_output=True,   # נאסוף stdout/stderr ללוג במקרה שגיאה
            text=True,
            timeout=render_timeout_sec,
        )
        # אם רוצים גם stdout לשימוש דיאגנוסטי:
        if proc.stdout:
            logger.debug(f"[remotion][stdout] {proc.stdout[:4000]}")  # להגביל נפח
        if proc.stderr:
            logger.debug(f"[remotion][stderr] {proc.stderr[:4000]}")
    except subprocess.TimeoutExpired as e:
        logger.error(f"[remotion] TIMEOUT after {render_timeout_sec}s for task {task_id}. Killing process.", exc_info=True)
        # עדיף להשאיר קבצים לניקוי אח"כ – אבל props ננקה בכל מקרה
        raise RuntimeError(f"Remotion render timeout for task {task_id}") from e
    except subprocess.CalledProcessError as e:
        # נשמור קצת הקשר משגיאת ה-renderer
        stdout_snip = (e.stdout or "")[:2000]
        stderr_snip = (e.stderr or "")[:2000]
        logger.error(f"[remotion] Render failed for task {task_id}.\nSTDOUT:\n{stdout_snip}\nSTDERR:\n{stderr_snip}")
        raise RuntimeError(f"Remotion render failed for task {task_id}") from e
    finally:
        # ניקוי props + sandbox (לא מוחקים את output)
        try:
            if props_path.exists():
                props_path.unlink()
            # אם לא נשאר שם כלום – מחיקה של התיקייה
            if sandbox.exists():
                shutil.rmtree(sandbox, ignore_errors=True)
        except Exception as cleanup_err:
            logger.warning(f"[remotion] Cleanup failed for task {task_id}: {cleanup_err}")

    elapsed = time.time() - started
    if not output_path.exists():
        logger.error(f"[remotion] Output video not found: {output_path}")
        raise FileNotFoundError(f"Video not found: {output_path}")

    logger.info(f"[remotion] SUCCESS task={task_id} -> {output_path} ({elapsed:.2f}s)")
    return str(output_path)
