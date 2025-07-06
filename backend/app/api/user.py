from flask import Blueprint, session
from app.services.mongo_service import users_collection
from app.response_utils import success_response, error_response

router = Blueprint('user', __name__)

@router.route("/api/user/usage", methods=["GET"])
def get_user_usage():
    user = session.get("user")
    if not user:
        return error_response("User not logged in", code=401)

    user_doc = users_collection.find_one({"_id": user["email"]})
    if not user_doc:
        return error_response("User not found", code=404)

    usage = {
        "minutes_this_month": user_doc.get("minutes_this_month", 0),
        "transcripts_this_month": user_doc.get("transcripts_this_month", 0),
        "plan": user_doc.get("plan", "FREE")
    }

    return success_response(usage, message="User usage fetched successfully")
