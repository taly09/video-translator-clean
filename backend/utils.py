import logging
import openai
from deep_translator import GoogleTranslator

def translate_segments(segments, target_language="he"):
    logging.info(f"🌍 מנסה תרגום עם GPT לשפה: {target_language}")
    try:
        full_text = "\n".join([seg['text'] for seg in segments])
        prompt = f"Translate the following transcript to {target_language}:\n\n{full_text}"

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a professional translator."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=3000
        )

        translated_text = response.choices[0].message.content.strip()
        lines = translated_text.split("\n")
        for i, line in enumerate(lines):
            if i < len(segments):
                segments[i]['text'] = line
        logging.info("✅ תרגום בוצע עם GPT")
        return segments

    except Exception as e:
        logging.warning(f"⚠️ שגיאה בתרגום עם GPT: {e} → עובר ל־Google Translate")
        return translate_with_google(segments, target_language)


def translate_with_google(segments, target_language="he"):
    try:
        for seg in segments:
            translated = GoogleTranslator(source='auto', target=target_language).translate(seg['text'])
            seg['text'] = translated
        logging.info("✅ תרגום בוצע עם Google Translate")
        return segments
    except Exception as e:
        logging.error(f"❌ שגיאה בתרגום עם Google Translate: {e}")
        return segments
