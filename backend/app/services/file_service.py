import boto3
import os
import logging
import mimetypes
from urllib.parse import urlparse
from botocore.config import Config
from typing import Callable, Optional

from app.services.mongo_service import transcriptions_collection

logger = logging.getLogger(__name__)

s3_client = None

def init_s3_client():
    global s3_client
    logger.info("📢 init_s3_client() called")
    if s3_client is not None:
        return
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
        config=Config(signature_version="s3v4")
    )
    logger.info("✅ S3 client initialized")


def _norm_key(key: str) -> str:
    """נרמול key: הסרת סלאש מוביל / ושם bucket אם שובץ בטעות."""
    if not key:
        return key
    key = key.lstrip("/")
    bucket = os.getenv("R2_BUCKET_NAME") or ""
    if bucket and key.startswith(bucket + "/"):
        key = key[len(bucket) + 1:]
    return key


def upload_file_to_r2(local_path, object_key, *, filename: str | None = None, force_download: bool = True):
    try:
        init_s3_client()

        if not local_path or not isinstance(local_path, (str, bytes, os.PathLike)):
            logger.error("❌ upload_file_to_r2: invalid local_path (None or not path-like)")
            return False
        if not os.path.isfile(local_path):
            logger.error(f"❌ upload_file_to_r2: file does not exist: {local_path}")
            return False

        bucket = os.getenv("R2_BUCKET_NAME")
        if not bucket:
            logger.error("❌ R2_BUCKET_NAME is not set!")
            return False

        object_key = _norm_key(object_key)
        ctype, _ = mimetypes.guess_type(local_path)

        extra = {}
        if ctype:
            extra["ContentType"] = ctype

        # 🔧 כופה הורדה עם שם קובץ ידידותי (חשוב ל-iOS/Safari)
        if force_download:
            if not filename:
                # אם לא העברת שם – ננסה להסיק מהאובייקט/פייל
                base = os.path.basename(local_path)
                filename = base or "download"
            extra["ContentDisposition"] = f'attachment; filename="{filename}"'

        logger.info(f"⬆️ Uploading: {local_path} -> s3://{bucket}/{object_key} (ContentType={ctype}, ContentDisposition={extra.get('ContentDisposition')})")
        s3_client.upload_file(local_path, bucket, object_key, ExtraArgs=extra)
        logger.info(f"✅ Uploaded {local_path} as {object_key} to bucket {bucket}")
        return True
    except Exception as e:
        logger.exception(f"❌ upload_file_to_r2 error: {e}")
        return False



def get_r2_signed_url(key, expires_in=None, *, download_filename: str | None = None, content_type: str | None = None, force_download: bool = True):
    init_s3_client()
    bucket = os.getenv("R2_BUCKET_NAME")
    if not bucket:
        logger.error("❌ R2_BUCKET_NAME is not set!")
        return None

    key = _norm_key(key)
    ttl = int(expires_in or os.getenv("SIGNED_URL_TTL", "600"))

    # 🔧 נזריק כותרות תגובה כדי שההורדה תעבוד חלק גם בלינק חתום
    response_headers = {}
    if force_download:
        # אם לא התקבל שם – ננסה להסיק
        if not download_filename:
            download_filename = os.path.basename(key) or "download"
        response_headers["ResponseContentDisposition"] = f'attachment; filename="{download_filename}"'
    if content_type:
        response_headers["ResponseContentType"] = content_type

    try:
        url = s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": bucket,
                "Key": key,
                **response_headers,  # ← כאן הקסם
            },
            ExpiresIn=ttl,
        )
        logger.info(f"✅ Generated signed URL for {key} (ttl={ttl}s, headers={response_headers})")
        return url
    except Exception as e:
        logger.exception(f"❌ Error generating signed URL for {key}: {e}")
        return None


