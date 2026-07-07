from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ===================================================================
# PLANS
# ===================================================================
class PlanBase(BaseModel):
    name: str
    description: str | None = None
    price: float
    currency: str = "INR"
    interval: str = "monthly"
    features: list[str] | None = None
    is_active: bool = True


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    currency: str | None = None
    interval: str | None = None
    features: list[str] | None = None
    is_active: bool | None = None


class PlanResponse(PlanBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===================================================================
# COUPONS
# ===================================================================
class CouponBase(BaseModel):
    code: str
    discount_type: str = "percentage"  # percentage, fixed
    discount_amount: float
    expiry_date: datetime | None = None
    is_active: bool = True


class CouponCreate(CouponBase):
    pass


class CouponResponse(CouponBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CouponValidateRequest(BaseModel):
    code: str
    plan_id: int


# ===================================================================
# SUBSCRIPTIONS
# ===================================================================
class SubscriptionBase(BaseModel):
    plan_id: int
    status: str = "active"
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool = False
    razorpay_subscription_id: str | None = None
    coupon_id: int | None = None


class SubscriptionCreate(SubscriptionBase):
    user_id: int


class SubscriptionResponse(SubscriptionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    plan: PlanResponse | None = None
    coupon: CouponResponse | None = None

    model_config = ConfigDict(from_attributes=True)


# ===================================================================
# PAYMENTS
# ===================================================================
class PaymentBase(BaseModel):
    subscription_id: int | None = None
    amount: float
    currency: str = "INR"
    status: str = "success"
    provider: str = "razorpay"
    transaction_id: str


class PaymentCreate(PaymentBase):
    user_id: int


class PaymentResponse(PaymentBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===================================================================
# INVOICES
# ===================================================================
class InvoiceResponse(BaseModel):
    id: int
    user_id: int
    subscription_id: int
    billing_name: str
    billing_email: str
    amount: float
    currency: str
    status: str
    pdf_url: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===================================================================
# TRANSACTIONS
# ===================================================================
class TransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    type: str
    description: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===================================================================
# CHECKOUT & VERIFICATION SESSIONS
# ===================================================================
class CheckoutSessionRequest(BaseModel):
    plan_id: int
    coupon_code: str | None = None


class CheckoutSessionResponse(BaseModel):
    payment_order_id: str
    amount: float
    currency: str
    checkout_url: str | None = None
    active_provider: str
    is_sandbox: bool = False


class PaymentVerificationRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    plan_id: int
    coupon_code: str | None = None


# ===================================================================
# ADMIN STATS
# ===================================================================
class MonthlyRevenuePoint(BaseModel):
    month: str
    revenue: float


class AdminRevenueStats(BaseModel):
    total_revenue: float
    mrr: float
    active_subscribers: int
    monthly_data: list[MonthlyRevenuePoint]
    active_subscribers_by_plan: dict[str, int]
