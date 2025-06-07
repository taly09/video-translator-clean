// src/components/transcription/TranscriptionConverter.js

export function srtToText(srt) {
  return srt
    .replace(/\d+\n/g, "") // Remove subtitle numbering
    .replace(/\d{2}:\d{2}:\d{2},\d{3} --> .*?\n/g, "") // Remove timestamps
    .replace(/\n{2,}/g, "\n") // Reduce multiple line breaks
    .trim();
}
