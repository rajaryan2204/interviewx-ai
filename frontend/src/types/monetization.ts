export interface PlanResponse {
  id: number;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  features: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponResponse {
  id: number;
  code: string;
  discount_type: string;
  discount_amount: number;
  expiry_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SubscriptionResponse {
  id: number;
  user_id: number;
  plan_id: number;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  razorpay_subscription_id: string | null;
  coupon_id: number | null;
  created_at: string;
  updated_at: string;
  plan?: PlanResponse;
  coupon?: CouponResponse;
}

export interface InvoiceResponse {
  id: number;
  user_id: number;
  subscription_id: number;
  billing_name: string;
  billing_email: string;
  amount: number;
  currency: string;
  status: string;
  pdf_url: string | null;
  created_at: string;
}

export interface TransactionResponse {
  id: number;
  user_id: number;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

export interface CheckoutSessionResponse {
  payment_order_id: string;
  amount: number;
  currency: string;
  checkout_url: string | null;
  active_provider: string;
  is_sandbox?: boolean;
}

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
}

export interface AdminRevenueStats {
  total_revenue: number;
  mrr: number;
  active_subscribers: number;
  monthly_data: MonthlyRevenuePoint[];
  active_subscribers_by_plan: Record<string, number>;
}
