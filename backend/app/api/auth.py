from flask import Blueprint, request, session, redirect, current_app, url_for
from app.services.user_service import create_or_get_user
from app.response_utils import success_response, error_response
import os
import logging

logger = logging.getLogger(__name__)

router = Blueprint('auth', __name__)

@router.route("/login/google")
def login_google():
    google = current_app.google_oauth
    logger.info(f"Session before redirect: {dict(session)}")
    redirect_uri = url_for('auth.google_callback', _external=True)
    return google.authorize_redirect(redirect_uri)

@router.route("/auth/google/callback")
def google_callback():
    logger.info(f"Session at callback start: {dict(session)}")
    logger.info(f"Request args at callback: {request.args}")

    google = current_app.google_oauth
    try:
        token = google.authorize_access_token()
        logger.info(f"Token received: {token}")
    except Exception as e:
        logger.error(f"Authorization failed: {e}", exc_info=True)
        return error_response("Authorization failed", code=400, data={"details": str(e)})

    user_info = google.get('https://openidconnect.googleapis.com/v1/userinfo').json()
    logger.info(f"User info: {user_info}")

    if not user_info.get("email"):
        return error_response("Authentication failed", code=400)

    session['user'] = {
        "email": user_info["email"],
        "full_name": user_info.get("name"),
        "picture": user_info.get("picture")
    }

    create_or_get_user(user_info)

    frontend = os.getenv("FRONTEND_URL")
    return redirect(f"{frontend}?logged_in=true")


@router.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return success_response(message="התנתקת בהצלחה")

@router.route("/api/user/me")
def get_current_user():
    user = session.get("user")
    if not user:
        return error_response("Not authenticated", code=401)
    return success_response(data={"user": user})

@router.route("/session-test")
def session_test():
    session['test'] = 'working'
    return {"session_value": session.get('test')}
