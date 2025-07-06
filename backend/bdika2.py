from flask import Blueprint, request, make_response
import boto3
from botocore.client import Config
import requests
import os

router = Blueprint('proxy', __name__)

R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_ENDPOINT_URL = os.getenv("R2_ENDPOINT_URL")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")


def generate_presigned_url(key):
    s3_client = boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4')
    )
    url = s3_client.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": R2_BUCKET_NAME, "Key": key},
        ExpiresIn=3600,
    )
    return url


@router.route("/api/proxy/results/<task_id>/<filetype>", methods=["GET"])
def proxy_result_file(task_id, filetype):
    # כאן תבצע שאילתא למונגו לקבלת הנתונים כולל ה-key של הקובץ
    # למשל:
    doc = get_transcription_from_db(task_id)  # כתוב את הפונקציה שלך שמחזירה את המסמך
    if not doc:
        return {"error": "Task not found"}, 404

    # נניח ש-key נמצא כך:
    key = doc.get("r2_files", {}).get(filetype, {}).get("key")
    if not key:
        # fallback - אולי תבדוק ב-r2_urls ותוציא את ה-key מה-URL
        url = doc.get("r2_urls", {}).get(filetype)
        if not url:
            return {"error": "File not found"}, 404
        key = url.split(".com/")[1]

    presigned_url = generate_presigned_url(key)

    resp = requests.get(presigned_url, stream=True)
    if resp.status_code != 200:
        return {"error": "Failed to fetch file"}, resp.status_code

    response = make_response(resp.content)
    response.headers['Content-Type'] = resp.headers.get('Content-Type', 'application/octet-stream')
    origin = request.headers.get('Origin')
    if origin:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    else:
        response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'

    return response
