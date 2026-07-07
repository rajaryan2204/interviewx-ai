import uuid

from app.services.payment.base import BasePaymentProvider


class PayPalPaymentProvider(BasePaymentProvider):
    """
    PayPal payment service adapter skeleton for future extensions.
    """

    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret

    async def create_payment_order(
        self, amount: float, currency: str = "USD", receipt: str | None = None
    ) -> dict:
        order_id = f"PAYID-{uuid.uuid4().hex[:16].upper()}"
        return {
            "id": order_id,
            "entity": "paypal_order",
            "amount": amount,
            "currency": currency,
            "checkout_url": f"https://www.paypal.com/checkoutnow?token={order_id}",
            "status": "CREATED",
        }

    async def verify_payment(self, payload: dict) -> bool:
        return (
            payload.get("status") == "APPROVED"
            or payload.get("paypal_token") is not None
        )

    async def process_refund(self, transaction_id: str, amount: float) -> dict:
        return {
            "id": f"REF-{uuid.uuid4().hex[:10].upper()}",
            "capture_id": transaction_id,
            "amount": amount,
            "status": "COMPLETED",
        }
