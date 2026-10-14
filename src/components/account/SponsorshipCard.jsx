import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Hash,
  Loader2,
  MapPin,
  MessageCircle,
  PauseCircle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { AnnualSponsorshipSummary } from "@/components/cart/SponsorshipSelection";
import { cn } from "@/lib/utils";
import { sponsorshipPaymentState } from "@/lib/monthlyGiving";

const STATUS = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    strip: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  paused: {
    label: "Paused",
    icon: PauseCircle,
    strip: "bg-amber-400",
    badge: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    strip: "bg-slate-300",
    badge: "bg-slate-100 text-slate-600 ring-slate-200",
  },
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

const money = (value) => `$${Number(value || 0).toLocaleString()}`;

export function sponsorshipPlanLabel(sponsorship) {
  if (sponsorship.monthly_amount)
    return `Monthly · ${money(sponsorship.monthly_amount)}/month`;
  if (sponsorship.funding_model === "annual_v1")
    return Number(sponsorship.amount) >= 300
      ? "Full year · one payment"
      : "One payment";
  return "One-time sponsorship";
}

function Detail({ icon: Icon, label, children }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0 text-vibrant-blue"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <dt className="font-body text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </dt>
        <dd className="truncate font-body text-sm font-semibold text-deep-navy">
          {children}
        </dd>
      </div>
    </div>
  );
}

const outlineButton =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2 font-body text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50";

