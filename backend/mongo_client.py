from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()  # טען את הסביבה אם צריך

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("❌ Missing MONGO_URI environment variable.")

client = MongoClient(MONGO_URI)

db = client["video_platform"]
users_collection = db["users"]
transcriptions_collection = db["transcriptions"]
