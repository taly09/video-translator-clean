from flask import Blueprint, Response, stream_with_context
import time
import json
from app.services.mongo_service import transcriptions_collection

events_bp = Blueprint("events", __name__)

@events_bp.route("/api/events/<task_id>")
def stream_progress(task_id):
    def event_stream():
        last_data = None
        while True:
            doc = transcriptions_collection.find_one({"task_id": task_id})
            if not doc:
                time.sleep(1)
                continue

            current_data = {
                "status": doc.get("status"),
                "progress": doc.get("progress", 0),
                "error": doc.get("error", ""),
                "r2_urls": doc.get("r2_urls", {}) if doc.get("status") == "completed" else None,
            }

            if current_data != last_data:
                last_data = current_data
                yield f"data: {json.dumps(current_data)}\n\n"

            if doc.get("status") in ["completed", "failed"]:
                break

            time.sleep(1)

    return Response(stream_with_context(event_stream()), mimetype="text/event-stream")
