# app/middleware/csrf.py
from flask import request, session
SAFE_METHODS = {"GET","HEAD","OPTIONS"}

def verify_csrf():
    if request.method in SAFE_METHODS:
        return None
    header = request.headers.get("X-CSRF-Token")
    if not header or header != session.get("csrf_token"):
        from app.response_utils import error_response
        return error_response("CSRF failed", 403)
    return None
