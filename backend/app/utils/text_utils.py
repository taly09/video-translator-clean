# text_utils.py
import re
import unicodedata

def prepare_text_for_ass(text: str, rtl: bool = False) -> str:
    """
    מנקה ומעבד טקסט עבור כתוביות ASS, כולל תמיכה ב־RTL.
    (אל תהפוך סדר מילים — זה נדרש רק בתצוגה בפרונט, לא בקובצי טקסט!)
    """
    # הסרת תווים בעייתיים
    text = re.sub(r'[\u202A-\u202E\u200F\u200E]', '', text)
    text = unicodedata.normalize("NFC", text)
    return text
