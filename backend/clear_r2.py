import os
from dotenv import load_dotenv
from app.services.file_service import delete_prefix_from_r2, init_s3_client

# טוען ENV מהקובץ שלך
load_dotenv(dotenv_path=os.path.join("app", ".env.local"), override=True)

# מחבר ל-R2
init_s3_client()

# בדיקה בלבד: מציג מה היה נמחק
deleted = delete_prefix_from_r2(prefix="", dry_run=False)

print(f"📦 נמצא {deleted} קבצים למחיקה (dry run).")
