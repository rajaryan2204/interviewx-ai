import os
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy import func, select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.deps import get_current_user, get_db, require_roles
from app.models.monetization import (
    Coupon,
    Invoice,
    Payment,
    Plan,
    Subscription,
    Transaction,
)
from app.models.user import User
from app.schemas.monetization import (
    AdminRevenueStats,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    CouponCreate,
    CouponResponse,
    CouponValidateRequest,
    InvoiceResponse,
    MonthlyRevenuePoint,
    PaymentVerificationRequest,
    PlanCreate,
    PlanResponse,
    PlanUpdate,
    SubscriptionResponse,
)
from app.services.payment.factory import PaymentProviderFactory

router = APIRouter()


# ===================================================================
# GOOGLE SHEETS AUTOMATION WEBHOOK
# ===================================================================
import json
import threading
import urllib.request

def trigger_google_sheet_webhook_sync(name: str, email: str, plan_name: str, transaction_id: str):
    webhook_url = os.getenv("GOOGLE_SHEET_WEBHOOK_URL")
    payload = {
        "name": name,
        "email": email,
        "plan_name": plan_name,
        "transaction_id": transaction_id,
        "timestamp": datetime.utcnow().isoformat()
    }
    print(f"[GOOGLE_SHEETS_AUTOMATION] Syncing transaction {transaction_id} to sheet...")
    print(f"Payload: {json.dumps(payload)}")
    
    if webhook_url:
        try:
            req = urllib.request.Request(
                webhook_url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=5.0) as response:
                print(f"[GOOGLE_SHEETS_AUTOMATION] Success response code: {response.status}")
        except Exception as e:
            print(f"[GOOGLE_SHEETS_AUTOMATION] Error calling webhook: {e}")

def trigger_google_sheet_webhook(name: str, email: str, plan_name: str, transaction_id: str):
    # Run in a background thread to prevent blocking payment flow execution
    t = threading.Thread(
        target=trigger_google_sheet_webhook_sync,
        args=(name, email, plan_name, transaction_id)
    )
    t.start()


# ===================================================================
# SEED PLANS UTILITY
# ===================================================================
async def seed_default_plans_if_empty(db: AsyncSession) -> None:
    """
    On-the-fly plans seeding for clean local testing.
    """
    # 1. Ensure Free plan exists
    free_stmt = select(Plan).where(Plan.name == "Free")
    free_res = await db.execute(free_stmt)
    free_plan = free_res.scalar_one_or_none()
    if not free_plan:
        free_plan = Plan(
            name="Free",
            description="Limited interview trial sandbox",
            price=0.00,
            currency="INR",
            interval="monthly",
            features=[
                "3 mock interviews/month",
                "Limited coding sessions",
                "Basic analysis",
            ],
            is_active=True,
        )
        db.add(free_plan)
    else:
        free_plan.price = 0.00
        free_plan.interval = "monthly"

    # 2. Ensure Basic plan exists (₹50/month)
    basic_stmt = select(Plan).where(Plan.name == "Basic")
    basic_res = await db.execute(basic_stmt)
    basic_plan = basic_res.scalar_one_or_none()
    if not basic_plan:
        basic_plan = Plan(
            name="Basic",
            description="Essential practice tier",
            price=99.00,
            currency="INR",
            interval="monthly",
            features=[
                "Unlimited AI Mock Interviews",
                "Resume Analyzer",
                "AI Feedback",
                "Interview History",
                "Progress Tracking",
            ],
            is_active=True,
        )
        db.add(basic_plan)
    else:
        basic_plan.price = 99.00
        basic_plan.interval = "monthly"

    # 3. Ensure Pro plan exists (₹100/month)
    pro_stmt = select(Plan).where(Plan.name == "Pro")
    pro_res = await db.execute(pro_stmt)
    pro_plan = pro_res.scalar_one_or_none()
    if not pro_plan:
        pro_plan = Plan(
            name="Pro",
            description="Unlimited features prep tier for candidates",
            price=199.00,
            currency="INR",
            interval="monthly",
            features=[
                "Everything in Basic",
                "Voice Interview",
                "Coding Interview",
                "Premium Analytics",
                "Priority AI Responses",
                "Unlimited Reports",
            ],
            is_active=True,
        )
        db.add(pro_plan)
    else:
        pro_plan.price = 199.00
        pro_plan.interval = "monthly"
        pro_plan.features = [
            "Everything in Basic",
            "Voice Interview",
            "Coding Interview",
            "Premium Analytics",
            "Priority AI Responses",
            "Unlimited Reports",
        ]

    # 4. Ensure Annual Pro plan exists (₹200/year). 
    # If Enterprise plan exists, rename it to Annual Pro to avoid database duplication and constraints.
    annual_stmt = select(Plan).where(Plan.name == "Annual Pro")
    annual_res = await db.execute(annual_stmt)
    annual_plan = annual_res.scalar_one_or_none()
    if not annual_plan:
        ent_stmt = select(Plan).where(Plan.name == "Enterprise")
        ent_res = await db.execute(ent_stmt)
        ent_plan = ent_res.scalar_one_or_none()
        if ent_plan:
            ent_plan.name = "Annual Pro"
            ent_plan.description = "Yearly prep with best value"
            ent_plan.price = 299.00
            ent_plan.interval = "yearly"
            ent_plan.features = [
                "Everything in Pro",
                "Best Value Badge",
                "Highest Priority Support",
            ]
        else:
            annual_plan = Plan(
                name="Annual Pro",
                description="Yearly prep with best value",
                price=299.00,
                currency="INR",
                interval="yearly",
                features=[
                    "Everything in Pro",
                    "Best Value Badge",
                    "Highest Priority Support",
                ],
                is_active=True,
            )
            db.add(annual_plan)
    else:
        annual_plan.price = 299.00
        annual_plan.interval = "yearly"
        annual_plan.features = [
            "Everything in Pro",
            "Best Value Badge",
            "Highest Priority Support",
        ]

    # 5. Seed Coupons
    launch_stmt = select(Coupon).where(Coupon.code == "LAUNCH95")
    launch_res = await db.execute(launch_stmt)
    launch_coupon = launch_res.scalar_one_or_none()
    if not launch_coupon:
        launch_coupon = Coupon(
            code="LAUNCH95",
            discount_type="percentage",
            discount_amount=95.00,
            expiry_date=None,
            is_active=True,
        )
        db.add(launch_coupon)

    # Delete all other coupons to keep only LAUNCH95
    delete_others_stmt = delete(Coupon).where(Coupon.code != "LAUNCH95")
    await db.execute(delete_others_stmt)
    await db.commit()