def generate_signed_url_from_r2_url(raw_url: str, expires_in=600) -> str:
    """מקבלת URL מלא מ-R2 ומחזירה Signed URL."""
    init_s3_client()
    if not raw_url:
        logger.warning("⚠️ Invalid raw_url (empty)")
        return None

    try:
        parts = urlparse(raw_url)
        if not parts.netloc or not parts.path:
            logger.warning(f"⚠️ Invalid raw_url: {raw_url}")
            return None

        path = parts.path.lstrip("/")
        bucket = os.getenv("R2_BUCKET_NAME") or ""
        # אם ה-path מתחיל ב-bucket/, הסר אותו
        key = path.split("/", 1)[1] if bucket and path.startswith(bucket + "/") else path
        key = _norm_key(key)
        return get_r2_signed_url(key, expires_in)
    except Exception:
        logger.exception(f"❌ Failed to generate signed URL from raw_url: {raw_url}")
        return None


def upload_outputs_and_update_db(task_id, outputs):
    init_s3_client()

    bucket = os.getenv("R2_BUCKET_NAME")
    if not bucket:
        logger.error("❌ R2_BUCKET_NAME is not configured!")
        raise RuntimeError("R2_BUCKET_NAME is missing")

    r2_files = {}
    failed_files = {}

    for file_type, local_path in outputs.items():
        if not local_path:
            logger.warning(f"⚠️ {file_type}: local_path is None – skipping")
            failed_files[file_type] = "Local path is None"
            continue
        if not os.path.exists(local_path):
            logger.warning(f"⚠️ File not found: {local_path}")
            failed_files[file_type] = "Local file not found"
            continue

        ext = os.path.splitext(local_path)[1].lstrip(".").lower()
        object_key = _norm_key(f"{task_id}/latest.{ext}")
        logger.info(f"[UPLOAD_DB] {file_type}: {local_path} -> {object_key}")

        try:
            if upload_file_to_r2(local_path, object_key):
                url = get_r2_signed_url(object_key)
                r2_files[file_type] = {"url": url, "key": object_key}
                logger.info(f"✅ Uploaded {file_type}: {url}")
            else:
                logger.error(f"❌ Upload failed for {file_type}: {local_path}")
                failed_files[file_type] = "Upload failed"
        except Exception as e:
            logger.exception(f"❌ Exception uploading {file_type}: {e}")
            failed_files[file_type] = str(e)

    if r2_files:
        proxy_urls = {ft: f"/api/proxy/results/{task_id}/{ft}" for ft in r2_files.keys()}
        transcriptions_collection.update_one(
            {"task_id": task_id},
            {"$set": {"r2_files": r2_files, "proxy_urls": proxy_urls}}
        )
        logger.info(f"✅ r2_files and proxy_urls saved for task {task_id}")
    else:
        logger.warning(f"⚠️ No files uploaded for task {task_id}")

    return {"uploaded": r2_files, "failed": failed_files}

def delete_prefix_from_r2(
    prefix: str,
    *,
    exclude: Optional[Callable[[str], bool]] = None,
    dry_run: bool = False
) -> int:
    """
    מוחק *בכמויות* את כל האובייקטים תחת prefix.
    exclude(key) -> True מאפשר לדלג על key מסוים.
    אם dry_run=True רק סופר/מדפיס ולא מוחק.
    מחזיר את מספר הפריטים שנמחקו/היו אמורים להימחק.
    """
    init_s3_client()
    bucket = os.getenv("R2_BUCKET_NAME")
    if not bucket:
        raise RuntimeError("R2_BUCKET_NAME is missing")

    deleted_total = 0
    continuation = None

    while True:
        kwargs = {"Bucket": bucket, "Prefix": prefix, "MaxKeys": 1000}
        if continuation:
            kwargs["ContinuationToken"] = continuation

        resp = s3_client.list_objects_v2(**kwargs)
        contents = resp.get("Contents", [])
        if not contents:
            break

        batch = []
        for obj in contents:
            key = obj["Key"]
            if exclude and exclude(key):
                continue
            batch.append({"Key": key})

            if len(batch) == 1000:
                if not dry_run:
                    s3_client.delete_objects(Bucket=bucket, Delete={"Objects": batch})
                deleted_total += len(batch)
                batch = []

        if batch:
            if not dry_run:
                s3_client.delete_objects(Bucket=bucket, Delete={"Objects": batch})
            deleted_total += len(batch)

        if resp.get("IsTruncated"):
            continuation = resp.get("NextContinuationToken")
        else:
            break

    logger.info(f"🧹 delete_prefix_from_r2('{prefix}') deleted {deleted_total} objects (dry_run={dry_run})")
    return deleted_total
