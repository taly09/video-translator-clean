# backend/billing.py

from enum import Enum


class PlanType(str, Enum):
    FREE = "free"
    PRO = "pro"
    PREMIUM = "premium"
    CREDITS = "credits"


# תקרות לפי מסלול
PLAN_LIMITS = {
    PlanType.FREE: {
        "max_transcripts": 3,
        "max_minutes": 30,
        "ai_summary": False,
        "live_transcription": False
    },
    PlanType.PRO: {
        "max_transcripts": 100,
        "max_minutes": 120,
        "ai_summary": True,
        "live_transcription": True
    },
    PlanType.PREMIUM: {
        "max_transcripts": None,
        "max_minutes": None,
        "ai_summary": True,
        "live_transcription": True
    },
    PlanType.CREDITS: {
        "credits_available": 10,
        "per_credit_minutes": 10  # נניח שכל קרדיט = 10 דקות
    }
}


# פונקציה לבדוק האם מותר למשתמש להעלות תמלול
def is_allowed_to_transcribe(user_plan, current_usage):

    try:
        user_plan = PlanType(user_plan.lower())  # ← ההמרה החשובה
    except ValueError:
        return False

    limits = PLAN_LIMITS.get(user_plan)
    if not limits:
        return False

    if user_plan == PlanType.FREE:
        return (
            current_usage["transcripts"] < limits["max_transcripts"]
            and current_usage["minutes_used"] < limits["max_minutes"]
            and current_usage["credits_left"] > 0
        )

    if user_plan == PlanType.PRO:
        return (
            current_usage["transcripts"] < limits["max_transcripts"]
            and current_usage["minutes_used"] < limits["max_minutes"]
        )

    if user_plan == PlanType.CREDITS:
        return current_usage["credits_left"] > 0

    return True  # PlanType.PREMIUM