# ===================================================================
# PUBLIC PLANS ENDPOINTS
# ===================================================================
@router.get("/plans", response_model=list[PlanResponse])
async def list_active_plans(db: AsyncSession = Depends(get_db)):
    """
    Get all active subscription plans.
    """
    await seed_default_plans_if_empty(db)
    stmt = select(Plan).where(Plan.is_active.is_(True))
    res = await db.execute(stmt)
    return list(res.scalars().all())


# ===================================================================
# CHECKOUT & SIGNATURE VERIFICATIONS
# ===================================================================
@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    payload: CheckoutSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate checkout transaction order parameters for payment integration.
    """
    stmt = select(Plan).where(Plan.id == payload.plan_id, Plan.is_active.is_(True))
    res = await db.execute(stmt)
    plan = res.scalar_one_or_none()
    if not plan:
        raise HTTPException(
            status_code=404, detail="Selected plan is inactive or not found."
        )

    original_price = float(plan.price)
    discounted_price = original_price
    coupon_id = None
    coupon = None

    # Validate coupon if supplied
    if payload.coupon_code:
        coupon_stmt = select(Coupon).where(
            Coupon.code == payload.coupon_code, Coupon.is_active.is_(True)
        )
        coupon_res = await db.execute(coupon_stmt)
        coupon = coupon_res.scalar_one_or_none()
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coupon invalid or inactive.",
            )

        coupon_id = coupon.id
        if coupon.discount_type == "percentage":
            discounted_price = original_price * (
                1.0 - (float(coupon.discount_amount) / 100.0)
            )
        else:
            discounted_price = max(0.0, original_price - float(coupon.discount_amount))

        # Check if the user has already subscribed using this coupon (if it is WELCOME100)
        if coupon.code == "WELCOME100":
            usage_stmt = select(Subscription).where(
                Subscription.user_id == current_user.id,
                Subscription.coupon_id == coupon.id
            )
            usage_res = await db.execute(usage_stmt)
            already_used = usage_res.scalars().first()
            if already_used:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This coupon code can only be used once per user.",
                )

    # 100% Coupon Bypass
    if discounted_price <= 0.0:
        import uuid
        free_order_id = f"free_upgrade_{uuid.uuid4().hex[:12]}"
        
        # Cancel previous active subscriptions
        cancel_stmt = select(Subscription).where(
            Subscription.user_id == current_user.id, Subscription.status == "active"
        )
        cancel_res = await db.execute(cancel_stmt)
        existing_subs = cancel_res.scalars().all()
        for sub in existing_subs:
            sub.status = "cancelled"
            sub.cancel_at_period_end = True

        # Build and add new subscription
        period_start = datetime.utcnow()
        period_end = period_start + timedelta(days=365 if plan.interval == "yearly" else 30)
        new_sub = Subscription(
            user_id=current_user.id,
            plan_id=plan.id,
            status="active",
            current_period_start=period_start,
            current_period_end=period_end,
            cancel_at_period_end=False,
            razorpay_subscription_id=free_order_id,
            coupon_id=coupon_id,
        )
        db.add(new_sub)
        await db.flush()  # Populate new_sub.id

        # Add Payment log with 0.0 amount and coupon provider
        new_payment = Payment(
            user_id=current_user.id,
            subscription_id=new_sub.id,
            amount=0.0,
            currency=plan.currency,
            status="success",
            provider="coupon",
            transaction_id=f"free_payment_{uuid.uuid4().hex[:12]}",
        )
        db.add(new_payment)

        # Add Invoice log receipt
        new_invoice = Invoice(
            user_id=current_user.id,
            subscription_id=new_sub.id,
            billing_name=current_user.full_name or "Candidate Account",
            billing_email=current_user.email,
            amount=0.0,
            currency=plan.currency,
            status="paid",
            pdf_url="",
        )
        db.add(new_invoice)
        await db.flush()
        new_invoice.pdf_url = f"/api/monetization/invoices/{new_invoice.id}/download"

        # Log transactional debit history
        new_trans = Transaction(
            user_id=current_user.id,
            amount=0.0,
            type="debit",
            description=f"Purchase plan subscription: {plan.name} (100% discount coupon applied)",
        )
        db.add(new_trans)

        # Trigger Google Sheet Automation Webhook
        trigger_google_sheet_webhook(
            name=current_user.full_name or "Candidate Account",
            email=current_user.email,
            plan_name=plan.name,
            transaction_id=new_payment.transaction_id
        )

        await db.commit()

        return CheckoutSessionResponse(
            payment_order_id=free_order_id,
            amount=0.0,
            currency=plan.currency,
            checkout_url=None,
            active_provider="coupon",
            is_sandbox=False,
        )

    # Trigger Payment Provider Adapter for standard payments
    provider = PaymentProviderFactory.get_provider()
    order_data = await provider.create_payment_order(
        amount=discounted_price,
        currency=plan.currency,
        receipt=f"usr_{current_user.id}_pl_{plan.id}",
    )

    return CheckoutSessionResponse(
        payment_order_id=order_data["id"],
        amount=discounted_price,
        currency=plan.currency,
        checkout_url=order_data.get("checkout_url"),
        active_provider=os.getenv("ACTIVE_PAYMENT_PROVIDER", "razorpay"),
        is_sandbox=order_data.get("is_mock", False),
    )


@router.post("/verify")
async def verify_checkout_payment(
    payload: PaymentVerificationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verify payment signature and provision candidate subscription.
    """
    provider = PaymentProviderFactory.get_provider()
    is_valid = await provider.verify_payment(
        {
            "razorpay_payment_id": payload.razorpay_payment_id,
            "razorpay_order_id": payload.razorpay_order_id,
            "razorpay_signature": payload.razorpay_signature,
        }
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction verification failed. Signature mismatch.",
        )

    # Fetch targeted plan
    plan_stmt = select(Plan).where(Plan.id == payload.plan_id)
    plan_res = await db.execute(plan_stmt)
    plan = plan_res.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan metadata not found.")

    original_price = float(plan.price)
    discounted_price = original_price
    coupon_id = None

    if payload.coupon_code:
        coupon_stmt = select(Coupon).where(Coupon.code == payload.coupon_code)
        coupon_res = await db.execute(coupon_stmt)
        coupon = coupon_res.scalar_one_or_none()
        if coupon:
            coupon_id = coupon.id
            if coupon.discount_type == "percentage":
                discounted_price = original_price * (
                    1.0 - (float(coupon.discount_amount) / 100.0)
                )
            else:
                discounted_price = max(
                    0.0, original_price - float(coupon.discount_amount)
                )

    # Cancel previous subscriptions of this user if any exists
    cancel_stmt = select(Subscription).where(
        Subscription.user_id == current_user.id, Subscription.status == "active"
    )
    cancel_res = await db.execute(cancel_stmt)
    existing_subs = cancel_res.scalars().all()
    for sub in existing_subs:
        sub.status = "cancelled"
        sub.cancel_at_period_end = True

    # Build new subscription entry
    period_start = datetime.utcnow()
    period_end = period_start + timedelta(days=365 if plan.interval == "yearly" else 30)
    new_sub = Subscription(
        user_id=current_user.id,
        plan_id=plan.id,
        status="active",
        current_period_start=period_start,
        current_period_end=period_end,
        cancel_at_period_end=False,
        razorpay_subscription_id=payload.razorpay_order_id,
        coupon_id=coupon_id,
    )
    db.add(new_sub)
    await db.flush()  # populate new_sub.id

    # Create Payment entry
    new_payment = Payment(
        user_id=current_user.id,
        subscription_id=new_sub.id,
        amount=discounted_price,
        currency=plan.currency,
        status="success",
        provider="razorpay",
        transaction_id=payload.razorpay_payment_id,
    )
    db.add(new_payment)

    # Create Invoice log receipt
    new_invoice = Invoice(
        user_id=current_user.id,
        subscription_id=new_sub.id,
        billing_name=current_user.full_name or "Candidate Account",
        billing_email=current_user.email,
        amount=discounted_price,
        currency=plan.currency,
        status="paid",
        pdf_url="",
    )
    db.add(new_invoice)
    await db.flush()
    new_invoice.pdf_url = f"/api/monetization/invoices/{new_invoice.id}/download"

    # Record transactional credit/debit history log
    new_trans = Transaction(
        user_id=current_user.id,
        amount=discounted_price,
        type="debit",
        description=f"Purchase plan subscription: {plan.name}",
    )
    db.add(new_trans)

    # Trigger Google Sheet Automation Webhook
    trigger_google_sheet_webhook(
        name=current_user.full_name or "Candidate Account",
        email=current_user.email,
        plan_name=plan.name,
        transaction_id=new_payment.transaction_id
    )

    await db.commit()
    return {
        "detail": "Subscription successfully provisioned.",
        "subscription_id": new_sub.id,
    }


