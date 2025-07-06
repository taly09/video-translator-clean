from app.services.mongo_service import users_collection
from app.services.email_service import send_welcome_email
import os
import logging

logger = logging.getLogger(__name__)


def get_user_usage_and_plan(user_email):
    try:
        user = users_collection.find_one({"_id": user_email})
        if not user:
            logger.info(f"User {user_email} not found in database.")
            return "FREE", {"minutes_this_month": 0, "transcripts_this_month": 0}

        plan = user.get("plan", "FREE")
        usage = {
            "minutes_this_month": user.get("minutes_this_month", 0),
            "transcripts_this_month": user.get("transcripts_this_month", 0)
        }
        logger.debug(f"Retrieved plan and usage for {user_email}: {plan}, {usage}")
        return plan, usage

    except Exception as e:
        logger.exception(f"❌ Failed to get usage and plan for {user_email}: {e}")
        return "FREE", {"minutes_this_month": 0, "transcripts_this_month": 0}


def create_or_get_user(user_info):
    email = user_info["email"]
    try:
        existing = users_collection.find_one({"_id": email})
        if not existing:
            users_collection.insert_one({
                "_id": email,
                "email": email,
                "plan": "FREE",
                "credits": 200,
                "minutes_this_month": 0,
                "transcripts_this_month": 0
            })
            logger.info(f"✅ Created new user: {email}")

            send_welcome_email(
                to=email,
                name=user_info.get("name", "משתמש"),
                dashboard_link=os.getenv("FRONTEND_URL")
            )
        else:
            logger.debug(f"User {email} already exists, no action taken.")

    except Exception as e:
        logger.exception(f"❌ Failed to create or get user {email}: {e}")
