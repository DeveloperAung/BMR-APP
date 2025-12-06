import json
import logging
import requests
from django.conf import settings


logger = logging.getLogger(__name__)


def send_payment_notification(user, payment):
    """
    Send a OneSignal push notification when a payment is completed.
    Uses external user id (user.id) if available; otherwise broadcasts.
    """
    app_id = getattr(settings, "ONESIGNAL_APP_ID", "")
    api_key = getattr(settings, "ONESIGNAL_API_KEY", "")

    if not app_id or not api_key:
        logger.info("OneSignal not configured; skipping push notification.")
        return

    headers = {
        "Authorization": f"Basic {api_key}",
        "Content-Type": "application/json",
    }

    data = {
        "app_id": app_id,
        "headings": {"en": "Payment received"},
        "contents": {"en": "Your membership payment was received. View your membership details."},
        "data": {
            "type": "payment",
            "status": getattr(payment, "status", ""),
            "payment_id": str(getattr(payment, "uuid", "")),
            "external_id": getattr(payment, "external_id", ""),
        },
        # Fallback broadcast if user is missing
        "included_segments": ["Subscribed Users"],
    }

    if user and getattr(user, "id", None):
        data["include_external_user_ids"] = [str(user.id)]
        data.pop("included_segments", None)

    try:
        resp = requests.post("https://api.onesignal.com/notifications", headers=headers, data=json.dumps(data))
        resp.raise_for_status()
    except Exception as exc:
        logger.warning("Failed to send OneSignal notification: %s", exc)
        return

    logger.info("OneSignal notification sent for payment %s", getattr(payment, "uuid", None))
