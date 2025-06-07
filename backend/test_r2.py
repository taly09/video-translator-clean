import os
import boto3
from dotenv import load_dotenv

load_dotenv()

r2 = boto3.client(
    's3',
    aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
    endpoint_url=os.getenv("R2_ENDPOINT_URL")
)

bucket_name = os.getenv("R2_BUCKET_NAME")

try:
    response = r2.list_objects_v2(Bucket=bucket_name)
    print("Objects in bucket:", response.get('Contents', []))
except Exception as e:
    print("Error:", e)
