import type {
  PlanResponse,
  SubscriptionResponse,
  InvoiceResponse,
  CheckoutSessionResponse,
  AdminRevenueStats,
} from "@/types/monetization";

import { apiFetch as globalApiFetch } from "@/lib/api";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await globalApiFetch(path, {
    ...options,
    json: options.body ? JSON.parse(options.body as string) : undefined
  } as unknown as Parameters<typeof globalApiFetch>[1]);

  if (res.status === 204) {
    return undefined as unknown as T;
  }
  return (await res.json()) as T;
}

// 1. Plan APIs
export const listPlans = (): Promise<PlanResponse[]> =>
  apiFetch<PlanResponse[]>("/api/monetization/plans");

// 2. Checkout & Verification APIs
export const createCheckoutSession = (
  planId: number,
  couponCode?: string
): Promise<CheckoutSessionResponse> =>
  apiFetch<CheckoutSessionResponse>("/api/monetization/checkout", {
    method: "POST",
    body: JSON.stringify({ plan_id: planId, coupon_code: couponCode || undefined }),
  });

export const verifyCheckoutPayment = (data: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  plan_id: number;
  coupon_code?: string;
}): Promise<{ detail: string; subscription_id: number }> =>
  apiFetch<{ detail: string; subscription_id: number }>("/api/monetization/verify", {
    method: "POST",
    body: JSON.stringify(data),
  });

// 3. Subscription APIs
export const getCurrentSubscription = (): Promise<SubscriptionResponse> =>
  apiFetch<SubscriptionResponse>("/api/monetization/subscriptions/current");

export const cancelSubscription = (): Promise<{ detail: string }> =>
  apiFetch<{ detail: string }>("/api/monetization/subscriptions/cancel", {
    method: "POST",
  });

// 4. Coupons APIs
export const validateCoupon = (
  code: string,
  planId: number
): Promise<{
  valid: boolean;
  discount_amount: number;
  final_price: number;
  discount_type: string;
  currency: string;
}> =>
  apiFetch<{
    valid: boolean;
    discount_amount: number;
    final_price: number;
    discount_type: string;
    currency: string;
  }>("/api/monetization/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code, plan_id: planId }),
  });

// 5. Invoices APIs
export const listInvoices = (): Promise<InvoiceResponse[]> =>
  apiFetch<InvoiceResponse[]>("/api/monetization/invoices");

// 6. Admin APIs
export const adminGetRevenueStats = (): Promise<AdminRevenueStats> =>
  apiFetch<AdminRevenueStats>("/api/monetization/admin/revenue");