# ===================================================================
# CANDIDATE SUBSCRIPTIONS DETAILS
# ===================================================================
@router.get("/subscriptions/current", response_model=SubscriptionResponse)
async def get_current_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get user active subscription status, default to Free if none configured.
    """
    await seed_default_plans_if_empty(db)
    stmt = (
        select(Subscription)
        .options(joinedload(Subscription.plan), joinedload(Subscription.coupon))
        .where(Subscription.user_id == current_user.id, Subscription.status == "active")
        .order_by(Subscription.id.desc())
    )
    res = await db.execute(stmt)
    sub = res.scalar_one_or_none()
    if sub:
        return sub

    # Find the Free plan
    free_stmt = select(Plan).where(Plan.name == "Free")
    free_res = await db.execute(free_stmt)
    free_plan = free_res.scalar_one()

    # Create a simulated default subscription object on-the-fly (without writing to DB)
    return Subscription(
        id=0,
        user_id=current_user.id,
        plan_id=free_plan.id,
        status="active",
        current_period_start=datetime.utcnow(),
        current_period_end=datetime.utcnow() + timedelta(days=30),
        cancel_at_period_end=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        plan=free_plan,
    )


@router.post("/subscriptions/cancel")
async def cancel_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Terminate subscription renewals at the end of the current billing cycle.
    """
    stmt = select(Subscription).where(
        Subscription.user_id == current_user.id, Subscription.status == "active"
    )
    res = await db.execute(stmt)
    sub = res.scalar_one_or_none()
    if not sub:
        raise HTTPException(
            status_code=404, detail="No active paid subscription found to cancel."
        )

    sub.cancel_at_period_end = True
    await db.commit()
    return {"detail": "Subscription successfully scheduled for cancellation."}


