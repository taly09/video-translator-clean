from pymongo import MongoClient
import os
from dotenv import load_dotenv
from billing import PlanType
import logging
from pathlib import Path

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
env_path = Path(__file__).resolve().parent / ".env.local"

load_dotenv(dotenv_path=env_path)

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("❌ Missing MONGO_URI environment variable.")

# 1. התחברות ל־MongoDB
client = MongoClient(MONGO_URI)

# 2. הגדרת בסיסי נתונים ואוספים
db = client["video_platform"]
users_collection = db["users"]
transcriptions_collection = db["transcriptions"]

# 3. פונקציה לשימוש במסלולים
def get_user_usage_and_plan(user_id):
    user = db.users.find_one({"email": user_id})
    if not user:
        raise Exception("User not found")

    usage = {
        "transcripts": user.get("transcripts_this_month", 0),
        "minutes_used": user.get("minutes_this_month", 0),
        "credits_left": user.get("credits", 0)
    }

    # ניסיון להמיר את ה־plan ל־Enum, אחרת ברירת מחדל
    raw_plan = user.get("plan", "free")
    try:
        plan = PlanType(raw_plan.lower())  # ← חשוב: הפיכה לערך Enum אמיתי
    except ValueError:
        plan = PlanType.FREE

    print("🔍 get_user_usage_and_plan() → plan:", plan)
    print("   transcripts =", usage["transcripts"])
    print("   minutes_used =", usage["minutes_used"])
    print("   credits_left =", usage["credits_left"])

    return plan, usage




def update_user_usage(user_id, minutes_used):
    logger.info(f"🔄 update_user_usage called for user_id={user_id} with minutes_used={minutes_used}")

    # ✅ שינוי קריטי: חיפוש לפי email ולא לפי _id
    user = users_collection.find_one({"email": user_id})
    if not user:
        logger.warning(f"❌ User {user_id} not found")
        return False

    raw_plan = user.get("plan", "free")
    try:
        plan = PlanType(raw_plan.lower())
    except ValueError:
        plan = PlanType.FREE

    updates = {
        "$inc": {
            "transcripts_this_month": 1,
            "minutes_this_month": minutes_used
        }
    }

    if plan == PlanType.FREE:
        updates["$inc"]["credits"] = -1

    # ✅ גם כאן: עדכון לפי email
    result = users_collection.update_one({"email": user_id}, updates)
    return result.modified_count > 0



if __name__ == "__main__":
    plan, usage = get_user_usage_and_plan("talyaacobi9@gmail.com")
    from billing import is_allowed_to_transcribe
    print("✅ מותר לתמלל?" , is_allowed_to_transcribe(plan, usage))

    print("📣 מנסה לעדכן שימוש למשתמש...")
    success = update_user_usage("talyaacobi9@gmail.com", 5)
    print("🟢 הצלחה?" , success)