export default function SponsorshipCard({
  sponsorship,
  currentUserId,
  onCancel,
  cancelling = false,
  onReactivate,
  reactivating = false,
  reactivatePlan,
  onReactivatePlanChange,
}) {
  const [confirming, setConfirming] = useState(false);
  const child = sponsorship.children || {};
  const status = STATUS[sponsorship.status] || STATUS.cancelled;
  const StatusIcon = status.icon;
  // Monthly sponsorships are paid by hand; flag ones that have fallen behind.
  const payment = sponsorshipPaymentState(sponsorship);
  const byAdmin =
    sponsorship.status === "cancelled" &&
    sponsorship.cancelled_by &&
    sponsorship.cancelled_by !== currentUserId;
  const annual = sponsorship.funding_model === "annual_v1";
  const reference = sponsorship.donations?.payment_reference;
  // Reactivating needs the child to still be open for sponsorship.
  const childTaken =
    sponsorship.status === "cancelled" &&
    !byAdmin &&
    Boolean(child.sponsorship_status) &&
    child.sponsorship_status !== "available";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_-40px_rgba(15,38,82,0.5)]">
      <div className={cn("h-1.5 w-full", status.strip)} aria-hidden="true" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Child */}
        <div className="flex items-start gap-4">
          <Link
            to={`/sponsor-a-child/${sponsorship.child_id}`}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100"
            aria-label={`View ${child.first_name || "child"}'s profile`}
          >
            {child.photo_url ? (
              <OptimizedImage
                src={child.photo_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-vibrant-blue/40">
                {child.first_name?.charAt(0) || "?"}
              </span>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="truncate font-display text-xl font-bold text-deep-navy">
                {child.first_name || "Unknown child"}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-body text-xs font-semibold ring-1 ring-inset",
                  status.badge,
                )}
              >
                <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {status.label}
                {byAdmin ? " by our team" : ""}
              </span>
              {payment?.overdue && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 font-body text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  Payment overdue
                </span>
              )}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 font-body text-sm text-on-surface-variant">
              {child.age ? <span>Age {child.age}</span> : null}
              {child.location ? (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{child.location}</span>
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {/* Details */}
        <dl className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Detail icon={CreditCard} label="Plan">
            {sponsorshipPlanLabel(sponsorship)}
          </Detail>
          <Detail icon={CreditCard} label={annual ? "Total given" : "Amount"}>
            {money(sponsorship.amount ?? sponsorship.monthly_amount)}
          </Detail>
          <Detail icon={Calendar} label="Started">
            {formatDate(sponsorship.start_date || sponsorship.created_at)}
          </Detail>
          {sponsorship.status === "cancelled" ? (
            <Detail icon={XCircle} label="Cancelled on">
              {formatDate(sponsorship.cancelled_at)}
            </Detail>
          ) : sponsorship.status === "paused" ? (
            <Detail icon={PauseCircle} label="Paused on">
              {formatDate(sponsorship.paused_at)}
            </Detail>
          ) : (
            <Detail icon={Hash} label="Payment reference">
              {reference || "—"}
            </Detail>
          )}
        </dl>

        {/* Monthly payment reminder */}
        {payment?.due && (
          <p
            className={cn(
              "mt-4 flex gap-2 rounded-xl border px-3.5 py-3 font-body text-sm leading-6",
              payment.overdue
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-amber-200 bg-amber-50 text-amber-900",
            )}
          >
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
            {payment.overdue
              ? `${payment.monthsBehind} monthly payments of ${money(payment.monthlyAmount)} are unpaid. Please pay to keep supporting ${child.first_name || "this child"}.`
              : `This month's ${money(payment.monthlyAmount)} payment is due.`}
          </p>
        )}

        {/* Status explanation */}
        {sponsorship.status === "paused" && (
          <p className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 font-body text-sm leading-6 text-amber-900">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
            {annual
              ? "Our team has paused this sponsorship. Payments already received still count toward this child's support. Contact us to resume."
              : `Our team has paused this sponsorship. ${child.first_name || "The child"} stays reserved for you. Contact us to resume.`}
          </p>
        )}
        {sponsorship.status === "cancelled" && (
          <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-body text-sm leading-6 text-slate-600">
            {byAdmin
              ? "This sponsorship was ended by our team. Contact us if you have questions."
              : childTaken
                ? `${child.first_name || "This child"} now has another sponsor. You can choose another child to support.`
                : annual
                  ? "You ended this sponsorship. Payments already received stay with this child. To sponsor again, choose a plan below and complete payment."
                  : "You cancelled this sponsorship. To reactivate it, choose one-time or monthly below and complete payment."}
          </p>
        )}
        {sponsorship.reassigned_at && sponsorship.previous_child && (
          <p className="mt-3 rounded-xl bg-blue-50 px-3.5 py-2.5 font-body text-xs leading-5 text-vibrant-blue">
            Moved from {sponsorship.previous_child.first_name} on{" "}
            {formatDate(sponsorship.reassigned_at)} (no extra payment)
          </p>
        )}

        <AnnualSponsorshipSummary sponsorship={sponsorship} />

        {/* Actions */}
        <div className="mt-auto border-t border-slate-100 pt-4">
          {confirming ? (
            <div
              role="alertdialog"
              aria-label="Confirm cancellation"
              className="rounded-xl border border-red-200 bg-red-50 p-3.5"
            >
              <p className="font-body text-sm font-semibold text-red-800">
                Cancel {child.first_name || "this"}&apos;s sponsorship?
              </p>
              <p className="mt-1 font-body text-xs leading-5 text-red-700">
                {annual
                  ? "Payments already received stay with this child."
                  : `${child.first_name || "The child"} will become available for other sponsors.`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={async () => {
                    const ok = await onCancel?.(sponsorship);
                    if (ok !== false) setConfirming(false);
                  }}
                  className={cn(
                    outlineButton,
                    "border-red-600 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300",
                  )}
                >
                  {cancelling && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  )}
                  {cancelling ? "Cancelling…" : "Yes, cancel"}
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => setConfirming(false)}
                  className={cn(
                    outlineButton,
                    "border-slate-300 bg-white text-deep-navy hover:bg-slate-50 focus-visible:ring-slate-300",
                  )}
                >
                  Keep sponsorship
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/sponsor-a-child/${sponsorship.child_id}`}
                className={cn(
                  outlineButton,
                  "border-slate-300 bg-white text-deep-navy hover:border-vibrant-blue hover:text-vibrant-blue focus-visible:ring-vibrant-blue/30",
                )}
              >
                View profile
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              {sponsorship.status === "active" && (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className={cn(
                    outlineButton,
                    "border-red-200 bg-white text-red-700 hover:bg-red-50 focus-visible:ring-red-200",
                  )}
                >
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  Cancel sponsorship
                </button>
              )}

              {(sponsorship.status === "paused" || byAdmin) && (
                <Link
                  to="/contact"
                  className={cn(
                    outlineButton,
                    "border-amber-300 bg-white text-amber-800 hover:bg-amber-50 focus-visible:ring-amber-200",
                  )}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Contact us
                </Link>
              )}

              {sponsorship.status === "cancelled" && !byAdmin && childTaken && (
                <Link
                  to="/sponsor-a-child"
                  className={cn(
                    outlineButton,
                    "border-vibrant-blue bg-vibrant-blue text-white hover:bg-vibrant-blue/90 focus-visible:ring-vibrant-blue/30",
                  )}
                >
                  Sponsor another child
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}

              {sponsorship.status === "cancelled" && !byAdmin && !childTaken && (
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    role="group"
                    aria-label="Reactivate as"
                    className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1"
                  >
                    {["one-time", "monthly"].map((plan) => (
                      <button
                        key={plan}
                        type="button"
                        aria-pressed={reactivatePlan === plan}
                        onClick={() => onReactivatePlanChange?.(plan)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 font-body text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-blue/40",
                          reactivatePlan === plan
                            ? "bg-deep-navy text-white shadow-sm"
                            : "text-slate-600 hover:bg-white hover:text-deep-navy",
                        )}
                      >
                        {plan === "monthly" ? "Monthly · $25/mo" : "One-time · $100"}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={reactivating}
                    onClick={() => onReactivate?.(sponsorship, reactivatePlan)}
                    className={cn(
                      outlineButton,
                      "border-vibrant-blue bg-vibrant-blue text-white hover:bg-vibrant-blue/90 focus-visible:ring-vibrant-blue/30",
                    )}
                  >
                    {reactivating ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    )}
                    Reactivate &amp; pay
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
