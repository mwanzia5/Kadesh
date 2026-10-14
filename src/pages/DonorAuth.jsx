import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Heart,
  Loader2,
  Mail,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import PageTransition from "@/animations/PageTransition";
import SEO from "@/components/ui/SEO";
import Container from "@/components/ui/Container";
import { useDonorAuth } from "@/context/DonorAuthContext";
import {
  getAuthErrorMessage,
  getSafeAuthRedirect,
  normalizeEmail,
  OTP_RESEND_SECONDS,
} from "@/lib/donorAuth";

const GOOGLE_ENABLED = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === "true";
const COOLDOWN_KEY = "kadesh.auth.emailRetryAt";
const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 font-body text-base text-deep-navy outline-none transition focus:border-vibrant-blue focus:ring-4 focus:ring-vibrant-blue/10 disabled:cursor-wait disabled:bg-slate-50";
// Navy button to match the sign-in page's left panel.
const primaryClass =
  "group inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#0b2342] to-[#1d3f75] px-5 py-3.5 font-body text-[15px] font-semibold tracking-[0.01em] text-white shadow-[0_14px_28px_-14px_rgba(11,35,66,0.75)] ring-1 ring-inset ring-white/10 transition-all duration-200 hover:from-[#12366d] hover:to-[#1e5bab] hover:shadow-[0_18px_32px_-14px_rgba(30,91,171,0.7)] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1e5bab] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none";

function readCooldown() {
  try {
    const value = Number(window.sessionStorage.getItem(COOLDOWN_KEY));
    return Number.isFinite(value) && value > Date.now()
      ? Math.min(value, Date.now() + OTP_RESEND_SECONDS * 1000)
      : 0;
  } catch {
    return 0;
  }
}

function hasCallbackError() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  return (
    query.has("error") ||
    query.has("error_description") ||
    hash.has("error") ||
    hash.has("error_description")
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.7-.4-4H24v7.7h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.9-3.6 6.1-8.8 6.1-14.9Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20.4 20.4 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.2H5.8a20 20 0 0 0 0 17.6l6.8-5.2Z"
      />
      <path
        fill="#EA4335"
        d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.6 19.6 0 0 0 24 4 20.4 20.4 0 0 0 5.8 15.2l6.8 5.2C14.2 15.6 18.7 12 24 12Z"
      />
    </svg>
  );
}

