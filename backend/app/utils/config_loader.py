import yaml
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def load_transcription_config():
    config_path = Path(__file__).parent.parent / "config" / "transcription_config.yaml"
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found at {config_path}")

    logger.info(f"Loading transcription config from {config_path}")

    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    defaults = {
        "beam_size": 5,
        "best_of": 5,
        "temperature": 0.0,
        "compression_ratio_threshold": 2.4,
        "whisper_model": "medium",  # חשוב להוסיף ברירת מחדל כאן!
        "device": "cuda"  # אם תרצה, אפשר להוסיף גם device
    }

    final_config = {**defaults, **config}

    logger.info(f"Loaded transcription config: {final_config}")  # מדפיסים את הקונפיג המלא

    return final_config
