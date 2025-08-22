# app/celery_app.py
from dotenv import load_dotenv
from pathlib import Path
import os, logging
from celery import Celery
from datetime import timedelta

# ---------- Logging ----------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("celery.log", encoding="utf-8")]
)
logger = logging.getLogger(__name__)

# ---------- Env ----------
root = Path(__file__).resolve().parents[1]  # project root (app/..)
env_local = root / ".env.local"
if env_local.exists():
    load_dotenv(dotenv_path=env_local, override=True)
else:
    load_dotenv(override=True)

# ---------- Basic sanity for prod ----------
if os.getenv("FLASK_ENV") == "production" and not os.getenv("SECRET_KEY"):
    raise RuntimeError("SECRET_KEY must be set in production")

# init S3 client after env
from app.services.file_service import init_s3_client
init_s3_client()

# ---------- Celery factory ----------
def make_celery():
    broker_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    backend_url = os.getenv("CELERY_RESULT_BACKEND", broker_url)

    c = Celery(
        "app",
        broker=broker_url,
        backend=backend_url,
        include=[
            "app.tasks.transcription_task",  # עדיף שהמשימות יהיו בקבצים נפרדים
            "app.tasks.remotion_task",
        ],
    )

    # Performance / reliability
    c.conf.update(
        task_default_queue="default",
        task_acks_late=True,
        task_reject_on_worker_lost=True,
        worker_prefetch_multiplier=1,
        task_time_limit=60*60*3,       # hard limit 3h
        task_soft_time_limit=60*60*3 - 60,
        result_expires=timedelta(days=1),
        broker_heartbeat=30,
        broker_pool_limit=20,
        broker_transport_options={"visibility_timeout": 60*60*6},  # 6h
        timezone="UTC",
        enable_utc=True,
        task_routes={
            "app.tasks.transcription_task.transcribe_task": {"queue": "transcribe"},
            "app.tasks.remotion_task.remotion_render_task": {"queue": "render"},
        },
    )

    # Smoke check (אופציונלי אך מומלץ)
    try:
        from app.services.smoke_remotion import smoke  # תיצור קובץ כזה אם תרצה
        smoke()
        logger.info("✅ Remotion environment check passed")
    except Exception as e:
        logger.warning(f"⚠️ Remotion environment check failed: {e}")

    return c

celery_app = make_celery()
