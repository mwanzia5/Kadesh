import { ANNUAL_SPONSORSHIP_TARGET, currentFundingYear, hasAnnualFundingAmount, sponsorshipRemaining } from "@/lib/sponsorship";

export function fundingLabel(funding) {
  if (!hasAnnualFundingAmount(funding) || funding.legacy_reserved) return null;
  if (Number(funding.funded_amount) >= ANNUAL_SPONSORSHIP_TARGET) return `Fully funded for ${currentFundingYear()}`;
  return Number(funding.funded_amount) > 0 ? "Partially funded" : "Needs support";
}

export default function FundingProgress({ funding }) {
  if (funding?.legacy_reserved) return null;
  if (!hasAnnualFundingAmount(funding)) return <p className="mb-3 text-xs text-slate-600">Annual funding totals are temporarily unavailable.</p>;
  const amount = Math.max(0, Number(funding.funded_amount));
  const percent = Math.min(100, Math.floor(amount / ANNUAL_SPONSORSHIP_TARGET * 100));
  return (
    <div className="mb-3 space-y-2 text-xs text-slate-600">
      {funding.funding_available === false && <p>Last known funding totals</p>}
      <p>${amount.toLocaleString()} raised of ${ANNUAL_SPONSORSHIP_TARGET} annual goal</p>
      <progress max={ANNUAL_SPONSORSHIP_TARGET} value={Math.min(amount, ANNUAL_SPONSORSHIP_TARGET)} aria-label="Annual support funding progress" className="h-2 w-full accent-blue-700" />
      <div className="flex flex-wrap justify-between gap-1"><span>{percent}% funded</span><span>${sponsorshipRemaining(amount).toLocaleString()} still needed for {currentFundingYear()}</span></div>
    </div>
  );
}
