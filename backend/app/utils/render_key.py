# app/utils/render_key.py
import hashlib, json
from typing import List, Dict, Any

def make_render_key(
    video_key: str,
    segments: List[Dict[str, Any]],
    width: int,
    height: int,
    fps: int,
    codec: str = "h264",
    crf: int = 18,
    preset: str = "slow",
) -> str:
    payload = {
        "video_key": video_key,
        "segments": segments,
        "w": width, "h": height, "fps": fps,
        "codec": codec, "crf": crf, "preset": preset,
    }
    data = json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")
    return hashlib.sha256(data).hexdigest()[:32]
