import requests
import os
import logging

logger = logging.getLogger(__name__)

def send_welcome_email(to, name="משתמש", dashboard_link="https://example.com"):
    api_key = os.getenv("RESEND_API_KEY")
    from_email = os.getenv("RESEND_FROM", "noreply@example.com")

    if not api_key:
        logger.warning(f"RESEND_API_KEY not set, skipping email to {to}")
        return False

    html_content = f"""
        <p>שלום {name},</p>
        <p>תודה שנרשמת ל-TalkScribe! הנה הקישור לדאשבורד שלך:</p>
        <p><a href="{dashboard_link}">{dashboard_link}</a></p>
        <p>בהצלחה!</p>
    """

    data = {
        "from": from_email,
        "to": [to],
        "subject": "ברוך הבא ל-TalkScribe",
        "html": html_content
    }

    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {api_key}"},
            json=data,
            timeout=10
        )
    except requests.RequestException as e:
        logger.error(f"Request to Resend failed: {e}")
        return False

    if response.status_code in (200, 202):
        logger.info(f"Welcome email sent to {to}")
        return True
    else:
        logger.error(f"Failed to send email to {to}: {response.status_code} {response.text}")
        return False
