import { useId } from "react";
import { Link } from "react-router-dom";
import { X, CheckCircle2 } from "lucide-react";
import { useSponsorshipCart } from "@/context/SponsorshipCartContext";
import { useAnnualFunding } from "@/hooks/useAnnualFunding";
import { useDonorAuth } from "@/context/DonorAuthContext";
import { useSponsorships } from "@/hooks/useSponsorships";
import {
  ANNUAL_SPONSORSHIP_PLANS,
  ANNUAL_SPONSORSHIP_TARGET,
  MONTHLY_SPONSORSHIP_AMOUNTS,
  SPONSORSHIP_OPTIONS,
  SPONSORSHIP_CHECKOUT,
  currentFundingYear,
  getSponsorshipOption,
  hasAnnualFundingAmount,
  isValidSponsorshipAmount,
  sponsorshipSelectionError,
} from "@/lib/sponsorship";

export function AnnualSponsorshipSummary({ sponsorship }) {
  const funding = useAnnualFunding(sponsorship.funding_model === "annual_v1");
  const { addToCart } = useSponsorshipCart();
  if (sponsorship.funding_model !== "annual_v1") return null;
  const progress = funding.data?.[sponsorship.child_id];
  const hasTotals = hasAnnualFundingAmount(progress);
  const complete = hasTotals && Number(progress.funded_amount) >= 300;
  return (
    <div className="my-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-slate-700">
      <p className="font-semibold text-deep-navy">
        {currentFundingYear()} annual support
      </p>
      {hasTotals ? (
        <>
          <p className="mt-1">
            {progress.funding_available === false ? "Last known: " : ""}
            ${Number(progress.funded_amount).toLocaleString()} of $300 received
            from all sponsors
          </p>
          <progress
            max="300"
            value={Math.min(300, Number(progress.funded_amount))}
            aria-label="Annual support received"
            className="mt-2 h-2 w-full accent-blue-700"
          />
        </>
      ) : (
        <p className="mt-1">
          {funding.isError || progress?.funding_available === false
            ? "Annual totals are temporarily unavailable."
            : "Checking annual totals…"}
        </p>
      )}
      {complete ? (
        <Link
          to="/sponsor-a-child"
          className="mt-3 block font-semibold text-blue-700 underline"
        >
          Target reached — choose another child
        </Link>
      ) : (
        progress &&
        !progress.legacy_reserved &&
        !progress.pending &&
        sponsorship.status === "active" &&
        sponsorship.monthly_amount &&
        sponsorship.children && (
          <Link
            to={SPONSORSHIP_CHECKOUT}
            onClick={() =>
              addToCart(
                sponsorship.children,
                "monthly",
                Number(sponsorship.monthly_amount) || 25,
              )
            }
            className="mt-3 block font-semibold text-blue-700 underline"
          >
            Make this month&apos;s $
            {Number(sponsorship.monthly_amount) || 25} contribution
          </Link>
        )
      )}
    </div>
  );
}

const radioCard = (selected, disabled) =>
  `flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-blue-300 ${selected ? "border-blue-600 bg-blue-50 text-blue-950" : "border-slate-200 bg-white hover:border-blue-300"} ${disabled ? "cursor-default opacity-60" : ""}`;