function AuthForm({ mode, redirectTo, initialEmail = "" }) {
  const { sendEmailCode, verifyEmailCode, signInWithGoogle, authError } =
    useDonorAuth();
  const [step, setStep] = useState("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState("");
  const [error, setError] = useState(
    () =>
      authError ||
      (hasCallbackError()
        ? "We couldn't complete sign-in. Please request a new code or try again."
        : ""),
  );
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [retryAt, setRetryAt] = useState(readCooldown);
  const [now, setNow] = useState(Date.now);
  const busyRef = useRef(false);
  const mounted = useRef(true);
  const codeInput = useRef(null);
  const emailInput = useRef(null);
  const signup = mode === "signup";
  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000));

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!retryAt || retryAt <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  useEffect(() => {
    if (step === "code") codeInput.current?.focus();
  }, [step]);

  function startCooldown() {
    const next = Date.now() + OTP_RESEND_SECONDS * 1000;
    setRetryAt(next);
    setNow(Date.now());
    try {
      // Never persist addresses or verification codes.
      window.sessionStorage.setItem(COOLDOWN_KEY, String(next));
    } catch {
      /* Server rate limits still apply if storage is unavailable. */
    }
  }

  async function requestCode(event) {
    event?.preventDefault();
    if (busyRef.current || Date.now() < retryAt) return;
    if (step === "details" && signup && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    busyRef.current = true;
    setBusy("send");
    setError("");
    setNotice("");
    const normalizedEmail = normalizeEmail(email);
    const [firstName, ...rest] = name.trim().split(/\s+/);
    try {
      await sendEmailCode({
        email: normalizedEmail,
        mode: step === "code" ? "login" : mode,
        firstName,
        lastName: rest.join(" "),
        redirectTo,
        origin: window.location.origin,
      });
      if (!mounted.current) return;
      setEmail(normalizedEmail);
      setToken("");
      startCooldown();
      setStep("code");
      setNotice(
        step === "code"
          ? "A new code was requested. Use the code from your most recent email."
          : "",
      );
      codeInput.current?.focus();
    } catch (err) {
      if (!mounted.current) return;
      setError(getAuthErrorMessage(err, "send"));
      if (err.status === 429 || err.code === "over_email_send_rate_limit")
        startCooldown();
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy("");
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    if (busyRef.current) return;
    if (!/^[0-9]{6,10}$/.test(token)) {
      setError("Enter the complete verification code from your email.");
      return;
    }
    busyRef.current = true;
    setBusy("verify");
    setError("");
    setNotice("");
    try {
      await verifyEmailCode({ email, token });
      // Redirect only when the context has received a verified session.
    } catch (err) {
      if (!mounted.current) return;
      setError(getAuthErrorMessage(err, "verify"));
      codeInput.current?.focus();
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy("");
    }
  }

  async function continueWithGoogle() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy("google");
    setError("");
    try {
      await signInWithGoogle({ redirectTo, origin: window.location.origin });
    } catch (err) {
      busyRef.current = false;
      if (!mounted.current) return;
      setError(getAuthErrorMessage(err, "google"));
      setBusy("");
    }
  }

  function changeEmail() {
    setStep("details");
    setToken("");
    setError("");
    setNotice("");
    window.setTimeout(() => emailInput.current?.focus(), 0);
  }

  function enterExistingCode() {
    if (busyRef.current || !emailInput.current?.reportValidity()) return;
    setEmail(normalizeEmail(email));
    setError("");
    setNotice("");
    setStep("code");
  }

  const loginUrl = "/login?redirect=" + encodeURIComponent(redirectTo);
  const signupUrl = "/signup?redirect=" + encodeURIComponent(redirectTo);

  return (
    <div className="mx-auto w-full max-w-md font-body">
      {step === "details" && (
        <nav
          aria-label="Account access"
          className="mb-9 grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-300 bg-white p-1.5 shadow-sm"
        >
          {[
            { label: "Log in", href: loginUrl, active: !signup },
            { label: "Create account", href: signupUrl, active: signup },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.href}
              aria-current={item.active ? "page" : undefined}
              onClick={(event) => {
                if (busy) event.preventDefault();
              }}
              className={
                "rounded-xl px-2 py-3 text-center text-[15px] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vibrant-blue " +
                (item.active
                  ? "bg-gradient-to-r from-[#0D1B3E] to-[#1a3d7a] text-white shadow-md"
                  : "text-deep-navy hover:bg-slate-100")
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      <div className="mb-7">
        {step === "code" && (
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-vibrant-blue">
            <Mail aria-hidden="true" size={23} />
          </div>
        )}
        <h1 className="font-display text-3xl font-semibold leading-tight text-deep-navy sm:text-4xl">
          {step === "code"
            ? "Check your inbox"
            : signup
              ? "Create your account"
              : "Welcome back"}
        </h1>
        <p className="mt-3 leading-relaxed text-slate-600">
          {step === "code" ? (
            <>
              {signup
                ? "Check the latest email sent to"
                : "If you have an account, check your inbox at"}
              <br />
              <strong className="break-all font-semibold text-deep-navy">
                {email}
              </strong>
              .
            </>
          ) : signup ? (
            "A simpler way to follow the difference you make."
          ) : (
            "Your giving journey continues here."
          )}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm leading-relaxed text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-blue-50 p-3.5 text-sm leading-relaxed text-blue-900"
        >
          {notice}
        </p>
      )}

      {step === "details" ? (
        <>
          {GOOGLE_ENABLED && (
            <>
              <button
                type="button"
                onClick={continueWithGoogle}
                disabled={Boolean(busy)}
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3.5 font-semibold text-deep-navy transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vibrant-blue disabled:cursor-wait disabled:opacity-50"
              >
                {busy === "google" ? (
                  <Loader2
                    size={20}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <GoogleMark />
                )}
                {busy === "google"
                  ? "Connecting to Google…"
                  : "Continue with Google"}
              </button>
              <div className="my-6 flex items-center gap-4 text-xs text-slate-500">
                <span className="h-px flex-1 bg-slate-200" />
                or continue with email
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            </>
          )}

          <form
            onSubmit={requestCode}
            className="space-y-5"
            aria-busy={Boolean(busy)}
          >
            {signup && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="mb-2 block text-sm font-semibold text-deep-navy"
                >
                  Full name
                </label>
                <input
                  id="auth-name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={Boolean(busy)}
                  placeholder="Your name"
                  className={inputClass}
                />
              </div>
            )}
            <div>
              <label
                htmlFor="auth-email"
                className="mb-2 block text-sm font-semibold text-deep-navy"
              >
                Email address
              </label>
              <input
                ref={emailInput}
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={Boolean(busy)}
                placeholder="you@example.com"
                aria-describedby="email-help"
                className={inputClass}
              />
              <p id="email-help" className="mt-2 text-sm text-slate-500">
                Get secure access by email. No password needed.
              </p>
            </div>
            <button
              type="submit"
              disabled={Boolean(busy) || remaining > 0}
              className={primaryClass}
            >
              {busy === "send" ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Sending code…
                </>
              ) : remaining > 0 ? (
                "Send another code in " + remaining + "s"
              ) : (
                <>
                  Continue with email
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5">
                    <ArrowRight size={16} aria-hidden="true" />
                  </span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={enterExistingCode}
              disabled={Boolean(busy)}
              className="min-h-10 w-full rounded-md text-sm font-semibold text-vibrant-blue hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-vibrant-blue disabled:opacity-50"
            >
              Already have a code? Enter it here
            </button>
          </form>
        </>
      ) : (
        <>
          <form
            onSubmit={verifyCode}
            className="space-y-5"
            aria-busy={Boolean(busy)}
          >
            <div>
              <label
                htmlFor="auth-code"
                className="mb-2 block text-sm font-semibold text-deep-navy"
              >
                Verification code
              </label>
              <input
                ref={codeInput}
                id="auth-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,10}"
                minLength={6}
                maxLength={10}
                required
                value={token}
                onChange={(event) =>
                  setToken(event.target.value.replace(/\D/g, "").slice(0, 10))
                }
                disabled={Boolean(busy)}
                aria-describedby="code-help"
                placeholder="Enter code"
                className={
                  inputClass +
                  " ph-no-capture text-center font-mono text-2xl tracking-[0.25em] placeholder:font-body placeholder:text-base placeholder:tracking-normal"
                }
                data-private="true"
                data-sentry-mask="true"
              />
              <p id="code-help" className="mt-2 text-sm text-slate-500">
                Use the code from your most recent email. If it contains a
                sign-in link instead, open it in this browser.
              </p>
            </div>
            <button
              type="submit"
              disabled={Boolean(busy) || !/^[0-9]{6,10}$/.test(token)}
              className={primaryClass}
            >
              {busy === "verify" ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Verifying…
                </>
              ) : (
                <>
                  {signup ? "Verify & continue" : "Verify & log in"}
                  <ArrowRight size={18} aria-hidden="true" />
                </>
              )}
            </button>
          </form>
          <div className="mt-6 space-y-3 text-center text-sm">
            <p className="leading-relaxed text-slate-500">
              Can’t find the email? Check your spam folder.
            </p>
            <button
              type="button"
              onClick={requestCode}
              disabled={Boolean(busy) || remaining > 0}
              className="min-h-10 rounded-md px-2 font-semibold text-vibrant-blue hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-vibrant-blue disabled:cursor-not-allowed disabled:text-slate-500 disabled:no-underline"
            >
              {busy === "send"
                ? "Sending code…"
                : remaining > 0
                  ? "Resend code in " + remaining + "s"
                  : "Resend code"}
            </button>
            <div>
              <button
                type="button"
                onClick={changeEmail}
                disabled={Boolean(busy)}
                className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-slate-600 hover:text-deep-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-vibrant-blue disabled:opacity-50"
              >
                <ArrowLeft size={15} aria-hidden="true" />
                Use a different email
              </button>
            </div>
            {!signup && (
              <p className="text-slate-500">
                New here?{" "}
                <Link
                  className="font-semibold text-vibrant-blue hover:underline"
                  to={signupUrl}
                >
                  Create an account
                </Link>
              </p>
            )}
          </div>
        </>
      )}

      <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-100 pt-6 text-xs text-slate-500">
        <ShieldCheck size={16} aria-hidden="true" />
        Secure access. No password to remember.
      </div>
      <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
        Need a hand?{" "}
        <Link
          to="/contact"
          className="font-semibold text-slate-700 underline underline-offset-4"
        >
          Contact our team
        </Link>
      </p>
    </div>
  );
}

export default function DonorAuth({ intent }) {
  const [searchParams] = useSearchParams();
  const { user, loading, authError } = useDonorAuth();
  const mode =
    intent || (searchParams.get("mode") === "signup" ? "signup" : "login");
  const redirectTo = getSafeAuthRedirect(searchParams.get("redirect"));
  // Guest donors arrive from the thank-you message with their email filled in.
  const initialEmail = normalizeEmail(searchParams.get("email") || "").slice(
    0,
    254,
  );

  if (!loading && user && !authError)
    return <Navigate to={redirectTo} replace />;

  return (
    <PageTransition>
      <SEO title="Sign In" description="Sign in to your Kadesh Hope Mission donor account to follow your sponsorships and giving history." />
      <section className="min-h-screen bg-[#F6F7FB] pb-12 pt-5 sm:pb-16 sm:pt-8">
        <Container>
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 rounded-md font-body text-sm text-slate-600 transition hover:text-deep-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-vibrant-blue"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Kadesh
          </Link>
          <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_70px_-30px_rgba(13,27,62,0.25)] lg:grid-cols-[0.95fr_1.05fr]">
            <aside className="relative hidden overflow-hidden bg-deep-navy px-7 py-9 text-white sm:px-12 lg:flex lg:flex-col lg:justify-between lg:py-14">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-44 -right-44 h-96 w-96 rounded-full border-[64px] border-white/[0.035]"
              />
              <div className="relative">
                <div className="mb-8 flex items-center gap-3 lg:mb-20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <Heart
                      size={21}
                      className="text-orange-300"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="font-body text-xs font-semibold uppercase leading-relaxed tracking-[0.18em]">
                    Kadesh
                    <br />
                    <span className="font-normal tracking-[0.13em] text-blue-200">
                      Hope Mission
                    </span>
                  </span>
                </div>
                <p className="mb-4 font-body text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                  Your kindness. Their future.
                </p>
                <h2 className="max-w-sm font-display text-4xl leading-[1.15] sm:text-5xl">
                  Small acts.
                  <br />
                  <span className="text-orange-300">Lasting hope.</span>
                </h2>
                <p className="mt-5 max-w-sm font-body leading-relaxed text-slate-300">
                  A place to see your generosity at work and stay connected to
                  the lives you help change.
                </p>
              </div>
              <ul className="relative mt-12 hidden space-y-5 font-body text-sm text-slate-200 lg:block">
                <li className="flex items-center gap-3">
                  <Heart
                    size={18}
                    className="text-blue-200"
                    aria-hidden="true"
                  />
                  Follow your child sponsorships
                </li>
                <li className="flex items-center gap-3">
                  <ReceiptText
                    size={18}
                    className="text-blue-200"
                    aria-hidden="true"
                  />
                  Keep your giving history in one place
                </li>
                <li className="flex items-center gap-3">
                  <Sparkles
                    size={18}
                    className="text-blue-200"
                    aria-hidden="true"
                  />
                  Continue making a difference
                </li>
              </ul>
            </aside>
            <div className="flex items-center px-6 py-9 sm:px-12 sm:py-12 lg:min-h-[680px]">
              {loading ? (
                <div
                  role="status"
                  className="flex w-full items-center justify-center gap-3 py-16 font-body text-slate-600"
                >
                  <Loader2
                    size={22}
                    className="animate-spin text-vibrant-blue"
                    aria-hidden="true"
                  />
                  Checking your account…
                </div>
              ) : (
                <AuthForm
                  key={mode + ":" + redirectTo}
                  mode={mode}
                  redirectTo={redirectTo}
                  initialEmail={initialEmail}
                />
              )}
            </div>
          </div>
          <p className="mt-7 text-center font-body text-sm text-slate-500">
            Not ready to sign in?{" "}
            <Link
              to="/projects"
              className="font-semibold text-deep-navy underline decoration-slate-300 underline-offset-4 hover:decoration-deep-navy"
            >
              Explore our work
            </Link>
          </p>
        </Container>
      </section>
    </PageTransition>
  );
}