# ===================================================================
# COUPONS VALIDATIONS
# ===================================================================
@router.post("/coupons/validate")
async def validate_coupon(
    payload: CouponValidateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Check coupon eligibility and return discount adjustments.
    """
    coupon_stmt = select(Coupon).where(
        Coupon.code == payload.code, Coupon.is_active.is_(True)
    )
    coupon_res = await db.execute(coupon_stmt)
    coupon = coupon_res.scalar_one_or_none()
    if not coupon:
        raise HTTPException(
            status_code=404, detail="Coupon invalid, expired, or inactive."
        )

    expiry = coupon.expiry_date
    if expiry is not None and expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This coupon code has expired.")

    plan_stmt = select(Plan).where(Plan.id == payload.plan_id)
    plan_res = await db.execute(plan_stmt)
    plan = plan_res.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan target not found.")

    original_price = float(plan.price)
    if coupon.discount_type == "percentage":
        discount = original_price * (float(coupon.discount_amount) / 100.0)
    else:
        discount = float(coupon.discount_amount)

    final_price = max(0.0, original_price - discount)

    return {
        "valid": True,
        "discount_amount": discount,
        "final_price": final_price,
        "discount_type": coupon.discount_type,
        "currency": plan.currency,
    }


# ===================================================================
# BILLING HISTORY
# ===================================================================
@router.get("/invoices", response_model=list[InvoiceResponse])
async def list_user_invoices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List billing statement records of the user.
    """
    stmt = (
        select(Invoice)
        .where(Invoice.user_id == current_user.id)
        .order_by(Invoice.created_at.desc())
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/invoices/{invoice_id}/download")
async def download_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Download a formatted HTML invoice receipt for the transaction.
    """
    stmt = select(Invoice).options(joinedload(Invoice.subscription)).where(Invoice.id == invoice_id)
    res = await db.execute(stmt)
    invoice = res.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice record not found.")

    # Render a beautiful, highly professional HTML invoice page
    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice Ref: #INV-{invoice.id}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #fafafa;
            color: #1f2937;
            padding: 40px;
            margin: 0;
        }}
        .invoice-card {{
            max-width: 650px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #f3f4f6;
            padding-bottom: 24px;
            margin-bottom: 24px;
        }}
        .logo {{
            font-weight: 800;
            font-size: 20px;
            color: #7c3aed;
        }}
        .title {{
            font-size: 14px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            text-align: right;
        }}
        .meta-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 32px;
            font-size: 13px;
        }}
        .meta-item label {{
            color: #9ca3af;
            display: block;
            margin-bottom: 4px;
            text-transform: uppercase;
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 0.05em;
        }}
        .meta-item .value {{
            font-weight: 600;
        }}
        .items-table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 32px;
            font-size: 13px;
        }}
        .items-table th {{
            border-bottom: 1px solid #e5e7eb;
            padding: 10px 0;
            color: #9ca3af;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 10px;
        }}
        .items-table td {{
            padding: 14px 0;
            border-bottom: 1px solid #f3f4f6;
        }}
        .total-box {{
            display: flex;
            justify-content: flex-end;
            font-size: 16px;
            font-weight: bold;
            margin-top: 16px;
        }}
        .footer {{
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
            margin-top: 40px;
            border-top: 1px solid #f3f4f6;
            padding-top: 20px;
        }}
    </style>
</head>
<body>
    <div class="invoice-card">
        <div class="header">
            <div class="logo">InterviewX AI</div>
            <div class="title">
                Invoice Log<br>
                <span style="font-family: monospace; font-size: 12px; color: #1f2937;">#INV-{invoice.id}</span>
            </div>
        </div>

        <div class="meta-grid">
            <div class="meta-item">
                <label>Billed To</label>
                <span class="value" style="font-size: 14px; font-weight: bold;">{invoice.billing_name}</span><br>
                <span style="color: #6b7280;">{invoice.billing_email}</span>
            </div>
            <div class="meta-item" style="text-align: right;">
                <label>Billing Date</label>
                <span class="value">{invoice.created_at.strftime("%B %d, %Y")}</span>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="text-align: left;">Plan Description</th>
                    <th style="text-align: right;">Total Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="font-weight: 600;">
                        InterviewX AI Simulation Plan Subscription
                    </td>
                    <td style="text-align: right; font-family: monospace; font-weight: bold;">
                        {invoice.currency} {float(invoice.amount):,.2f}
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="total-box">
            <span style="margin-right: 16px; color: #6b7280; font-weight: normal;">Amount Paid:</span>
            <span style="color: #7c3aed; font-family: monospace;">{invoice.currency} {float(invoice.amount):,.2f}</span>
        </div>

        <div class="footer">
            Thank you for preparing with InterviewX AI. If you have any billing questions, contact support@interviewx.ai.
        </div>
    </div>
</body>
</html>
"""
    headers = {
        "Content-Disposition": f'attachment; filename="invoice_{invoice.id}.html"'
    }
    return HTMLResponse(content=html_content, status_code=200, headers=headers)


# ===================================================================
# ADMINISTRATIVE MANAGEMENT ROUTER
# ===================================================================
@router.post("/admin/plans", response_model=PlanResponse)
async def admin_create_plan(
    payload: PlanCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_roles("admin")),
):
    """
    Admin command to configure a billing tier.
    """
    new_plan = Plan(
        name=payload.name,
        description=payload.description,
        price=payload.price,
        currency=payload.currency,
        interval=payload.interval,
        features=payload.features,
        is_active=payload.is_active,
    )
    db.add(new_plan)
    await db.commit()
    await db.refresh(new_plan)
    return new_plan


@router.patch("/admin/plans/{plan_id}", response_model=PlanResponse)
async def admin_update_plan(
    plan_id: int,
    payload: PlanUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_roles("admin")),
):
    """
    Admin command to edit a plan structure or disable it.
    """
    stmt = select(Plan).where(Plan.id == plan_id)
    res = await db.execute(stmt)
    plan = res.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan target not found.")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(plan, k, v)

    await db.commit()
    await db.refresh(plan)
    return plan


