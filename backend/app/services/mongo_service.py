from pymongo import MongoClient, errors
from dotenv import load_dotenv
import os
import logging

logger = logging.getLogger(__name__)

# טוען משתני סביבה מהקובץ .env.local
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
load_dotenv(dotenv_path=env_path)

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    logger.error("❌ MONGO_URI is not set in environment variables.")
    raise RuntimeError("MONGO_URI is required")

logger.info(f"Using MONGO_URI = {MONGO_URI}")

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.server_info()  # מוודא שהחיבור למסד תקין
    logger.info("✅ Connected to MongoDB")
except errors.ServerSelectionTimeoutError as e:
    logger.error(f"❌ Failed to connect to MongoDB: {e}")
    raise

db = client["video_platform"]
users_collection = db["users"]
transcriptions_collection = db["transcriptions"]

# פונקציה שמעדכנת את השימוש של המשתמש (בדקות ובמספר תמלולים)
def update_user_usage(email, duration):
    try:
        result = users_collection.update_one(
            {"_id": email},
            {"$inc": {
                "minutes_this_month": duration // 60,
                "transcripts_this_month": 1
            }},
            upsert=True
        )
        logger.info(f"✅ Updated usage for {email}. Matched: {result.matched_count}, Modified: {result.modified_count}")
    except Exception as e:
        logger.exception(f"❌ Failed to update usage for {email}: {e}")

# פונקציה שמחזירה את תכנית המנוי והשימוש של המשתמש
def get_user_usage_and_plan(email):
    try:
        user = users_collection.find_one({"_id": email})
        if user:
            return user.get("plan", "FREE"), {
                "minutes_this_month": user.get("minutes_this_month", 0),
                "transcripts_this_month": user.get("transcripts_this_month", 0)
            }
        else:
            return "FREE", {
                "minutes_this_month": 0,
                "transcripts_this_month": 0
            }
    except Exception as e:
        logger.exception(f"❌ Failed to fetch usage for {email}: {e}")
        return "FREE", {
            "minutes_this_month": 0,
            "transcripts_this_month": 0
        }
