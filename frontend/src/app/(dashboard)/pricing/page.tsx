"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Sparkles, Check, ArrowRight, ShieldCheck, RefreshCw, X } from "lucide-react";
import { listPlans, createCheckoutSession, verifyCheckoutPayment, validateCoupon, getCurrentSubscription } from "@/lib/monetization-api";
import type { PlanResponse, SubscriptionResponse, CheckoutSessionResponse } from "@/types/monetization";

export default function PricingPage() {
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [currentSub, setCurrentSub] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; discount: number; finalPrice: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Checkout state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanResponse | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSessionResponse | null>(null);

  const fetchData = useCallback(() => {
    listPlans()
      .then((p) => {
        setPlans(p);
      })
      .catch((err) => {
        console.error("Error fetching plans:", err);
      });

    getCurrentSubscription()
      .then((s) => {
        setCurrentSub(s);
      })
      .catch((err) => {
        console.error("Error fetching subscription:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
    // Load Razorpay Standard Checkout SDK dynamically
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [fetchData]);

  const handleApplyCoupon = async (planId: number) => {
    if (!couponCode.trim()) return;
    setCouponError(null);
    try {
      const res = await validateCoupon(couponCode.trim(), planId);
      if (res.valid) {
        setActiveCoupon({
          code: couponCode.trim(),
          discount: res.discount_amount,
          finalPrice: res.final_price
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Invalid coupon code.";
      setCouponError(errorMsg);
      setActiveCoupon(null);
    }
  };

  const handleInitiateCheckout = (plan: PlanResponse) => {
    setSelectedPlan(plan);
    setCouponCode("");
    setActiveCoupon(null);
    setCouponError(null);
    setPaymentError(null);
    setPaymentSuccess(false);
    setIsSandboxMode(false);
    setCheckoutSession(null);
    setCheckoutModalOpen(true);
  };

  const handleProcessRazorpayPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setCheckoutLoading(true);
    setPaymentError(null);

    try {
      // 1. Initialize checkout session on backend to retrieve order_id
      const session = await createCheckoutSession(
        selectedPlan.id,
        activeCoupon ? activeCoupon.code : undefined
      );

      setCheckoutSession(session);

      if (session.amount === 0) {
        setPaymentSuccess(true);
        setTimeout(() => {
          setCheckoutModalOpen(false);
          fetchData(); // Refresh subscription state
        }, 2000);
        return;
      }

      if (session.is_sandbox) {
        setIsSandboxMode(true);
        setCheckoutLoading(false);
        return;
      }

      interface RazorpaySuccessResponse {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }

      interface RazorpayFailedResponse {
        error: {
          description: string;
        };
      }

      // 2. Configure and trigger Razorpay Standard Checkout popup modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TAFEqz9HPkgfZt",
        amount: Math.round(session.amount * 100), // in subunits (paise)
        currency: "INR",
        name: "InterviewX AI",
        description: `${selectedPlan.name} Subscription Plan`,
        order_id: session.payment_order_id,
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            setCheckoutLoading(true);
            await verifyCheckoutPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: selectedPlan.id,
              coupon_code: activeCoupon ? activeCoupon.code : undefined
            });
            setPaymentSuccess(true);
            setTimeout(() => {
              setCheckoutModalOpen(false);
              fetchData(); // Refresh subscription state
            }, 2000);
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Payment signature verification failed.";
            setPaymentError(errorMsg);
          } finally {
            setCheckoutLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setCheckoutLoading(false);
            setPaymentError("Payment modal dismissed by user.");
          }
        },
        prefill: {
          name: "Candidate",
          email: "candidate@interviewx.ai"
        },
        theme: {
          color: "#6366f1"
        }
      };

      const razorpayWindow = window as unknown as {
        Razorpay: new (opts: typeof options) => {
          on: (event: string, cb: (res: RazorpayFailedResponse) => void) => void;
          open: () => void;
        };
      };

      const rzp1 = new razorpayWindow.Razorpay(options);
      rzp1.on("payment.failed", function (resp: RazorpayFailedResponse) {
        setPaymentError(resp.error.description || "Payment gateway processing error.");
      });
      rzp1.open();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to initiate checkout session.";
      setPaymentError(errorMsg);
      setCheckoutLoading(false);
    }
  };

  const isCurrentPlan = (plan: PlanResponse) => {
    if (!currentSub) return false;
    // Special handling for Free plan when id is 0
    if (plan.name === "Free" && currentSub.plan_id === plan.id) return true;
    return currentSub.plan_id === plan.id && currentSub.status === "active";
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 font-sans">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-600 dark:text-violet-400">
          <Sparkles className="w-3.5 h-3.5" />
          Pricing Plans
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Accelerate Your AI Preparation Journey
        </h1>
        <p className="text-sm text-neutral-500 max-w-md mx-auto">
          Choose a tier that aligns with your interview objectives, from sandbox trials to enterprise bulk candidate portals.
        </p>

        {/* Toggle billing cycle */}
        <div className="flex items-center justify-center pt-4">
          <div className="bg-neutral-100 dark:bg-neutral-850 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-neutral-900 shadow text-violet-600"
                  : "text-neutral-450 hover:text-neutral-800"
              }`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                billingCycle === "yearly"
                  ? "bg-white dark:bg-neutral-900 shadow text-violet-600"
                  : "text-neutral-450 hover:text-neutral-800"
              }`}
            >
              Yearly billing
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
          {plans
            .filter((plan) => plan.name === "Free" || plan.interval === (billingCycle === "yearly" ? "yearly" : "monthly"))
            .map((plan) => {
              const isFree = plan.name === "Free";
              const isPremium = plan.name === "Pro" || plan.name === "Annual Pro";
              const price = plan.price;
              const active = isCurrentPlan(plan);

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl border p-6 flex flex-col justify-between relative transition-all duration-300 ${
                    active
                      ? "bg-neutral-50/75 dark:bg-neutral-950/20 border-violet-500 shadow-lg shadow-violet-500/5 ring-1 ring-violet-500"
                      : isPremium
                      ? "bg-neutral-50/50 dark:bg-neutral-900/30 border-neutral-300 dark:border-neutral-800 shadow-md hover:scale-[1.01]"
                      : "bg-white/50 dark:bg-neutral-900/10 border-neutral-200 dark:border-neutral-850 hover:scale-[1.01]"
                  }`}
                >
                  {/* Badges */}
                  {plan.name === "Pro" && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md">
                      Most Popular
                    </span>
                  )}
                  {plan.name === "Annual Pro" && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md animate-pulse">
                      Best Value
                    </span>
                  )}

                  <div className="space-y-6">
                    {/* Plan Name */}
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold">{plan.name}</h2>
                      <p className="text-xs text-neutral-400">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold font-mono">
                        ₹{price.toLocaleString()}
                      </span>
                      <span className="text-xs text-neutral-400 font-medium">
                        / {plan.interval === "yearly" ? "year" : "month"}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-neutral-100 dark:border-neutral-900" />

                    {/* Features List */}
                    <ul className="space-y-3.5 text-xs text-neutral-600 dark:text-neutral-300">
                      {plan.features?.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Checkout Button */}
                  <div className="pt-8">
                    {active ? (
                      <div className="w-full text-center rounded-xl bg-neutral-100 dark:bg-neutral-800 py-2.5 text-xs font-bold text-neutral-450 border border-neutral-200 dark:border-neutral-900 flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-violet-500" /> Active Subscription
                      </div>
                    ) : isFree ? (
                      <div className="w-full text-center rounded-xl bg-neutral-50 dark:bg-neutral-900 py-2.5 text-xs font-bold text-neutral-400 border border-neutral-100 dark:border-neutral-950">
                        Standard Sandbox Access
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInitiateCheckout(plan)}
                        className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition shadow-sm active:scale-98 ${
                          isPremium
                            ? "bg-violet-600 hover:bg-violet-500 text-white"
                            : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100"
                        }`}
                      >
                        Choose Plan <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Checkout Modal Dialog */}
      {checkoutModalOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-2xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <button
              onClick={() => setCheckoutModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-violet-500" />
              <h2 className="text-base font-bold">Secure checkout with Razorpay</h2>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900/60 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between font-semibold">
                <span>Selected Plan:</span>
                <span>{selectedPlan.name} ({billingCycle})</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Base Price:</span>
                <span>₹{(billingCycle === "yearly" ? selectedPlan.price * 12 * 0.8 : selectedPlan.price).toLocaleString()}</span>
              </div>

              {activeCoupon && (
                <div className="flex justify-between text-emerald-500 font-semibold">
                  <span>Coupon Applied ({activeCoupon.code}):</span>
                  <span>-₹{activeCoupon.discount.toLocaleString()}</span>
                </div>
              )}

              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-2 flex justify-between font-bold text-sm">
                <span>Total Amount:</span>
                <span>₹{(activeCoupon ? activeCoupon.finalPrice : (billingCycle === "yearly" ? selectedPlan.price * 12 * 0.8 : selectedPlan.price)).toLocaleString()}</span>
              </div>
            </div>

            {/* Coupon Code Input */}
            {!activeCoupon && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">Discount Coupon</label>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SAVE20"
                    className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-xs uppercase font-mono outline-none"
                  />
                  <button
                    onClick={() => handleApplyCoupon(selectedPlan.id)}
                    className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-xs px-3 rounded-xl font-semibold transition"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-rose-500 font-semibold">{couponError}</p>}
              </div>
            )}

            {/* Razorpay Standard Web Checkout Action Form */}
            {isSandboxMode ? (
              <div className="space-y-4 pt-2">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center space-y-1 text-xs text-amber-600 dark:text-amber-400">
                  <div className="font-bold flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Razorpay Sandbox Simulator
                  </div>
                  <p>Razorpay API returned 401. You can simulate the gateway response below to test plan upgrade and recruiter activations.</p>
                </div>

                {paymentError && (
                  <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {paymentError}
                  </p>
                )}

                {paymentSuccess ? (
                  <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/20 py-2.5 text-center text-xs text-emerald-500 font-bold flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4.5 h-4.5 animate-bounce" /> Payment successful! Provisioning tier...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={checkoutLoading}
                      onClick={async () => {
                        try {
                          setCheckoutLoading(true);
                          setPaymentError(null);
                          await verifyCheckoutPayment({
                            razorpay_payment_id: "pay_sandboxmock_" + Math.random().toString(36).substring(2, 11),
                            razorpay_order_id: checkoutSession?.payment_order_id || `order_mock_${Date.now()}`,
                            razorpay_signature: "sandbox_signature",
                            plan_id: selectedPlan.id,
                            coupon_code: activeCoupon ? activeCoupon.code : undefined
                          });
                          setPaymentSuccess(true);
                          setTimeout(() => {
                            setCheckoutModalOpen(false);
                            setIsSandboxMode(false);
                            fetchData(); // Refresh subscription state
                          }, 2000);
                        } catch (err) {
                          const errorMsg = err instanceof Error ? err.message : "Mock payment verification failed.";
                          setPaymentError(errorMsg);
                        } finally {
                          setCheckoutLoading(false);
                        }
                      }}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white transition active:scale-98"
                    >
                      Simulate Success
                    </button>
                    <button
                      type="button"
                      disabled={checkoutLoading}
                      onClick={() => {
                        setPaymentError("User cancelled checkout flow. Payment failed.");
                      }}
                      className="rounded-xl bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-bold text-white transition active:scale-98"
                    >
                      Simulate Failure
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleProcessRazorpayPayment} className="space-y-4 pt-2">
                <div className="rounded-xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-950/20 p-4 text-center space-y-1.5 text-xs text-neutral-450 leading-relaxed">
                  <p>Clicking the button below will open the official Razorpay Checkout popup modal where you can securely complete your transaction.</p>
                </div>

                {paymentError && (
                  <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {paymentError}
                  </p>
                )}

                {paymentSuccess ? (
                  <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/20 py-2.5 text-center text-xs text-emerald-500 font-bold flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4.5 h-4.5 animate-bounce" /> Payment successful! Provisioning tier...
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={checkoutLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white transition hover:bg-violet-500 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkoutLoading ? "animate-spin" : ""}`} />
                    {checkoutLoading ? "Initiating Gateway..." : `Pay ₹${(activeCoupon ? activeCoupon.finalPrice : (billingCycle === "yearly" ? selectedPlan.price * 12 * 0.8 : selectedPlan.price)).toLocaleString()}`}
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
