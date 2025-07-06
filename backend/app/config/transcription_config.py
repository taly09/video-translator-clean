import yaml
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class TranscriptionConfig:
    DEFAULTS = {
        "whisper_model": "medium",
        "beam_size": 4,
        "best_of": 5,
        "temperature": 0.0,
        "compression_ratio_threshold": 2.4,
        "subtitle_style": {
            "font": "Arial",
            "font_size": 24,
            "color": "white"
        }
    }

    def __init__(self, config_path=None):
        if config_path is None:
            config_path = Path(__file__).parent.parent / "config" / "transcription_config.yaml"
        self.config_path = config_path
        self.config = self.load_config()

    def load_config(self):
        if not self.config_path.exists():
            logger.warning(f"Config file not found at {self.config_path}, using defaults.")
            return self.DEFAULTS.copy()

        logger.info(f"Loading transcription config from {self.config_path}")

        with open(self.config_path, "r", encoding="utf-8") as f:
            yaml_config = yaml.safe_load(f) or {}

        merged_config = self.merge_dicts(self.DEFAULTS, yaml_config)
        self.validate_config(merged_config)

        logger.info(f"Merged transcription config: {merged_config}")
        logger.info(f"Using whisper_model: {merged_config.get('whisper_model')}")

        return merged_config

    def merge_dicts(self, base, override):
        result = base.copy()
        for key, value in override.items():
            if isinstance(value, dict) and key in result:
                result[key] = self.merge_dicts(result[key], value)
            else:
                result[key] = value
        return result

    def validate_config(self, config):
        if config["beam_size"] < 1 or config["beam_size"] > 10:
            raise ValueError("beam_size must be between 1 and 10")
        if config["best_of"] < 1 or config["best_of"] > 10:
            raise ValueError("best_of must be between 1 and 10")
        if not (0.0 <= config["temperature"] <= 1.0):
            raise ValueError("temperature must be between 0.0 and 1.0")
        logger.info(f"Transcription config validated: {config}")

    def get(self):
        return self.config
