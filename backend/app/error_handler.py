from flask import jsonify
from werkzeug.exceptions import HTTPException
import logging

logger = logging.getLogger(__name__)

def register_error_handlers(app):
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        logger.warning(f"HTTPException: {e.code} - {e.description}")
        response = {
            "status": "error",
            "message": e.description,
            "code": e.code
        }
        return jsonify(response), e.code

    @app.errorhandler(Exception)
    def handle_generic_exception(e):
        logger.exception("Unhandled Exception")
        response = {
            "status": "error",
            "message": "Internal server error",
            "code": 500
        }
        return jsonify(response), 500
