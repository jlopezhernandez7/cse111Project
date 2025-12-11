# backend/email_utils.py

import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM")
EMAIL_REPLY_TO = os.getenv("EMAIL_REPLY_TO")


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send an HTML email using SendGrid.
    Returns True on success, False on failure.
    """
    if not SENDGRID_API_KEY or not EMAIL_FROM:
        print("Email disabled: SENDGRID_API_KEY or EMAIL_FROM not set.")
        return False

    message = Mail(
        from_email=Email(EMAIL_FROM),
        to_emails=to_email,
        subject=subject,
        html_content=html_body,
    )

    if EMAIL_REPLY_TO:
        message.reply_to = Email(EMAIL_REPLY_TO)

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print("SendGrid status:", response.status_code)
        return 200 <= response.status_code < 300
    except Exception as e:
        print("SendGrid error:", e)
        return False
