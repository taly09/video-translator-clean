FROM python:3.10-slim

# התקנות בסיסיות + FFmpeg עם libass
RUN apt-get update && \
    apt-get install -y ffmpeg fonts-dejavu-core && \
    apt-get clean

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir -r requirements.txt

CMD ["bash"]
