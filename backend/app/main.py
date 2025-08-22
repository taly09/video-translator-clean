# app/main.py
import os, logging
from app import create_app
logging.basicConfig(level=logging.INFO)
app = create_app()
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8765, debug=os.getenv("FLASK_ENV")!="production", use_reloader=False)
