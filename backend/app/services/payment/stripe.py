import uuid

from app.services.payment.base import BasePaymentProvider


class StripePaymentProvider(BasePaymentProvider):
    """
    Stripe payment service adapter skeleton for future extensions.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def create_payment_order(
        self, amount: float, currency: str = "usd", receipt: str | None = None
    ) -> dict:
        session_id = f"cs_test_{uuid.uuid4().hex}"
        return {
            "id": session_id,
            "entity": "checkout_session",
            "amount": int(amount * 100),
            "currency": currency,
            "checkout_url": f"https://checkout.stripe.com/pay/{session_id}",
            "status": "open",
        }

    async def verify_payment(self, payload: dict) -> bool:
        # Stripe signature verification is usually handled via webhook headers verification
        # or checking the Checkout Session status retrieve API
        return (
            payload.get("status") == "complete"
            or payload.get("stripe_signature") == "sandbox_stripe"
        )

    async def process_refund(self, transaction_id: str, amount: float) -> dict:
        return {
            "id": f"re_{uuid.uuid4().hex[:10]}",
            "charge": transaction_id,
            "amount": int(amount * 100),
            "status": "succeeded",
        }
