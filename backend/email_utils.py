import os
import requests

# טען משתני סביבה
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM = os.getenv("RESEND_FROM", "mytalkscribe@gmail.com")  # ← המייל שלך
ENV = os.getenv("ENV", "local")

# 📌 מייל לבדיקה בלבד
DEV_EMAIL = "mytalkscribe@gmail.com"

def send_email(to: str, subject: str, text: str, html: str = None):
    print("🚀 send_email נקראה!")

    url = "https://api.resend.com/emails"

    # אם בסביבת local – תמיד שלח למייל שלך
    if ENV == "local":
        print(f"🧪 מצב LOCAL – משכתב כתובת ל־{DEV_EMAIL}")
        to = DEV_EMAIL

    print(f"📨 ➡️ מנסה לשלוח מייל ל: {to}")
    print(f"📝 נושא: {subject}")
    print(f"📧 מתוך: {RESEND_FROM}")
    print(f"🔑 מפתח API התחלה: {RESEND_API_KEY[:6]}...")

    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "from": RESEND_FROM,
        "to": [to],
        "subject": subject,
        "text": text,
    }

    if html:
        data["html"] = html

    try:
        response = requests.post(url, headers=headers, json=data)
        print("📤 קוד תגובה מ־Resend:", response.status_code)
        print("📤 גוף תגובה:", response.text)

        if response.status_code != 200:
            print("❌ Email send failed ❌")
        else:
            print(f"✅ Email sent to {to} 🎉")

    except Exception as e:
        print("⚠️ Exception while sending email:", str(e))


def send_welcome_email(to: str, name: str = "משתמש", dashboard_link: str = "http://localhost:5174"):
    subject = "🎉 ברוך הבא ל־MyTalkScribe!"
    text = f"""
    שלום {name},

    תודה שנרשמת ל־MyTalkScribe!

    תוכל להתחיל כאן: {dashboard_link}

    בהצלחה!
    """
    html = f"""
    <div style="font-family: sans-serif; line-height: 1.6">
        <h2>שלום {name} 👋</h2>
        <p>תודה שהצטרפת ל־<strong>MyTalkScribe</strong>!</p>
        <p>התחל להשתמש במערכת דרך הקישור הבא:</p>
        <p><a href="{dashboard_link}" style="background:#6366f1;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;">כניסה לדשבורד</a></p>
        <p style="margin-top:20px;">בהצלחה 🎙️</p>
    </div>
    """

    send_email(to=to, subject=subject, text=text, html=html)
