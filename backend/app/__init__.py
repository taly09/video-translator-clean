# app/__init__.py
import os, logging, secrets, subprocess
from datetime import timedelta
from dotenv import load_dotenv
from flask import Flask, request, session, send_from_directory
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from authlib.integrations.flask_client import OAuth
from flask_session import Session
from werkzeug.exceptions import NotFound

logger = logging.getLogger(__name__)

# ---------- ENV ----------
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), ".env.local")
    if os.path.isfile(env_path):
        load_dotenv(env_path)
        logger.info(f".env.local loaded from {env_path}")
    else:
        logger.warning(f".env.local NOT found at {env_path}")

load_env()

# ---------- Frontend allowlist ----------
def _split_env(urls: str | None) -> set[str]:
    if not urls: return set()
    return {u.strip().rstrip("/") for u in urls.split(",") if u.strip()}

ALLOWED_FRONTENDS = (
    _split_env(os.getenv("FRONTEND_URLS"))
    or _split_env(os.getenv("FRONTEND_URL"))
    or _split_env(os.getenv("FRONTEND_ORIGIN"))
)
ALLOWED_FRONTENDS = {u for u in ALLOWED_FRONTENDS if u} or {"http://localhost:5174"}

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "dev_key")

    # Sessions
    app.config.update(
        SESSION_TYPE="filesystem",
        PERMANENT_SESSION_LIFETIME=timedelta(days=7),
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=False,
        SESSION_COOKIE_DOMAIN=None,
        MAX_CONTENT_LENGTH=500 * 1024 * 1024,
    )
    Session(app)

    # Rate limiter
    limiter = Limiter(
        key_func=get_remote_address,
        storage_uri=os.getenv("REDIS_URI") or "memory://",
        default_limits=os.getenv("DEFAULT_LIMITS") or []
    )
    limiter.init_app(app)
    app.extensions["limiter"] = limiter

    # OAuth (Google)
    oauth = OAuth(app)
    google = oauth.register(
        name='google',
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'},
    )
    app.google_oauth = google

    # Blueprints
    from app.api import auth, transcriptions, user
    from app.api.events import events_bp
    app.register_blueprint(auth.router)
    app.register_blueprint(transcriptions.router)
    app.register_blueprint(user.router)
    app.register_blueprint(events_bp)

    # -------- Dev Login API (ישירות כאן) --------
    from flask import Blueprint
    dev_bp = Blueprint("dev_bp", __name__)

    @dev_bp.route("/api/login/dev", methods=["GET", "POST"])
    def api_login_dev():
        logger.info("🔐 /api/login/dev hit")
        if os.getenv("FLASK_ENV") == "production":
            return {"error": "disabled in production"}, 404

        session.clear()
        session["user"] = {
            "email": os.getenv("DEV_USER_EMAIL", "dev@example.com"),
            "full_name": os.getenv("DEV_USER_NAME", "Dev User"),
            "picture": None,
        }
        session.permanent = True
        return {"ok": True, "message": "dev login ok"}

    app.register_blueprint(dev_bp)

    # Logs per request
    @app.before_request
    def _log_origin():
        logger.info(f"Origin: {request.headers.get('Origin')}  user? {bool(session.get('user'))}")

    # Security headers + CORS echo
    # Security headers + CORS echo
    @app.after_request
    def _headers(resp):
        origin = (request.headers.get('Origin') or "").rstrip("/")

        is_dev = os.getenv("FLASK_ENV") != "production"
        allow = False

        if is_dev:
            allow = bool(origin)  # ב-DEV: כל Origin עם header
        else:
            allow = origin in ALLOWED_FRONTENDS

        if allow:
            resp.headers['Access-Control-Allow-Origin'] = origin
            resp.headers['Vary'] = 'Origin'
            resp.headers['Access-Control-Allow-Credentials'] = 'true'
            resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            # תחזיר את מה שהדפדפן ביקש בפרה-פלייט (כולל X-CSRF-Token מה- patchFetch)
            req_headers = request.headers.get('Access-Control-Request-Headers')
            resp.headers['Access-Control-Allow-Headers'] = req_headers or 'Content-Type, Authorization, X-CSRF-Token'

        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["Referrer-Policy"] = "no-referrer"
        resp.headers["Permissions-Policy"] = "microphone=(), camera=()"
        if os.getenv("FLASK_ENV") == "production":
            resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        if request.method == "OPTIONS":
            resp.status_code = 204
        return resp

    # Serve frontend build (כשפתחת build; ב-dev נכנסים דרך Vite)
    dist_dir = os.path.join(os.path.dirname(__file__), "my-remotion-app", "build")

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path.startswith(("api/","login","auth/")):
            raise NotFound()
        full = os.path.join(dist_dir, path)
        if path and os.path.exists(full):
            return send_from_directory(dist_dir, path)
        index_path = os.path.join(dist_dir, "index.html")
        if not os.path.exists(index_path):
            return {"error": "frontend build not found"}, 503
        return send_from_directory(dist_dir, "index.html")

    # Health
    @app.route("/api/health")
    def health(): return {"status": "ok"}

    # Debug: routes
    print("=== ROUTES MAP ===")
    for rule in app.url_map.iter_rules():
        print(rule)
    print("==================")

    logger.info(f"app package loaded from: {__file__}")
    return app
