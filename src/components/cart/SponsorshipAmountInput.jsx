import { useRef, useState } from "react";

// Controlled amount field that lets donors type any number of digits freely
// (any whole-number length, up to 2 decimals) and only normalizes (rounds +
// enforces the minimum) on blur — so a live `Number(...)`/round on every
// keystroke never fights the user mid-typing. Shared by the navbar cart
// stepper and the donation page cart cards so both behave identically.
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export default function SponsorshipAmountInput({
  value,
  onCommit,
  min = 0.01,
  className = "",
  "aria-label": ariaLabel = "Amount",
}) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const committed = useRef(value != null && value !== "" ? Number(value) : null);

  if (value != null && value !== "") {
    committed.current = Number(value);
  }

  const handleFocus = () => {
    setFocused(true);
    setDraft(committed.current != null ? String(committed.current) : "");
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw === "" || /^\d{0,12}(\.\d{0,2})?$/.test(raw)) {
      setDraft(raw);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    const num = Number(draft);
    if (draft === "" || Number.isNaN(num)) {
      setDraft(committed.current != null ? String(committed.current) : "");
      return;
    }
    const next = Math.max(min, round2(num));
    setDraft(String(next));
    if (next !== committed.current) onCommit(next);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={focused ? draft : committed.current != null ? String(committed.current) : ""}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      aria-label={ariaLabel}
      className={className}
    />
  );
}