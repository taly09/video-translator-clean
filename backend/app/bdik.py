import os
from dotenv import load_dotenv

# טוען את קובץ הסביבה
load_dotenv(".env.local")

print("R2_ENDPOINT_URL =", os.getenv("R2_ENDPOINT_URL"))
print("R2_ACCESS_KEY_ID =", os.getenv("R2_ACCESS_KEY_ID"))
print("R2_SECRET_ACCESS_KEY =", os.getenv("R2_SECRET_ACCESS_KEY"))
print("R2_BUCKET_NAME =", os.getenv("R2_BUCKET_NAME"))
