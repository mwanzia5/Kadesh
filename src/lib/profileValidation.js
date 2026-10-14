// Validation for the donor "Profile information" form.
// Returns trimmed values plus a map of field -> error message.

const NAME_RE = /^[\p{L}][\p{L}\p{M}' .-]*$/u;
const PHONE_CHARS_RE = /^\+?[\d\s()-]+$/;

export const PROFILE_LIMITS = Object.freeze({
  name: 50,
  location: 100,
  phoneMinDigits: 7,
  phoneMaxDigits: 15,
});

function clean(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function validateProfile(form = {}) {
  const values = {
    first_name: clean(form.first_name),
    last_name: clean(form.last_name),
    phone: clean(form.phone),
    location: clean(form.location),
  };
  const errors = {};

  if (!values.first_name) errors.first_name = "First name is required.";
  else if (values.first_name.length < 2)
    errors.first_name = "First name must be at least 2 characters.";
  else if (values.first_name.length > PROFILE_LIMITS.name)
    errors.first_name = `First name must be ${PROFILE_LIMITS.name} characters or fewer.`;
  else if (!NAME_RE.test(values.first_name))
    errors.first_name =
      "Use letters only (spaces, hyphens and apostrophes are fine).";

  if (!values.last_name) errors.last_name = "Last name is required.";
  else if (values.last_name.length > PROFILE_LIMITS.name)
    errors.last_name = `Last name must be ${PROFILE_LIMITS.name} characters or fewer.`;
  else if (!NAME_RE.test(values.last_name))
    errors.last_name =
      "Use letters only (spaces, hyphens and apostrophes are fine).";

  if (values.phone) {
    const digits = values.phone.replace(/\D/g, "");
    if (!PHONE_CHARS_RE.test(values.phone))
      errors.phone = "Use digits only, with an optional + country code.";
    else if (
      digits.length < PROFILE_LIMITS.phoneMinDigits ||
      digits.length > PROFILE_LIMITS.phoneMaxDigits
    )
      errors.phone = "Enter a valid phone number, e.g. +256 700 123 456.";
  }

  if (values.location.length > PROFILE_LIMITS.location)
    errors.location = `Location must be ${PROFILE_LIMITS.location} characters or fewer.`;

  return { values, errors, isValid: Object.keys(errors).length === 0 };
}

export function profileHasChanges(values, profile) {
  return ["first_name", "last_name", "phone", "location"].some(
    (key) => (values[key] || "") !== clean(profile?.[key] || ""),
  );
}
