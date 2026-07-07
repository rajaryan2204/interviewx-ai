from abc import ABC, abstractmethod


class BasePaymentProvider(ABC):
    """
    Abstract interface for integrating third-party payment providers (Razorpay, Stripe, PayPal, etc.).
    """

    @abstractmethod
    async def create_payment_order(
        self, amount: float, currency: str = "INR", receipt: str | None = None
    ) -> dict:
        """
        Create a checkout/charge payment order context.
        """
        pass

    @abstractmethod
    async def verify_payment(self, payload: dict) -> bool:
        """
        Verify payment signature or webhook callbacks.
        """
        pass

    @abstractmethod
    async def process_refund(self, transaction_id: str, amount: float) -> dict:
        """
        Process a partial or full refund for a transaction.
        """
        pass
