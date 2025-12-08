import requests
from django.conf import settings

class HitPayClient:
    def __init__(self):
        self.api_key = settings.HITPAY_API_KEY
        self.base_url = settings.HITPAY_API_URL
        self.headers = {
            "X-BUSINESS-API-KEY": self.api_key,
            "Content-Type": "application/json",
        }

    def create_charge(self, amount, currency="sgd", **kwargs):
        url = f"{self.base_url}/charges"
        data = {
            "amount": amount,
            "currency": currency,
            # include other required fields per the docs...
            **kwargs
        }
        resp = requests.post(url, json=data, headers=self.headers)
        resp.raise_for_status()
        return resp.json()

    def get_webhook_event(self, event_id):
        url = f"{self.base_url}/webhook-events/{event_id}"
        resp = requests.get(url, headers=self.headers)
        resp.raise_for_status()
        return resp.json()

    def get_payment_request(self, payment_id: str):
        """
        Fetch a payment request status by its HitPay ID.
        """
        url = f"{self.base_url}/payment-requests/{payment_id}"
        resp = requests.get(url, headers=self.headers)
        resp.raise_for_status()
        return resp.json()

    def create_payment_request(self,
                               amount,
                               currency,
                               payment_methods,
                               generate_qr=True,
                               name=None,
                               email=None,
                               phone=None,
                               purpose=None,
                               reference_number=None,
                               redirect_url=None,
                               webhook_url=None,
                               allow_repeated_payments=False,
                               expiry_date=None):
        """
        Create a payment request with HitPay.
        """

        url = f"{self.base_url}/payment-requests"

        body = {
            "amount": amount,
            "currency": currency,
            "payment_methods": payment_methods,
            "generate_qr": "true",
        }
        # print("body", body)
        if generate_qr:
            body["generate_qr"] = True
        if name:
            body["name"] = name
        if email:
            body["email"] = email
        if phone:
            body["phone"] = phone
        if purpose:
            body["purpose"] = purpose
        if reference_number:
            body["reference_number"] = reference_number
        if redirect_url:
            body["redirect_url"] = redirect_url
        if webhook_url:
            body["webhook"] = webhook_url
        if allow_repeated_payments:
            body["allow_repeated_payments"] = True
        if expiry_date:
            body["expiry_date"] = expiry_date

        resp = requests.post(url, json=body, headers=self.headers)
        # print("resp", resp)
        resp.raise_for_status()

        return resp.json()