// One payment: $100 toward Education fees, School supplies OR Meals,
// or $300 for a full year.
export function SponsorshipPlanSelect({
  value,
  onChange,
  name,
  disabled = false,
}) {
  const groupId = useId();
  const options = ANNUAL_SPONSORSHIP_PLANS.map(getSponsorshipOption);
  return (
    <fieldset disabled={disabled} className="space-y-2 text-sm text-slate-600">
      <legend className="mb-1 font-semibold text-deep-navy">
        {name || "Support option"}
      </legend>
      <p className="mb-2 text-xs text-slate-500">
        Choose where your $100 goes, or cover the full year for $300.
      </p>
      {options.map((option) => (
        <label key={option.id} className={radioCard(value === option.id, disabled)}>
          <input
            type="radio"
            name={groupId}
            value={option.id}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
            className="mt-1 h-4 w-4 shrink-0 accent-blue-700"
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap justify-between gap-x-3 gap-y-1 font-semibold">
              <span>{option.label}</span>
              <span>${option.amount} for the year</span>
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-600">
              {option.description}. One payment.
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

// Monthly: $25 or $50 a month, up to the $300 yearly target per child.
export function MonthlyAmountSelect({ value, onChange, name, disabled = false }) {
  const groupId = useId();
  return (
    <fieldset disabled={disabled} className="space-y-2 text-sm text-slate-600">
      <legend className="mb-2 font-semibold text-deep-navy">
        {name || "Monthly amount"}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {MONTHLY_SPONSORSHIP_AMOUNTS.map((amount) => (
          <label key={amount} className={radioCard(Number(value) === amount, disabled)}>
            <input
              type="radio"
              name={groupId}
              value={amount}
              checked={Number(value) === amount}
              onChange={() => onChange(amount)}
              className="mt-1 h-4 w-4 shrink-0 accent-blue-700"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">${amount} per month</span>
              <span className="mt-1 block text-xs leading-5 text-slate-600">
                Reaches the ${ANNUAL_SPONSORSHIP_TARGET} yearly target in{" "}
                {ANNUAL_SPONSORSHIP_TARGET / amount} months.
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SponsorshipCartSelection({
  compact = false,
  disabled = false,
  editable = false,
}) {
  const {
    cartItems,
    frequency,
    subtotal,
    setItemPlan,
    setItemMonthlyAmount,
    removeFromCart,
  } = useSponsorshipCart();
  const funding = useAnnualFunding(editable && cartItems.length > 0);
  const selectionId = useId();
  const totalsUnavailable =
    funding.isError ||
    cartItems.some(
      (item) => funding.data?.[item.child_id]?.funding_available === false,
    );
  if (!cartItems.length)
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        Your sponsorship cart is empty.{" "}
        <Link
          to="/sponsor-a-child"
          className="font-semibold text-blue-700 underline"
        >
          Choose children to support
        </Link>
        .
      </div>
    );
  return (
    <div>
      {editable && totalsUnavailable && (
        <p
          role="status"
          className="mb-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600"
        >
          Annual totals are temporarily unavailable. You can still choose your
          support; availability will be checked before payment.{" "}
          <button
            type="button"
            className="underline"
            disabled={disabled || funding.isFetching}
            onClick={() => funding.refetch()}
          >
            Refresh totals
          </button>
        </p>
      )}
      <div className={compact ? "max-h-80 overflow-y-auto" : "space-y-4"}>
        {cartItems.map((item) => {
          const progress = funding.data?.[item.child_id];
          const error =
            editable && (!funding.isLoading || progress)
              ? sponsorshipSelectionError(item, progress)
              : null;
          const errorId = `${selectionId}-${item.child_id}-error`;
          const option = SPONSORSHIP_OPTIONS.find(
            (entry) => entry.id === item.support_type,
          );
          return (
            <article
              key={item.child_id}
              className="border-b border-slate-200 p-4 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                {item.photo_url && (
                  <img
                    src={item.photo_url}
                    alt=""
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-body text-base font-semibold text-deep-navy">
                    {item.first_name}
                  </h4>
                  <p className="text-xs text-slate-500">{option?.label}</p>
                </div>
                <span className="font-semibold text-deep-navy">
                  ${Number(item.amount || 0).toLocaleString()}
                  {frequency === "monthly" ? "/mo" : ""}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeFromCart(item.child_id)}
                  aria-label={`Remove ${item.first_name} from sponsorship cart`}
                  className="rounded-full p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"
                >
                  <X size={17} />
                </button>
              </div>
              {editable && frequency !== "monthly" && (
                <div className="mt-3">
                  <SponsorshipPlanSelect
                    name={`Support for ${item.first_name}`}
                    value={item.support_type}
                    onChange={(type) => setItemPlan(item.child_id, type)}
                    disabled={disabled}
                  />
                </div>
              )}
              {editable && frequency === "monthly" && (
                <div className="mt-3">
                  <MonthlyAmountSelect
                    name={`Monthly support for ${item.first_name}`}
                    value={item.monthly_amount ?? item.amount}
                    onChange={(amount) =>
                      setItemMonthlyAmount(item.child_id, amount)
                    }
                    disabled={disabled}
                  />
                </div>
              )}
              {editable && hasAnnualFundingAmount(progress) && (
                <div className="mt-3">
                  <p className="text-xs text-slate-600">
                    {progress.funding_available === false ? "Last known: " : ""}
                    ${Number(progress.funded_amount).toLocaleString()} of $300
                    received in {currentFundingYear()}
                  </p>
                  <progress
                    className="mt-1 h-1.5 w-full accent-emerald-600"
                    max="300"
                    value={Math.min(300, Number(progress.funded_amount))}
                    aria-label={`${item.first_name}'s annual funding`}
                  />
                </div>
              )}
              {error && (
                <p
                  id={errorId}
                  role="status"
                  className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
                >
                  {error}{" "}
                  {isValidSponsorshipAmount(item.amount, item.support_type) &&
                    progress && (
                      <Link
                        to="/sponsor-a-child"
                        className="font-semibold underline"
                      >
                        Choose another child
                      </Link>
                    )}
                </p>
              )}
            </article>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between rounded-xl bg-blue-50 p-4 font-semibold text-deep-navy">
        <span>Total{frequency === "monthly" ? " per month" : ""}</span>
        <span>${subtotal.toLocaleString()}</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        {!editable
          ? "Choose or change each child’s support option and amount at sponsorship checkout."
          : frequency === "monthly"
            ? "Monthly support is paid through checkout each month: $25 or $50 per child toward a $300 yearly target. Once a child reaches $300 for the year, you'll be asked to choose another child."
            : "One payment supports all selected children: $100 toward Education fees, School supplies or Meals, or $300 for a full year. Each child can receive up to $300 per year."}
      </p>
    </div>
  );
}

export function AnnualFundingNotice() {
  const { user } = useDonorAuth();
  const sponsorships = useSponsorships(user?.id);
  const funding = useAnnualFunding(Boolean(user));
  const children = [
    ...new Map(
      (sponsorships.data?.data || [])
        .filter(
          (item) =>
            item.monthly_amount &&
            item.status === "active" &&
            Number(funding.data?.[item.child_id]?.funded_amount) >= 300,
        )
        .map((item) => [
          item.child_id,
          item.children?.first_name || "A child you support",
        ]),
    ).values(),
  ];
  if (!children.length) return null;
  return (
    <div
      role="status"
      className="my-5 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900"
    >
      <CheckCircle2 size={23} className="shrink-0" />
      <div>
        <p className="font-semibold">Annual sponsorship target reached</p>
        <p className="mt-1 text-sm leading-6">
          {children.join(", ")} {children.length === 1 ? "has" : "have"} reached
          the $300 target for {currentFundingYear()}. Please choose another
          child for your next monthly contribution.
        </p>
        <Link
          to="/sponsor-a-child"
          className="mt-2 inline-block text-sm font-bold underline"
        >
          Choose another child
        </Link>
      </div>
    </div>
  );
}