@router.get("/admin/revenue", response_model=AdminRevenueStats)
async def admin_get_revenue_analytics(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_roles("admin")),
):
    """
    Admin dashboard statistics mapping revenue aggregates.
    """
    # 1. Total Successful Payments Sum
    pay_sum_stmt = select(func.sum(Payment.amount)).where(Payment.status == "success")
    pay_sum_res = await db.execute(pay_sum_stmt)
    total_rev = float(pay_sum_res.scalar() or 0.0)

    # 2. Count Active Subscribers
    sub_count_stmt = select(func.count(Subscription.id)).where(
        Subscription.status == "active"
    )
    sub_count_res = await db.execute(sub_count_stmt)
    active_subs_count = int(sub_count_res.scalar() or 0)

    # 3. Monthly breakdown (mocked for visualization representation or fetched from payments db)
    # We will generate a rolling list of last 3 months
    monthly_data = [
        MonthlyRevenuePoint(month="May", revenue=max(0.0, total_rev * 0.3)),
        MonthlyRevenuePoint(month="June", revenue=max(0.0, total_rev * 0.7)),
        MonthlyRevenuePoint(month="July", revenue=total_rev),
    ]

    # 4. Count Subscribers by Plan name
    plan_counts: dict[str, int] = {}
    plans_stmt = select(Plan)
    plans_res = await db.execute(plans_stmt)
    all_plans = plans_res.scalars().all()
    for p in all_plans:
        c_stmt = select(func.count(Subscription.id)).where(
            Subscription.plan_id == p.id, Subscription.status == "active"
        )
        c_res = await db.execute(c_stmt)
        plan_counts[p.name] = int(c_res.scalar() or 0)

    # Calculate MRR (based on active subscription prices)
    mrr_val = 0.0
    for p in all_plans:
        count = plan_counts.get(p.name, 0)
        mrr_val += count * float(p.price)

    return AdminRevenueStats(
        total_revenue=total_rev,
        mrr=mrr_val,
        active_subscribers=active_subs_count,
        monthly_data=monthly_data,
        active_subscribers_by_plan=plan_counts,
    )


