import os

from app.core.config import settings
from app.services.payment.base import BasePaymentProvider
from app.services.payment.lemonsqueezy import LemonSqueezyPaymentProvider
from app.services.payment.paypal import PayPalPaymentProvider
from app.services.payment.razorpay import RazorpayPaymentProvider
from app.services.payment.stripe import StripePaymentProvider


class PaymentProviderFactory:
    """
    Factory to retrieve decoupled payment provider instances based on environmental active selection.
    """

    @staticmethod
    def get_provider() -> BasePaymentProvider:
        provider_name = settings.ACTIVE_PAYMENT_PROVIDER.lower()

        if provider_name == "stripe":
            api_key = os.getenv("STRIPE_API_KEY", "sk_test_mockstripe")
            return StripePaymentProvider(api_key=api_key)

        elif provider_name == "paypal":
            client_id = os.getenv("PAYPAL_CLIENT_ID", "mockpaypalclient")
            client_secret = os.getenv("PAYPAL_CLIENT_SECRET", "mockpaypalsecret")
            return PayPalPaymentProvider(
                client_id=client_id, client_secret=client_secret
            )

        elif provider_name == "lemonsqueezy":
            api_key = os.getenv("LEMONSQUEEZY_API_KEY", "mocklemonkey")
            store_id = os.getenv("LEMONSQUEEZY_STORE_ID", "mockstoreid")
            return LemonSqueezyPaymentProvider(api_key=api_key, store_id=store_id)

        else:
            # Default fallback: Razorpay
            return RazorpayPaymentProvider(
                key_id=settings.RAZORPAY_KEY_ID, key_secret=settings.RAZORPAY_KEY_SECRET
            )
