import test from "node:test";
import assert from "node:assert/strict";
import {
  validateProfile,
  profileHasChanges,
} from "../src/lib/profileValidation.js";

const base = {
  first_name: "John",
  last_name: "Silas Kanneganti",
  phone: "",
  location: "",
};

test("valid profile passes and values are trimmed", () => {
  const r = validateProfile({ ...base, first_name: "  John  ", location: " Kampala,  Uganda " });
  assert.equal(r.isValid, true);
  assert.equal(r.values.first_name, "John");
  assert.equal(r.values.location, "Kampala, Uganda");
});

test("names are required and must be letters", () => {
  assert.match(validateProfile({ ...base, first_name: "" }).errors.first_name, /required/);
  assert.match(validateProfile({ ...base, first_name: "J" }).errors.first_name, /at least 2/);
  assert.match(validateProfile({ ...base, first_name: "J0hn" }).errors.first_name, /letters/);
  assert.match(validateProfile({ ...base, last_name: " " }).errors.last_name, /required/);
  assert.equal(validateProfile({ ...base, last_name: "O'Neil-Smith" }).isValid, true);
  assert.equal(validateProfile({ ...base, first_name: "Zoë" }).isValid, true);
});

test("phone is optional but must look like a phone number", () => {
  assert.equal(validateProfile({ ...base, phone: "+256 700 123 456" }).isValid, true);
  assert.equal(validateProfile({ ...base, phone: "(555) 123-4567" }).isValid, true);
  assert.match(validateProfile({ ...base, phone: "abc123" }).errors.phone, /digits/);
  assert.match(validateProfile({ ...base, phone: "12345" }).errors.phone, /valid phone/);
  assert.match(validateProfile({ ...base, phone: "+1234567890123456" }).errors.phone, /valid phone/);
});

test("location has a length limit", () => {
  assert.match(validateProfile({ ...base, location: "x".repeat(101) }).errors.location, /100/);
});

test("change detection ignores whitespace-only edits", () => {
  const { values } = validateProfile({ ...base, first_name: " John " });
  assert.equal(profileHasChanges(values, base), false);
  assert.equal(profileHasChanges({ ...values, phone: "0700123456" }, base), true);
});
