import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

/**
 * Shown when a reactivation or credit sponsorship costs more than the donor has
 * in sponsorship credit. Mirrors the wording of the server error
 * (spend_sponsorship_credit) so the two never disagree, and turns the remedy
 * into an underlined link to the donations page.
 */
export default function CreditShortfallNotice({
  available,
  required,
  className = "",
}) {
  const short = Math.max(0, Number(required) - Number(available));

  return (
    <p
      role="alert"
      className={`mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-body text-xs text-amber-900 ${className}`}
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
      <span>
        You have ${Number(available || 0).toLocaleString()} in sponsorship
        credit but this needs ${Number(required || 0).toLocaleString()}.
        {short > 0 && (
          <> You need ${short.toLocaleString()} more &mdash;</>
        )}{" "}
        <Link
          to="/donate"
          className="font-medium text-vibrant-blue underline underline-offset-2 hover:text-hope-orange"
        >
          add money on the donations page
        </Link>{" "}
        to cover the difference.
      </span>
    </p>
  );
}
