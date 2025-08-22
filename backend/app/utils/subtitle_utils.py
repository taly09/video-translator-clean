import uuid
from datetime import timedelta

# סימני פיסוק מוכרים – לשפות שונות
SUPPORTED_PUNCTUATION = (".", "!", "?", "…", ":", ";", "。", "！", "？")


def clean_ending_punctuation(text):
    """
    מנקה פסיקים מיותרים ומוודא שיש סימן סיום תקני בסוף משפט.
    """
    text = text.strip()
    if not text:
        return text

    # אם מסתיים בפסיק, הסר אותו
    if text.endswith(","):
        text = text[:-1].rstrip()

    # אם אין סימן פיסוק תקני בסוף – הוסף נקודה
    if not text.endswith(SUPPORTED_PUNCTUATION):
        text += "."

    return text


def split_segment_by_punctuation_and_timing(segment, max_chars=80, max_duration=6.0, language='en'):
    if "words" not in segment or not segment["words"]:
        return []

    chunks = []
    current_chunk = []
    chunk_start = None

    def flush_chunk(force_punctuation_cleanup=False):
        if not current_chunk:
            return

        if language in ['zh', 'ja', 'ko']:
            chunk_text = ''.join([w["word"] for w in current_chunk]).strip()
        else:
            chunk_text = ' '.join([w["word"] for w in current_chunk]).strip()

        if not chunk_text:
            return

        if force_punctuation_cleanup:
            chunk_text = clean_ending_punctuation(chunk_text)

        chunk_end = current_chunk[-1]["end"]
        chunks.append({
            "id": str(uuid.uuid4()),
            "start": chunk_start,
            "end": chunk_end,
            "text": chunk_text
        })

    for word in segment["words"]:
        w_text = word["word"]
        if chunk_start is None:
            chunk_start = word["start"]

        current_chunk.append(word)

        is_punctuation = any(w_text.endswith(p) for p in SUPPORTED_PUNCTUATION)
        if language in ['zh', 'ja', 'ko']:
            chunk_text = ''.join([w["word"] for w in current_chunk])
        else:
            chunk_text = ' '.join([w["word"] for w in current_chunk])

        chunk_duration = word["end"] - chunk_start
        too_long = len(chunk_text) >= max_chars
        too_slow = chunk_duration >= max_duration

        should_split = is_punctuation or too_long or too_slow

        if should_split:
            flush_chunk(force_punctuation_cleanup=is_punctuation)
            current_chunk = []
            chunk_start = None

    flush_chunk()
    return chunks


def format_time(seconds):
    """
    ממיר שניות לפורמט כתוביות: 00:00:00,000
    """
    td = timedelta(seconds=seconds)
    total_seconds = int(td.total_seconds())
    milliseconds = int((td.total_seconds() - total_seconds) * 1000)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    return f"{hours:02}:{minutes:02}:{secs:02},{milliseconds:03}"


def is_rtl_text(text):
    """
    בודק אם טקסט מכיל תווים מימין לשמאל (עברית / ערבית)
    """
    return any("\u0590" <= c <= "\u06FF" for c in text)

def build_word_by_word_segments(segments):
    """
    יוצר סגמנטים לפי מילה אחת בכל פעם – עבור מצב 'word-by-word'.
    """
    word_segments = []

    for seg in segments:
        for w in seg.get("words", []):
            word_segments.append({
                "start": w["start"],
                "end": w["end"],
                "text": w["word"],
                "style": {
                    "highlightWord": w["word"],
                    "highlightColor": "#FF0000"
                }
            })

    return word_segments

def build_cumulative_segments(segments):
    """
    יוצר סגמנטים מצטברים – עבור מצב 'word-by-word-cumulative'.
    כל מילה מתווספת לטקסט, ומודגשת.
    """
    cumulative_segments = []

    for seg in segments:
        words = seg.get("words", [])
        cumulative_text = ""

        for i, w in enumerate(words):
            cumulative_text += w["word"] + " "
            cumulative_segments.append({
                "start": w["start"],
                "end": w["end"],
                "text": cumulative_text.strip(),
                "style": {
                    "highlightWord": w["word"],
                    "highlightColor": "#FF0000"
                }
            })

    return cumulative_segments
