import uuid

from app.services.payment.base import BasePaymentProvider


class LemonSqueezyPaymentProvider(BasePaymentProvider):
    """
    LemonSqueezy payment service adapter skeleton for future extensions.
    """

    def __init__(self, api_key: str, store_id: str):
        self.api_key = api_key
        self.store_id = store_id

    async def create_payment_order(
        self, amount: float, currency: str = "USD", receipt: str | None = None
    ) -> dict:
        checkout_id = f"sdk_{uuid.uuid4().hex[:12]}"
        return {
            "id": checkout_id,
            "entity": "lemonsqueezy_checkout",
            "amount": amount,
            "currency": currency,
            "checkout_url": f"https://interviewx.lemonsqueezy.com/checkout/buy/{checkout_id}",
            "status": "pending",
        }

    async def verify_payment(self, payload: dict) -> bool:
        return (
            payload.get("event_name") == "order_created"
            or payload.get("lemonsqueezy_signature") is not None
        )

    async def process_refund(self, transaction_id: str, amount: float) -> dict:
        return {
            "id": f"ref_{uuid.uuid4().hex[:12]}",
            "order_id": transaction_id,
            "amount": amount,
            "status": "refunded",
        }
