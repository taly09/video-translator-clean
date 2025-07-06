import os
import logging
from dotenv import load_dotenv
from flask import Flask, request, session, make_response
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from authlib.integrations.flask_client import OAuth
from flask_session import Session  # חשוב כדי להפעיל session server-side

# הגדרת לוגים
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("transcription.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def load_env():
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    logger.info(f"🌱 Loading environment from: {env_path}")

    if not os.path.isfile(env_path):
        logger.warning("⚠️ .env.local file not found! Continuing without it.")
        return

    load_dotenv(dotenv_path=env_path)
    logger.info(".env.local loaded successfully.")

    for key in sorted(os.environ):
        if key.startswith("R2_") or key.startswith("GOOGLE_"):
            logger.info(f"{key} = {os.getenv(key)}")

# טוענים את הסביבה לפני ייבוא ההגדרות
load_env()

from app.config import get_config
from app.error_handler import register_error_handlers

def create_app():
    app = Flask(__name__)
    app.config.from_object(get_config())
    app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "default_unsafe_key")


    # לוגים למפתחות OAuth
    logger.info(f"✅ GOOGLE_CLIENT_ID loaded: {app.config.get('GOOGLE_CLIENT_ID')}")
    logger.info(f"✅ GOOGLE_CLIENT_SECRET loaded: {app.config.get('GOOGLE_CLIENT_SECRET')}")

    # הגדרות session ו-Session server-side
    app.config.update(
        SESSION_TYPE="filesystem",
        SESSION_COOKIE_SAMESITE="Lax",  # לוקאל זה מתאים, כדי שה-cookie יעבוד
        SESSION_COOKIE_SECURE=False  # בפיתוח אין HTTPS
    )

    Session(app)  # מאתחל את ה-session

    # לא מפעילים Flask-CORS כי נטפל ידנית בכותרות CORS

    # Rate limiter
    limiter = Limiter(
        key_func=get_remote_address,
        storage_uri=app.config["REDIS_URI"],
        default_limits=app.config["DEFAULT_LIMITS"]
    )
    limiter.init_app(app)

    # OAuth הגדרה
    oauth = OAuth(app)
    google = oauth.register(
        name='google',
        client_id=app.config["GOOGLE_CLIENT_ID"],
        client_secret=app.config["GOOGLE_CLIENT_SECRET"],
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'},
    )
    app.google_oauth = google

    # Blueprints
    from app.api import auth, transcriptions, user
    app.register_blueprint(auth.router)
    app.register_blueprint(transcriptions.router)
    app.register_blueprint(user.router)



    # Error handlers
    register_error_handlers(app)

    # לוג של ה-Origin שמגיע בכל בקשה
    @app.before_request
    def log_origin():
        origin = request.headers.get('Origin')
        logger.info(f"Incoming request Origin: {origin}")
        logger.info(f"Session user: {session.get('user')}")

    # הוספת כותרות CORS ידנית אחרי כל תגובה
    @app.after_request
    def apply_all_headers(response):
        # CORS headers
        origin = request.headers.get('Origin')
        if origin:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        else:
            response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'

        # Security headers
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "microphone=(), camera=()"
        if os.getenv("FLASK_ENV") == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response

    # בדיקות בריאות
    @app.route("/test")
    def test():
        return "Backend is working!"

    @app.route("/api/health")
    def health_check():
        return {"status": "ok"}

    # הצגת המפות הנתיבים לוגית
    print("=== ROUTES MAP ===")
    for rule in app.url_map.iter_rules():
        print(rule)
    print("==================")

    return app

# יצירת אפליקציה
app = create_app()

if __name__ == "__main__":
    debug = os.getenv("FLASK_ENV") != "production"
    app.run(host="localhost", port=8765, debug=debug, use_reloader=False)
