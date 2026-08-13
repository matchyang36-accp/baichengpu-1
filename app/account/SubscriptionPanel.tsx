"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Subscription = {
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
};

type SubscriptionState = {
  loading: boolean;
  plan: string;
  subscription: Subscription | null;
  error: boolean;
};

function planLabel(plan: string): string {
  if (plan === "team") return "Team";
  if (plan === "pro") return "Pro";
  return "Free";
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export function SubscriptionPanel({ initialPlan }: { initialPlan: string }) {
  const [state, setState] = useState<SubscriptionState>({
    loading: true,
    plan: initialPlan,
    subscription: null,
    error: false,
  });
  const [openingPortal, setOpeningPortal] = useState(false);
  const [portalError, setPortalError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/subscription", { headers: { accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Subscription request failed: ${response.status}`);
        return response.json() as Promise<{ plan: string; subscription: Subscription | null }>;
      })
      .then((result) => {
        if (active) setState({ loading: false, plan: result.plan, subscription: result.subscription, error: false });
      })
      .catch((reason) => {
        console.error("[account] SUBSCRIPTION_LOAD_FAILED", reason);
        if (active) setState((current) => ({ ...current, loading: false, error: true }));
      });
    return () => {
      active = false;
    };
  }, []);

  async function openBillingPortal() {
    setOpeningPortal(true);
    setPortalError(false);
    try {
      const response = await fetch("/api/billing-portal", {
        method: "POST",
        headers: { accept: "application/json" },
      });
      const result = (await response.json()) as { url?: string };
      if (!response.ok || !result.url) throw new Error(`Portal request failed: ${response.status}`);
      window.location.assign(result.url);
    } catch (reason) {
      console.error("[account] BILLING_PORTAL_OPEN_FAILED", reason);
      setPortalError(true);
      setOpeningPortal(false);
    }
  }

  // A canceled customer can still need invoices or payment-method history.
  const canManage = Boolean(state.subscription);
  return (
    <article className="account-plan-card" aria-live="polite">
      <div>
        <span className="account-card-label">Subscription</span>
        <h2>{planLabel(state.plan)}</h2>
        {state.loading ? <p>Loading subscription details...</p> : null}
        {!state.loading && state.subscription ? (
          <p>
            Status: {state.subscription.status}. Current period ends {formatDate(state.subscription.currentPeriodEnd)}.
            {state.subscription.cancelAtPeriodEnd ? " Cancellation is scheduled." : ""}
          </p>
        ) : null}
        {!state.loading && !state.subscription ? <p>No active paid subscription.</p> : null}
        {state.error ? <p className="account-inline-error">Subscription details are temporarily unavailable.</p> : null}
        {portalError ? <p className="account-inline-error">Could not open billing management. Please try again.</p> : null}
      </div>
      {canManage ? (
        <button className="secondary-button" type="button" onClick={openBillingPortal} disabled={openingPortal}>
          {openingPortal ? "Opening..." : "Manage subscription"}
        </button>
      ) : (
        <Link className="secondary-button" href="/pricing">
          View plans
        </Link>
      )}
    </article>
  );
}
