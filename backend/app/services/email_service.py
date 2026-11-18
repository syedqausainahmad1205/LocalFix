import smtplib
import logging
from email.message import EmailMessage
from typing import Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import ProviderProfile, User
from app.models.communication import EmailNotificationLog

logger = logging.getLogger(__name__)


def _dispatch_email(
    to_email: str,
    subject: str,
    body_text: str
) -> tuple[bool, Optional[str]]:
    """
    Attempt to send an email using configured SMTP settings.
    Never exposes SMTP credentials in logs.
    """
    if not settings.SMTP_HOST:
        # Development / Test mode without active SMTP relay
        logger.info(f"[EMAIL MOCK] Dispatched email to {to_email} with subject '{subject}'.")
        return True, None

    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = to_email
        msg.set_content(body_text)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"Email successfully sent to {to_email} via SMTP host {settings.SMTP_HOST}.")
        return True, None
    except Exception as e:
        # Mask credentials and record error safely
        err_msg = f"SMTP dispatch failed: {str(e)}"
        logger.error(f"Failed to dispatch email to {to_email}: {err_msg}")
        return False, err_msg


def send_provider_approval_email(db: Session, provider: ProviderProfile) -> bool:
    """
    Send an approval notification email to a verified provider.
    Prevents duplicate emails when the same decision is repeatedly submitted.
    """
    user = provider.user or db.query(User).filter(User.id == provider.user_id).first()
    if not user or not user.email:
        logger.warning(f"Cannot send approval email: No user email for provider {provider.id}")
        return False

    # Deduplication check: Avoid sending duplicate approval email if already sent
    existing_sent = (
        db.query(EmailNotificationLog)
        .filter(
            EmailNotificationLog.provider_id == provider.id,
            EmailNotificationLog.email_type == "APPROVAL",
            EmailNotificationLog.status == "SENT"
        )
        .first()
    )
    if existing_sent:
        logger.info(f"Approval email already logged as sent for provider {provider.id}. Skipping duplicate.")
        return True

    subject = "Congratulations! Your LocalFix Provider Application Has Been Approved"
    dashboard_url = f"{settings.FRONTEND_URL}/provider/dashboard"
    body_text = (
        f"Dear {user.full_name},\n\n"
        f"Congratulations! Your LocalFix service provider verification application has been successfully approved.\n\n"
        f"Your profile is now verified, and your services are eligible to appear in LocalFix customer search results "
        f"within a strict 10 km discovery radius of customer locations.\n\n"
        f"You can now manage your catalog, view job requests, and submit quotations via your provider dashboard:\n"
        f"{dashboard_url}\n\n"
        f"Welcome aboard!\n"
        f"The LocalFix Team"
    )

    success, error_detail = _dispatch_email(user.email, subject, body_text)

    log_entry = EmailNotificationLog(
        provider_id=provider.id,
        recipient_email=user.email,
        email_type="APPROVAL",
        subject=subject,
        body_text=body_text,
        status="SENT" if success else "FAILED",
        error_message=error_detail
    )
    db.add(log_entry)
    db.flush()

    return success


def send_provider_rejection_email(
    db: Session,
    provider: ProviderProfile,
    rejection_reason: str
) -> bool:
    """
    Send a rejection notification email with the required explanation and reapplication guidance.
    Prevents duplicate emails when identical decision is processed.
    """
    user = provider.user or db.query(User).filter(User.id == provider.user_id).first()
    if not user or not user.email:
        logger.warning(f"Cannot send rejection email: No user email for provider {provider.id}")
        return False

    # Deduplication check
    existing_sent = (
        db.query(EmailNotificationLog)
        .filter(
            EmailNotificationLog.provider_id == provider.id,
            EmailNotificationLog.email_type == "REJECTION",
            EmailNotificationLog.body_text.like(f"%{rejection_reason[:30]}%"),
            EmailNotificationLog.status == "SENT"
        )
        .first()
    )
    if existing_sent:
        logger.info(f"Rejection email already recorded for provider {provider.id}. Skipping duplicate.")
        return True

    subject = "LocalFix Provider Application Status Update"
    reapply_url = f"{settings.FRONTEND_URL}/provider/verification"
    body_text = (
        f"Dear {user.full_name},\n\n"
        f"Thank you for submitting your application to join LocalFix as a verified service professional.\n\n"
        f"After reviewing your credentials and submitted documentation, the administrative team was unable "
        f"to verify your application at this time.\n\n"
        f"Reason for Decision:\n"
        f"\"{rejection_reason}\"\n\n"
        f"How to Reapply:\n"
        f"You may review the feedback above, rectify the issue, and re-upload valid identity or professional "
        f"documentation by visiting your verification portal:\n"
        f"{reapply_url}\n\n"
        f"If you have questions, please reach out to platform support.\n\n"
        f"Sincerely,\n"
        f"The LocalFix Verification Team"
    )

    success, error_detail = _dispatch_email(user.email, subject, body_text)

    log_entry = EmailNotificationLog(
        provider_id=provider.id,
        recipient_email=user.email,
        email_type="REJECTION",
        subject=subject,
        body_text=body_text,
        status="SENT" if success else "FAILED",
        error_message=error_detail
    )
    db.add(log_entry)
    db.flush()

    return success
