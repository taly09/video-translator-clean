# backend/billing.py
from enum import Enum
from typing import Optional, Dict, Any


class PlanType(str, Enum):
    GUEST = "guest"
    FREE = "free"
    PRO = "pro"
    PREMIUM = "premium"
    CREDITS = "credits"


# תקרות לפי מסלול
PLAN_LIMITS: Dict[PlanType, Dict[str, Optional[int]]] = {
    PlanType.GUEST: {
        "max_transcripts": 3,
        "max_minutes": 30,
        "ai_summary": False,
        "live_transcription": False,
    },
    PlanType.FREE: {
        "max_transcripts": 3,
        "max_minutes": 30,
        "ai_summary": False,
        "live_transcription": False,
    },
    PlanType.PRO: {
        "max_transcripts": 100,
        "max_minutes": 120,
        "ai_summary": True,
        "live_transcription": True,
    },
    PlanType.PREMIUM: {
        "max_transcripts": None,   # None = ללא הגבלה
        "max_minutes": None,
        "ai_summary": True,
        "live_transcription": True,
    },
    PlanType.CREDITS: {
        # בקרדיטים אין תקרה קבועה; משתמשים בשדות usage: credits_left, per_credit_minutes
        "credits_available": 10,
        "per_credit_minutes": 10,
    },
}


def _plan_from_str(s: Optional[str]) -> PlanType:
    if not s:
        return PlanType.GUEST
    try:
        return PlanType(s.lower())
    except ValueError:
        return PlanType.GUEST


def normalize_usage(usage: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    מאפס ערכים חסרים כדי למנוע KeyError.
    מפתחי ברירת מחדל:
      transcripts, minutes_used, credits_left, per_credit_minutes, concurrency
    """
    u = usage or {}
    return {
        "transcripts": int(u.get("transcripts", 0)),
        "minutes_used": float(u.get("minutes_used", 0)),
        "credits_left": int(u.get("credits_left", 0)),
        "per_credit_minutes": int(u.get("per_credit_minutes", PLAN_LIMITS[PlanType.CREDITS]["per_credit_minutes"])),
        "concurrency": int(u.get("concurrency", 0)),
    }


def _under_cap(value: int | float, cap: Optional[int | float]) -> bool:
    """True אם אין תקרה (None) או שהערך קטן מהתקרה."""
    if cap is None:
        return True
    return value < cap


# פונקציה לבדוק האם מותר למשתמש להעלות תמלול
def is_allowed_to_transcribe(user_plan: Optional[str], current_usage: Optional[Dict[str, Any]]) -> bool:
    plan = _plan_from_str(user_plan)
    limits = PLAN_LIMITS.get(plan)
    if not limits:
        return False

    u = normalize_usage(current_usage)

    if plan in (PlanType.GUEST, PlanType.FREE, PlanType.PRO, PlanType.PREMIUM):
        # מסלולים לפי תקרות דקות/מספר תמלולים
        max_transcripts = limits.get("max_transcripts")
        max_minutes = limits.get("max_minutes")
        return (
            _under_cap(u["transcripts"], max_transcripts) and
            _under_cap(u["minutes_used"], max_minutes)
        )

    if plan == PlanType.CREDITS:
        # מותר אם נותרו קרדיטים, או אם יש דקות זמינות מחישוב קרדיטים
        return u["credits_left"] > 0

    return False
