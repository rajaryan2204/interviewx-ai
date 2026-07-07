"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, Download, Trash2, Calendar, Sparkles } from "lucide-react";
import { getCurrentSubscription, cancelSubscription, listInvoices } from "@/lib/monetization-api";
import type { SubscriptionResponse, InvoiceResponse } from "@/types/monetization";

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchBillingData = () => {
    Promise.all([getCurrentSubscription(), listInvoices()])
      .then(([s, i]) => {
        setSubscription(s);
        setInvoices(i);
      })
      .catch((err) => console.error("Error loading billing details:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleCancelSub = async () => {
    if (!confirm("Are you sure you want to cancel auto-renewals for your subscription? You will still retain access until the current billing cycle ends.")) return;
    setCancelLoading(true);
    try {
      await cancelSubscription();
      fetchBillingData(); // Refresh current subscription state
    } catch (err) {
      console.error("Error cancelling subscription:", err);
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 p-3 ring-1 ring-white/10">
          <CreditCard className="h-7 w-7 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Billing & Subscription</h1>
          <p className="text-sm text-neutral-500">Examine current service plans, billing history, and invoices logs</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Columns: Subscription Dashboard Card */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Active Subscription Details */}
            <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-neutral-850 dark:text-white uppercase tracking-wider">
                Subscription Settings Overview
              </h2>

              {subscription ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column info */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Current Plan Tier</p>
                      <h1 className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">
                        {subscription.plan?.name || "Free Sandbox"}
                      </h1>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                        subscription.status === "active"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {subscription.status}
                      </span>
                      {subscription.cancel_at_period_end && (
                        <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-500 uppercase tracking-wider">
                          Auto-renew Off
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-500 leading-relaxed max-w-sm">
                      {subscription.plan?.description || "You are currently on the Free plan tier. Upgrade to unlock mock interviews, coding sessions, voice interations, and recruiter dashboards."}
                    </p>
                  </div>

                  {/* Right Column details */}
                  <div className="rounded-2xl border border-neutral-100 dark:border-neutral-900 p-5 bg-neutral-50/50 dark:bg-neutral-950/20 space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-450 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Start Date:</span>
                        <span className="font-mono font-semibold">{new Date(subscription.current_period_start).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-450 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Expiry / Renewal:</span>
                        <span className="font-mono font-semibold">{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                      </div>
                      {subscription.coupon && (
                        <div className="flex justify-between items-center text-xs border-t border-neutral-200/30 pt-2 text-emerald-600 font-bold">
                          <span>Discount Code:</span>
                          <span className="font-mono">{subscription.coupon.code}</span>
                        </div>
                      )}
                    </div>

                    {/* Auto-renew/Cancel settings actions */}
                    {subscription.plan && subscription.plan.price > 0 && !subscription.cancel_at_period_end && (
                      <button
                        onClick={handleCancelSub}
                        disabled={cancelLoading}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        {cancelLoading ? "Cancelling renewals..." : "Cancel Auto-renew"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-400 italic">No subscription details found.</p>
              )}
            </div>

            {/* Invoices History receipts */}
            <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-neutral-850 dark:text-white uppercase tracking-wider">
                Statement Logs & Invoices History
              </h2>

              {invoices.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-8 italic">No invoice history found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-neutral-200/40 dark:border-neutral-800/40 text-neutral-450 uppercase tracking-wider">
                        <th className="pb-3.5 font-bold">Invoice Ref</th>
                        <th className="pb-3.5 font-bold">Billing Email</th>
                        <th className="pb-3.5 font-bold">Amount</th>
                        <th className="pb-3.5 font-bold">Status</th>
                        <th className="pb-3.5 font-bold">Billing Date</th>
                        <th className="pb-3.5 font-bold text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="text-neutral-750 dark:text-neutral-300">
                          <td className="py-3.5 font-mono">#INV-{inv.id}</td>
                          <td className="py-3.5">{inv.billing_email}</td>
                          <td className="py-3.5 font-bold font-mono">₹{inv.amount.toLocaleString()}</td>
                          <td className="py-3.5">
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 font-mono">{new Date(inv.created_at).toLocaleDateString()}</td>
                          <td className="py-3.5 text-right">
                            <a
                              href={inv.pdf_url ? (inv.pdf_url.startsWith("http") ? inv.pdf_url : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000"}${inv.pdf_url}`) : "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-500 font-semibold"
                            >
                              <Download className="w-3.5 h-3.5" /> PDF
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Premium Status Card details */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Credit Card Mock */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-3xl p-6 shadow-xl space-y-8 relative overflow-hidden flex flex-col justify-between aspect-[1.586/1]">
              <div className="absolute right-0 bottom-0 top-0 left-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12)_0%,transparent_60%)] pointer-events-none" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-violet-200">InterviewX Premium</p>
                  <h2 className="text-lg font-bold">Sandbox Card</h2>
                </div>
                <Sparkles className="w-6 h-6 text-violet-200 fill-violet-200/20" />
              </div>

              <div className="space-y-4">
                <p className="text-lg font-mono tracking-widest font-semibold">••••  ••••  ••••  4111</p>
                <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-violet-200 font-mono">
                  <div>
                    <p className="opacity-60">Card Holder</p>
                    <p className="font-semibold text-white">Productivity Tester</p>
                  </div>
                  <div className="text-right">
                    <p className="opacity-60">Expiry</p>
                    <p className="font-semibold text-white">12 / 28</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preparation limits */}
            <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/40 backdrop-blur-md p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-neutral-850 dark:text-neutral-350 uppercase tracking-wider">
                Usage Limitations Checklist
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-900 pb-2">
                  <span className="text-neutral-450">Mock Interviews</span>
                  <span className="font-bold">{subscription?.plan?.name === "Free" ? "3 / month" : "Unlimited"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-900 pb-2">
                  <span className="text-neutral-450">Resume Audits</span>
                  <span className="font-bold">{subscription?.plan?.name === "Free" ? "5 / month" : "Unlimited"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-900 pb-2">
                  <span className="text-neutral-450">Coding Editor runs</span>
                  <span className="font-bold">{subscription?.plan?.name === "Free" ? "10 / month" : "Unlimited"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-450">Recruiter Assignments</span>
                  <span className="font-bold">{subscription?.plan?.name === "Enterprise" ? "Full access" : "None"}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
