from dotenv import load_dotenv
import os

# קבלת נתיב לקובץ .env.local ביחס למיקום הקובץ הנוכחי
dotenv_path = os.path.join(os.path.dirname(__file__), '.env.local')

# טעינת משתני סביבה מתוך הקובץ
load_dotenv(dotenv_path)

# הדפסת ערכים לבדיקה
print("R2_PUBLIC_BASE:", os.getenv("R2_PUBLIC_BASE"))
print("R2_BUCKET_NAME:", os.getenv("R2_BUCKET_NAME"))
