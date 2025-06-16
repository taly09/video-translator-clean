# r2_client.py
import os
import boto3
from load_env import *


def get_r2_client():
    required = ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ENDPOINT_URL"]
    for var in required:
        if not os.getenv(var):
            raise RuntimeError(f"Missing required env var: {var}")

    return boto3.session.Session().client(
        service_name='s3',
        aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
        endpoint_url=os.getenv("R2_ENDPOINT_URL"),
        region_name=""  # חובה ב־R2!
    )


def upload_file_to_r2(file_path: str, object_name: str) -> bool:
    print(f"🚀 מנסה להעלות קובץ: {file_path}")
    print(f"📁 שם אובייקט ב־R2: {object_name}")

    try:
        bucket_name = os.getenv("R2_BUCKET_NAME")
        if not bucket_name:
            print("❌ R2_BUCKET_NAME is not defined!")
            return False

        # וידוא שהקובץ באמת קיים לפני ההעלאה
        if not os.path.exists(file_path):
            print(f"❌ הקובץ לא קיים: {file_path}")
            return False

        print("📦 Uploading to bucket:", bucket_name)
        print("🌐 Endpoint URL:", os.getenv("R2_ENDPOINT_URL"))

        client = get_r2_client()

        with open(file_path, "rb") as f:
            client.upload_fileobj(f, bucket_name, object_name)

        print(f"✅ Uploaded {object_name} to R2")
        return True

    except Exception as e:
        print(f"❌ Upload failed: {str(e)}")
        return False
