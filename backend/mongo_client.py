import os
import logging
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv
from billing import PlanType, is_allowed_to_transcribe

# 🎯 קונפיגורציית לוגינג
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# 🌍 טוען את קובץ הסביבה לפי ENV
env_name = os.getenv("ENV", "local")
env_path = Path(__file__).resolve().parent / f".env.{env_name}"
print(f"🔁 loading .env: {env_path.name}")

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    print(f"⚠️ לא נמצא קובץ env: {env_path}")

# 🔐 משתני סביבה
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("❌ Missing MONGO_URI environment variable.")

# 🚀 התחברות ל־MongoDB
client = MongoClient(MONGO_URI)
db = client["video_platform"]
users_collection = db["users"]
transcriptions_collection = db["transcriptions"]

# 🧠 פונקציה אחידה להמרת plan ממחרוזת ל־Enum
def safe_get_plan(user_dict) -> PlanType:
    raw = user_dict.get("plan", "free")
    try:
        return PlanType(raw.lower())
    except ValueError:
        return PlanType.FREE

# 📊 שימוש לפי plan
def get_user_usage_and_plan(user_id):
    if not isinstance(user_id, str) or "@" not in user_id:
        raise ValueError("Invalid user_id format")

    user = users_collection.find_one({"email": user_id})
    if not user:
        raise Exception("User not found")

    usage = {
        "transcripts": user.get("transcripts_this_month", 0),
        "minutes_used": user.get("minutes_this_month", 0),
        "credits_left": user.get("credits", 0)
    }

    plan = safe_get_plan(user)

    print("🔍 get_user_usage_and_plan() → plan:", plan)
    print("   transcripts =", usage["transcripts"])
    print("   minutes_used =", usage["minutes_used"])
    print("   credits_left =", usage["credits_left"])

    return plan, usage

# 🔄 עדכון שימוש למשתמש
def update_user_usage(user_id, minutes_used):
    logger.info(f"🔄 update_user_usage called for user_id={user_id} with minutes_used={minutes_used}")

    user = users_collection.find_one({"email": user_id})
    if not user:
        logger.warning(f"❌ User {user_id} not found")
        return False

    plan = safe_get_plan(user)

    updates = {
        "$inc": {
            "transcripts_this_month": 1,
            "minutes_this_month": minutes_used
        }
    }

    result = users_collection.update_one({"email": user_id}, updates)
    return result.modified_count > 0

# 🧪 בדיקות ל־dev בלבד
if __name__ == "__main__":
    if os.getenv("FLASK_ENV") == "development":
        test_email = "talyaacobi9@gmail.com"

        # 🔍 בדיקת plan ושימוש
        plan, usage = get_user_usage_and_plan(test_email)
        print("✅ מותר לתמלל?" , is_allowed_to_transcribe(plan, usage))

        print("📣 מנסה לעדכן שימוש למשתמש...")
        success = update_user_usage(test_email, 5)
        print("🟢 הצלחה?" , success)

        # 💥 עדכון זמני: הפוך את המשתמש ל־PREMIUM (dev בלבד!)
        users_collection.update_one(
            {"email": test_email},
            {"$set": {"plan": "premium", "credits": 999}}
        )
        print("✅ המשתמש עודכן ל־premium עם 999 קרדיטים")
