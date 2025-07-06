from backend.old.r2_client import upload_file_to_r2

task_id = "0631189c-4a7a-4bbb-b5e2-060376e63901"
pdf_path = f"results/20250630_010940_{task_id}.pdf"
r2_key = f"{task_id}/20250630_010940_{task_id}.pdf"

success = upload_file_to_r2(pdf_path, r2_key)
print(f"📤 upload_file_to_r2 success: {success}")