# ===================================================================
# ADMINISTRATIVE COUPON MANAGEMENT ROUTER
# ===================================================================
@router.get("/admin/coupons", response_model=list[CouponResponse])
async def admin_list_coupons(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_roles("admin")),
):
    """
    Admin command to list all coupons.
    """
    stmt = select(Coupon).order_by(Coupon.id.desc())
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.post("/admin/coupons", response_model=CouponResponse)
async def admin_create_coupon(
    payload: CouponCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_roles("admin")),
):
    """
    Admin command to configure a coupon code.
    """
    # Check if coupon already exists
    stmt = select(Coupon).where(Coupon.code == payload.code)
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Coupon code '{payload.code}' already exists."
        )

    new_coupon = Coupon(
        code=payload.code,
        discount_type=payload.discount_type,
        discount_amount=payload.discount_amount,
        expiry_date=payload.expiry_date,
        is_active=payload.is_active,
    )
    db.add(new_coupon)
    await db.commit()
    await db.refresh(new_coupon)
    return new_coupon


@router.delete("/admin/coupons/{coupon_id}", response_model=dict[str, str])
async def admin_delete_coupon(
    coupon_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_roles("admin")),
):
    """
    Admin command to remove a coupon code.
    """
    stmt = select(Coupon).where(Coupon.id == coupon_id)
    res = await db.execute(stmt)
    coupon = res.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found.")

    await db.delete(coupon)
    await db.commit()
    return {"detail": "Coupon successfully deleted."}
