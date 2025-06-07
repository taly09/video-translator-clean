# load_env.py
import os
from pathlib import Path
from dotenv import load_dotenv

env_name = os.getenv("ENV", "local")  # ברירת מחדל: local
env_file = f".env.{env_name}"

env_path = Path(__file__).resolve().parent / env_file
print(f"🔄 loading env: {env_file} ({env_path})")

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    print(f"⚠️ env file not found: {env_file}")
