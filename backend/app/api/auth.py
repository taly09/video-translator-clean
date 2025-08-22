import os
import logging
from urllib.parse import urlparse
from flask import abort  # אם עדיין לא ייבאת
from urllib.parse import urlparse

from flask import Blueprint, request, session, redirect, url_for, current_app
from app.services.user_service import create_or_get_user
from app.response_utils import success_response, error_response

logger = logging.getLogger(__name__)
router = Blueprint('auth', __name__)

# ----- Frontend allowlist -----
def _split_env(urls: str | None) -> set[str]:
    if not urls:
        return set()
    return {u.strip().rstrip("/") for u in urls.split(",") if u.strip()}

ALLOWED_FRONTENDS = (
    _split_env(os.getenv("FRONTEND_URLS"))         # דוגמה: "http://localhost:5174, http://192.168.253.12:5174"
    or _split_env(os.getenv("FRONTEND_URL"))       # תמיכה בבודד
    or _split_env(os.getenv("FRONTEND_ORIGIN"))    # תאימות לאחור
)
ALLOWED_FRONTENDS = {u for u in ALLOWED_FRONTENDS if u} or {"http://localhost:5174"}

def _same_host(url_a: str, url_b: str) -> bool:
    """בודק אם שתי כתובות שייכות לאותו host (כולל scheme)."""
    try:
        pa, pb = urlparse(url_a), urlparse(url_b)
        return (pa.scheme, pa.netloc) == (pb.scheme, pb.netloc) and pa.scheme in ("http", "https")
    except Exception:
        return False


def _normalize_localhost(url: str) -> str:
    try:
        p = urlparse(url)
        host = 'localhost' if p.hostname in ('127.0.0.1', '::1', '[::1]') else p.hostname
        port = f":{p.port}" if p.port else ""
        return f"{p.scheme}://{host}{port}"
    except Exception:
        return url.rstrip("/")

def _safe_frontend() -> str:
    """
    מחזיר URL פרונטאנד בטוח מתוך allowlist, מנרמל 127.0.0.1 -> localhost.
    """
    candidate = (session.get("_frontend_url") or "").rstrip("/")
    if candidate:
        candidate = _normalize_localhost(candidate)
        if candidate in ALLOWED_FRONTENDS:
            return candidate
    # עדיפות ל-localhost אם קיים ב-allowlist
    for u in ALLOWED_FRONTENDS:
        nu = _normalize_localhost(u)
        if nu.endswith("localhost:5174"):
            return nu
    # fallback
    return _normalize_localhost(next(iter(ALLOWED_FRONTENDS)))


def _safe_next(next_url: str | None) -> str | None:
    """
    מאמת פרמטר next כך שיישאר באותו host כמו FRONTEND_URL המורשה.
    """
    if not next_url:
        return None
    fe = _safe_frontend()
    return next_url if _same_host(next_url, fe) else None


@router.route("/login/dev")
def login_dev():
    # מאופשר רק כשלא production
    if os.getenv("FLASK_ENV") == "production":
        abort(404)

    session.clear()
    session["user"] = {
        "email": os.getenv("DEV_USER_EMAIL", "dev@example.com"),
        "full_name": os.getenv("DEV_USER_NAME", "Dev User"),
        "picture": None,
    }
    session.permanent = True
    target = f"{_safe_frontend()}/?logged_in=true"
    return redirect(target)

@router.route("/login/google")
def login_google():
    google = current_app.google_oauth
    logger.info("login_google: starting oauth redirect (session redacted)")

    candidate = (request.args.get("frontend") or request.headers.get("Origin") or "").rstrip("/")
    candidate = _normalize_localhost(candidate)  # ✅ נרמול 127 -> localhost
    if candidate in ALLOWED_FRONTENDS:
        session["_frontend_url"] = candidate
    else:
        session["_frontend_url"] = _safe_frontend()

    nxt = request.args.get("next")
    safe_next = _safe_next(nxt)
    if safe_next:
        session["_next"] = safe_next

    redirect_uri = f"{_safe_frontend()}{url_for('auth.google_callback')}"
    logger.info(f"redirect_uri = {redirect_uri}")
    return google.authorize_redirect(redirect_uri)


@router.route("/auth/google/callback")
def google_callback():
    logger.info("google_callback: received callback (args redacted)")
    google = current_app.google_oauth

    try:
        # אל תרשום טוקנים ללוגים
        _ = google.authorize_access_token()
        logger.info("Token received from Google (redacted)")
    except Exception as e:
        logger.error(f"Authorization failed: {e}", exc_info=True)
        return error_response("Authorization failed", code=400, data={"details": str(e)})

    try:
        user_info = google.get("https://openidconnect.googleapis.com/v1/userinfo").json()
    except Exception as e:
        logger.error(f"Failed to fetch userinfo: {e}", exc_info=True)
        return error_response("Failed to fetch user info", code=400)

    email = user_info.get("email")
    logger.info(f"User info received (email only): {repr(email)}")
    if not email:
        return error_response("Authentication failed", code=400)

    # רוטציית סשן בסיסית למניעת fixation
    session.clear()
    session["user"] = {
        "email": email,
        "full_name": user_info.get("name"),
        "picture": user_info.get("picture"),
    }
    session.permanent = True  # אם הוגדר PERMANENT_SESSION_LIFETIME באפליקציה

    # יצירה/איתור משתמש במסד
    try:
        create_or_get_user(user_info)
    except Exception as e:
        logger.error(f"create_or_get_user failed: {e}", exc_info=True)

    # יעד סופי: next בטוח → אחרת FRONTEND_URL
    target = session.pop("_next", None) or f"{_safe_frontend()}/?logged_in=true"
    return redirect(target)


# app/api/auth.py

@router.route("/api/logout", methods=["POST"])
def logout():
    logger.info("🧼 POST /api/logout")
    # נקה סשן
    try:
        session.clear()
    except Exception:
        logger.exception("session.clear failed")

    # הפוך את ה-return לאובייקט Response אמיתי (לא dict/tuple)
    resp = current_app.make_response(success_response(message="התנתקת בהצלחה"))

    # מחיקת הקוקי (Flask 3 – שם מתוך config)
    try:
        cookie_name = current_app.config.get("SESSION_COOKIE_NAME", "session")
        resp.delete_cookie(
            key=cookie_name,
            path="/",
            domain=current_app.config.get("SESSION_COOKIE_DOMAIN"),
            samesite=current_app.config.get("SESSION_COOKIE_SAMESITE", "Lax"),
            secure=current_app.config.get("SESSION_COOKIE_SECURE", False),
        )
    except Exception:
        logger.exception("delete_cookie failed")

    return resp



@router.route("/api/user/me")
def get_current_user():
    user = session.get("user")
    if not user:
        return error_response("Not authenticated", code=401)
    return success_response(data={"user": user})


@router.route("/session-test")
def session_test():
    session["test"] = "working"
    return {"session_value": session.get("test")}


# -------- הצמדת Rate Limits למסלולי auth אם limiter קיים באפליקציה --------
@router.record_once
def _attach_rate_limits(setup_state):
    app = setup_state.app
    lim = app.extensions.get("limiter")
    if not lim:
        return
    try:
        vf = router.view_functions
        if 'login_google' in vf:
            lim.limit("10/hour")(vf['login_google'])
        if 'google_callback' in vf:
            lim.limit("30/hour")(vf['google_callback'])
        if 'logout' in vf:
            lim.limit("60/hour")(vf['logout'])
    except Exception as e:
        logger.warning(f"limiter attach failed: {e}")
