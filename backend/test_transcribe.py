import os
from app.services.transcription_service import HebrewTranscriber, build_config, generate_file_paths


def test_transcribe():
    video_path = r"C:\Users\X\Downloads\יאיר לפיד חדש.mp4"  # שנה לנתיב הוידאו שלך

    input_path, output_base, task_id = generate_file_paths(os.path.basename(video_path))

    # העתק את הוידאו לתיקיית uploads כדי להתאים לקונפיג
    os.makedirs("uploads", exist_ok=True)
    os.system(f'copy "{video_path}" "{input_path}"')

    config = build_config(input_path, output_base, language="auto", translate_to=None)
    transcriber = HebrewTranscriber(config)

    result = transcriber.transcribe_and_process(input_path, user_id="test@example.com")
    print(result)

    assert "status" in result
    assert result["status"] in ["completed", "denied", "failed"]


if __name__ == "__main__":
    test_transcribe()
