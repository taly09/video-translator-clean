import os

class BaseConfig:
    # 🔑 אבטחה
    SECRET_KEY = os.getenv("SECRET_KEY", "default_unsafe_key")
    SESSION_COOKIE_SAMESITE = "Lax"  # ברירת מחדל מתאימה ל-dev (localhost)
    SESSION_COOKIE_SECURE = False  # לוקאל: False כי אתה לא ב-HTTPS
    SESSION_TYPE = "filesystem"

    # 🌐 URLs
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8765")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5174")
    CORS_ORIGINS = {FRONTEND_URL}  # מוודאים שזה תואם ל-frontend שלך

    # ⚡ Redis / Limiter
    REDIS_URI = os.getenv("REDIS_URI", "redis://localhost:6379")
    DEFAULT_LIMITS = ["100 per hour"]

    # 🧠 MongoDB
    MONGO_URI = os.getenv("MONGO_URI")

    # 🔑 OAuth
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

    # ☁️ Cloudflare R2
    R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
    R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
    R2_ENDPOINT_URL = os.getenv("R2_ENDPOINT_URL")
    R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")
    R2_PUBLIC_BASE = os.getenv("R2_PUBLIC_BASE")

    # 📩 Email
    RESEND_API_KEY = os.getenv("RESEND_API_KEY")
    RESEND_FROM = os.getenv("RESEND_FROM")

    # 🎞️ FFmpeg
    FFMPEG_PATH = os.getenv("FFMPEG_PATH", "ffmpeg")


class ProductionConfig(BaseConfig):
    # בפרודקשן חובה להשתמש ב-HTTPS ו-SAMESITE None
    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = True
    DEFAULT_LIMITS = ["1000 per hour"]


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    DEFAULT_LIMITS = ["1000 per hour"]


def get_config():
    env = os.getenv("FLASK_ENV", "development")
    if env == "production":
        return ProductionConfig
    else:
        return DevelopmentConfig
