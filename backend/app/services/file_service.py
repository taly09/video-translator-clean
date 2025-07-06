import boto3
import os
import logging
from botocore.config import Config

from app.services.mongo_service import transcriptions_collection


logger = logging.getLogger(__name__)

s3_client = None

def init_s3_client():
    global s3_client
    print("📢 init_s3_client() called")  # <--- הוסף שורה זו
    logger.info("📢 init_s3_client() called")
    if s3_client is None:
        endpoint = os.getenv("R2_ENDPOINT_URL")
        access_key = os.getenv("R2_ACCESS_KEY_ID")
        secret_key = os.getenv("R2_SECRET_ACCESS_KEY")

        if not endpoint or not access_key or not secret_key:
            logger.error("❌ Missing R2 configuration! Check environment variables.")
            raise RuntimeError("Missing R2 configuration")

        s3_client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(signature_version='s3v4')  # הוסף את השורה הזו
        )

        logger.info("✅ S3 client initialized")


def upload_file_to_r2(local_path, object_key):
    try:
        if s3_client is None:
            raise RuntimeError("S3 client not initialized. Call init_s3_client() first.")

        bucket = os.getenv("R2_BUCKET_NAME")
        if not bucket:
            logger.error("❌ R2_BUCKET_NAME is not set!")
            return False

        print(f"[UPLOAD] Uploading file '{local_path}' with object key '{object_key}' to bucket '{bucket}'")  # לוג נוסף
        logger.info(f"Uploading file: {local_path} to bucket: {bucket} with object key: {object_key}")

        s3_client.upload_file(local_path, bucket, object_key)

        print(f"[UPLOAD] Successfully uploaded '{local_path}' as '{object_key}' to bucket '{bucket}'")  # לוג נוסף
        logger.info(f"✅ Uploaded {local_path} as {object_key} to bucket {bucket}")

        return True
    except Exception as e:
        logger.exception(f"❌ upload_file_to_r2 error: {e}")
        return False


def get_r2_signed_url(key, expires_in=3600):
    if s3_client is None:
        raise RuntimeError("S3 client not initialized. Call init_s3_client() first.")

    bucket = os.getenv("R2_BUCKET_NAME")
    if not bucket:
        logger.error("❌ R2_BUCKET_NAME is not set!")
        return None

    try:
        url = s3_client.generate_presigned_url(
            ClientMethod='get_object',
            Params={
                'Bucket': bucket,
                'Key': key
            },
            ExpiresIn=expires_in
        )
        logger.info(f"✅ Generated signed URL for {key}")
        return url
    except Exception as e:
        logger.exception(f"❌ Error generating signed URL for {key}: {e}")
        return None

def upload_outputs_and_update_db(task_id, outputs):
    from app.services.file_service import s3_client, init_s3_client, upload_file_to_r2

    if s3_client is None:
        init_s3_client()

    bucket = os.getenv("R2_BUCKET_NAME")
    if not bucket:
        logger.error("❌ R2_BUCKET_NAME is not configured!")
        raise RuntimeError("R2_BUCKET_NAME is missing")

    R2_PUBLIC_BASE = os.getenv("R2_PUBLIC_BASE", "https://example.com")
    print(f"[DEBUG] R2_PUBLIC_BASE env var: {R2_PUBLIC_BASE}")
    logger.info(f"R2_PUBLIC_BASE env var: {R2_PUBLIC_BASE}")
    r2_files = {}
    failed_files = {}

    for file_type, local_path in outputs.items():
        if not os.path.exists(local_path):
            logger.warning(f"⚠️ File not found: {local_path}")
            failed_files[file_type] = "Local file not found"
            continue

        file_name = os.path.basename(local_path)
        object_key = f"{task_id}/{file_name}"


        # בדיקה לכפילות של שם ה-bucket בתוך object_key
        if bucket in object_key:
            print(f"⚠️ [WARNING] Bucket name '{bucket}' appears inside object_key: {object_key}")

        print(f"[UPLOAD_DB] Processing filetype '{file_type}', local_path '{local_path}', object_key '{object_key}'")

        try:
            success = upload_file_to_r2(local_path, object_key)
            if success:
                url = f"{R2_PUBLIC_BASE}/{object_key}"
                # בדיקה לכפילות של שם ה-bucket בתוך URL
                if bucket in url.split(f"{bucket}/")[-1]:
                    print(f"⚠️ [WARNING] Bucket name '{bucket}' appears inside URL path: {url}")

                r2_files[file_type] = {"url": url, "key": object_key}
                logger.info(f"✅ Uploaded {file_type}: {url}")
                print(f"[UPLOAD_DB] Uploaded '{file_type}' successfully, url: {url}")
            else:
                logger.error(f"❌ Upload failed for {file_type}: {local_path}")
                failed_files[file_type] = "Upload failed"
        except Exception as e:
            logger.exception(f"❌ Exception uploading {file_type}: {e}")
            failed_files[file_type] = str(e)

    if r2_files:
        print(f"[UPLOAD_DB] Updating DB for task_id '{task_id}' with files: {r2_files}")
        transcriptions_collection.update_one(
            {"task_id": task_id},
            {"$set": {"r2_files": r2_files}}
        )
        logger.info(f"✅ r2_files saved for task {task_id}")
    else:
        logger.warning(f"⚠️ No files uploaded for task {task_id}")

    print(f"[UPLOAD_DB] Upload result - uploaded: {r2_files}, failed: {failed_files}")

    return {
        "uploaded": r2_files,
        "failed": failed_files
    }
