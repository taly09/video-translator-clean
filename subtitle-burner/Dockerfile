FROM python:3.10-slim

# התקנת ffmpeg ותלויות בסיסיות
RUN apt-get update && apt-get install -y \
    ffmpeg \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# יצירת תיקיה לאחסון הפונטים
COPY fonts /usr/share/fonts/truetype/custom
COPY fonts.conf /etc/fonts/fonts.conf

# התקנת ספריות פייתון
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# העתקת הקוד
COPY main.py .

# פקודת ברירת מחדל
CMD ["python", "main.py"]
