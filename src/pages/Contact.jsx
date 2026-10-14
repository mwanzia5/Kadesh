import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  MessageCircle,
  Clock3,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  FacebookIcon,
  TwitterIcon,
  YoutubeIcon,
  LinkedinIcon,
} from "@/components/ui/SocialIcons";
import { useSendMessage } from "@/hooks/useContact";
import PageTransition from "@/animations/PageTransition";
import SEO from "@/components/ui/SEO";
import { SITE_CONFIG } from "@/constants";
import Container from "@/components/ui/Container";
import ScrollReveal from "@/components/ui/ScrollReveal";

const offices = {
  uganda: {
    label: "Uganda",
    flag: "🇺🇬",
    name: "Head Office — Uganda",
    address: [
      "Kadesh Hope Mission of Africa",
      "Bulemezi Block 30, Plot No. 106,",
      "Nakaseta (Mpande), Kalule, Uganda.",
    ],
    phone: "+254 733 959 383",
    phoneHref: "tel:+254733959383",
    email: "kadeshhope.africa@gmail.com",
    mapQuery: "Nakaseta+Mpande+Kalule+Uganda",
  },
};

const subjects = [
  "Sponsorship Question",
  "Donation Question",
  "Volunteering",
  "Partnership",
  "Press Inquiry",
  "Other",
];

// Add the real page addresses in src/constants (SITE_CONFIG.social).
// Icons without an address are hidden instead of linking nowhere.
const socialLinks = [
  { icon: FacebookIcon, label: "Facebook", href: SITE_CONFIG.social?.facebook },
  { icon: TwitterIcon, label: "X (Twitter)", href: SITE_CONFIG.social?.twitter },
  { icon: YoutubeIcon, label: "YouTube", href: SITE_CONFIG.social?.youtube },
  { icon: LinkedinIcon, label: "LinkedIn", href: SITE_CONFIG.social?.linkedin },
].filter(({ href }) => href && href !== "#");

export default function Contact() {
  const [status, setStatus] = useState("idle");
  const [activeOffice] = useState("uganda");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const sendMessageMutation = useSendMessage();
  const office = offices[activeOffice];

  const validateField = (name, rawValue) => {
    const value = rawValue.trim();

    if (name === "firstName" || name === "lastName") {
      const label = name === "firstName" ? "First name" : "Last name";

      if (!value) return `${label} is required.`;
      if (value.length < 2) return `${label} must contain at least 2 characters.`;
      if (value.length > 50) return `${label} must be 50 characters or fewer.`;
      if (!/^[\\p{L}\\p{M}][\\p{L}\\p{M}' -]*$/u.test(value)) {
        return `${label} can contain only letters, spaces, apostrophes, and hyphens.`;
      }

      return "";
    }

    if (name === "email") {
      if (!value) return "Email address is required.";
      if (value.length > 254) return "Email address is too long.";
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(value)) {
        return "Please enter a valid email address.";
      }

      return "";
    }

    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name in fieldErrors && fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    if (name in fieldErrors) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = {
      firstName: validateField("firstName", form.firstName),
      lastName: validateField("lastName", form.lastName),
      email: validateField("email", form.email),
    };

    setFieldErrors(validationErrors);

    if (Object.values(validationErrors).some(Boolean)) {
      return;
    }

    setStatus("submitting");

    try {
      const { error } = await sendMessageMutation.mutateAsync({
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        subject: form.subject,
        message: form.message,
      });

      if (error) {
        console.error("[Contact] sendMessage returned error:", error);
        setStatus("error");
        setTimeout(() => setStatus("idle"), 6000);
      } else {
        setStatus("success");
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          subject: "",
          message: "",
        });
        setFieldErrors({
          firstName: "",
          lastName: "",
          email: "",
        });
        setTimeout(() => setStatus("idle"), 4000);
      }
    } catch (mutationError) {
      console.error("[Contact] mutateAsync threw:", mutationError);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[#e5dccb] bg-[#fffdf8] px-4 py-3.5 font-body text-[15px] text-deep-navy outline-none transition placeholder:text-[#9b9488] focus:border-[#c38a00] focus:bg-white focus:ring-4 focus:ring-[#c38a00]/10";

  return (
    <PageTransition>
      <SEO title="Contact Us" description="Contact Kadesh Hope Mission about sponsorship, partnership, volunteering, or donations. We typically respond within 2 business days." />
      <main className="overflow-hidden bg-[#fffdf8]">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-[#08243a] pt-32 pb-24 sm:pt-36 sm:pb-28">
          <div className="pointer-events-none absolute -left-28 top-10 h-80 w-80 rounded-full border border-white/[0.06]" />
          <div className="pointer-events-none absolute -right-24 -top-20 h-96 w-96 rounded-full border border-[#d3a32b]/15" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#245a72]/10 blur-3xl" />

          <Container className="relative">
            <ScrollReveal>
              <div className="mx-auto max-w-4xl text-center">
                <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 font-body text-xs font-bold uppercase tracking-[0.2em] text-[#f0cd72] backdrop-blur-sm">
                  <Sparkles className="h-4 w-4" />
                  Contact Kadesh Hope Mission
                </div>

                <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
                  Every Conversation Can
                  <span className="block text-[#f0cd72]">Begin Meaningful Change</span>
                </h1>

                <p className="mx-auto mt-6 max-w-2xl font-body text-base leading-8 text-white/70 sm:text-lg">
                  Whether you are exploring sponsorship, volunteering, partnership,
                  or simply want to learn more about our work, we would be glad to
                  hear from you.
                </p>
              </div>
            </ScrollReveal>
          </Container>

          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
            <svg
              viewBox="0 0 1440 90"
              preserveAspectRatio="none"
              className="block h-[48px] w-[calc(100%+1.3px)] sm:h-[68px]"
            >
              <path
                d="M0 42C250 82 420 18 690 38C980 60 1160 76 1440 22V90H0Z"
                fill="#fffdf8"
              />
            </svg>
          </div>
        </section>

        {/* Main contact area */}
        <section className="relative py-16 sm:py-20 lg:py-24">
          <div className="pointer-events-none absolute left-[-110px] top-28 h-64 w-64 rounded-full border border-[#d9bd7c]/20" />
          <div className="pointer-events-none absolute right-[-100px] bottom-8 h-72 w-72 rounded-full border border-[#d9bd7c]/20" />

          <Container className="relative">
            <div className="grid items-start gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10">
              {/* Contact details */}
              <ScrollReveal direction="left">
                <div className="space-y-6">
                  <div className="rounded-[2rem] bg-[#0b2d47] p-7 text-white shadow-[0_22px_54px_rgba(11,45,71,.16)] sm:p-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[#f0cd72]">
                      <MessageCircle className="h-5 w-5" />
                    </div>

                    <p className="mt-6 font-body text-xs font-bold uppercase tracking-[0.18em] text-[#f0cd72]">
                      Get in touch
                    </p>
                    <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-white">
                      We are here to connect, listen, and help.
                    </h2>
                    <p className="mt-4 font-body text-sm leading-7 text-white/[0.68] sm:text-base">
                      Reach our team directly for questions about our programs,
                      sponsorships, partnerships, donations, or ways to get involved.
                    </p>

                    <div className="mt-8 divide-y divide-white/10">
                      <a
                        href={`mailto:${office.email}`}
                        className="group flex items-center gap-4 py-5 first:pt-0"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[#f0cd72] transition group-hover:bg-[#c38a00] group-hover:text-white">
                          <Mail className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-body text-[11px] font-bold uppercase tracking-[0.16em] text-white/[0.45]">
                            Email
                          </span>
                          <span className="mt-1 block break-all font-body text-sm font-semibold text-white sm:text-base">
                            {office.email}
                          </span>
                        </span>
                        <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-white/[0.35] transition group-hover:text-[#f0cd72]" />
                      </a>

                      <a
                        href={office.phoneHref}
                        className="group flex items-center gap-4 py-5"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[#f0cd72] transition group-hover:bg-[#c38a00] group-hover:text-white">
                          <Phone className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block font-body text-[11px] font-bold uppercase tracking-[0.16em] text-white/[0.45]">
                            Phone
                          </span>
                          <span className="mt-1 block font-body text-sm font-semibold text-white sm:text-base">
                            {office.phone}
                          </span>
                        </span>
                        <ArrowUpRight className="ml-auto h-4 w-4 text-white/[0.35] transition group-hover:text-[#f0cd72]" />
                      </a>

                      <div className="flex items-center gap-4 pt-5">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[#f0cd72]">
                          <Clock3 className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-body text-[11px] font-bold uppercase tracking-[0.16em] text-white/[0.45]">
                            Response
                          </p>
                          <p className="mt-1 font-body text-sm font-semibold text-white sm:text-base">
                            We typically respond within 2 business days.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {socialLinks.length > 0 && (
                  <div className="rounded-[1.6rem] border border-[#eadfc8] bg-[#fff8e8] p-6">
                    <p className="font-body text-xs font-bold uppercase tracking-[0.16em] text-[#a7770c]">
                      Follow our work
                    </p>
                    <p className="mt-2 font-body text-sm leading-6 text-[#6b6255]">
                      Stay connected with the stories, programs, and communities
                      behind our mission.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      {socialLinks.map(({ icon: Icon, label, href }) => (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={label}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dfd2b8] bg-white text-[#0b2d47] transition hover:-translate-y-0.5 hover:border-[#c38a00] hover:bg-[#0b2d47] hover:text-white"
                        >
                          <Icon className="h-5 w-5" />
                        </a>
                      ))}
                    </div>
                  </div>
                  )}
                </div>
              </ScrollReveal>

              {/* Contact form */}
              <ScrollReveal direction="right" delay={0.08}>
                <div className="rounded-[2rem] border border-[#eadfc8] bg-white p-6 shadow-[0_20px_54px_rgba(55,43,20,.08)] sm:p-8 lg:p-10">
                  <div className="mb-8">
                    <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-[#a7770c]">
                      Send a message
                    </p>
                    <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-deep-navy sm:text-4xl">
                      Tell us how we can help.
                    </h2>
                    <p className="mt-3 max-w-xl font-body text-sm leading-7 text-[#6b6255] sm:text-base">
                      Complete the form below and the right member of our team will
                      get back to you.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="firstName"
                          className="mb-2 block font-body text-sm font-semibold text-deep-navy"
                        >
                          First name
                        </label>
                        <input
                          required
                          type="text"
                          id="firstName"
                          name="firstName"
                          placeholder="Your first name"
                          value={form.firstName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          maxLength={50}
                          autoComplete="given-name"
                          aria-invalid={Boolean(fieldErrors.firstName)}
                          aria-describedby={fieldErrors.firstName ? "firstName-error" : undefined}
                          className={`${inputClass} ${
                            fieldErrors.firstName
                              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                              : ""
                          }`}
                        />
                        {fieldErrors.firstName && (
                          <p
                            id="firstName-error"
                            role="alert"
                            className="mt-1.5 font-body text-xs text-red-600"
                          >
                            {fieldErrors.firstName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="lastName"
                          className="mb-2 block font-body text-sm font-semibold text-deep-navy"
                        >
                          Last name
                        </label>
                        <input
                          required
                          type="text"
                          id="lastName"
                          name="lastName"
                          placeholder="Your last name"
                          value={form.lastName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          maxLength={50}
                          autoComplete="family-name"
                          aria-invalid={Boolean(fieldErrors.lastName)}
                          aria-describedby={fieldErrors.lastName ? "lastName-error" : undefined}
                          className={`${inputClass} ${
                            fieldErrors.lastName
                              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                              : ""
                          }`}
                        />
                        {fieldErrors.lastName && (
                          <p
                            id="lastName-error"
                            role="alert"
                            className="mt-1.5 font-body text-xs text-red-600"
                          >
                            {fieldErrors.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block font-body text-sm font-semibold text-deep-navy"
                      >
                        Email address
                      </label>
                      <input
                        required
                        type="email"
                        id="email"
                        name="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={254}
                        autoComplete="email"
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? "email-error" : undefined}
                        className={`${inputClass} ${
                          fieldErrors.email
                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                            : ""
                        }`}
                      />
                      {fieldErrors.email && (
                        <p
                          id="email-error"
                          role="alert"
                          className="mt-1.5 font-body text-xs text-red-600"
                        >
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="mb-2 block font-body text-sm font-semibold text-deep-navy"
                      >
                        How can we help?
                      </label>
                      <div className="relative">
                        <select
                          id="subject"
                          name="subject"
                          value={form.subject}
                          onChange={handleChange}
                          required
                          className={`${inputClass} appearance-none pr-12`}
                        >
                          <option value="" disabled>
                            Select a subject
                          </option>
                          {subjects.map((subject) => (
                            <option key={subject} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d7569]" />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="mb-2 block font-body text-sm font-semibold text-deep-navy"
                      >
                        Message
                      </label>
                      <textarea
                        required
                        id="message"
                        name="message"
                        placeholder="Tell us a little more..."
                        rows={6}
                        value={form.message}
                        onChange={handleChange}
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={status === "submitting"}
                        className="group inline-flex min-w-[210px] items-center justify-between gap-4 rounded-full bg-[#0b2d47] px-2.5 py-2.5 pl-6 font-body text-sm font-bold text-white shadow-[0_14px_34px_rgba(11,45,71,.20)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#123f5e] hover:shadow-[0_18px_40px_rgba(11,45,71,.26)] focus:outline-none focus:ring-4 focus:ring-[#c38a00]/15 disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0 sm:min-w-[230px]"
                      >
                        <span>{status === "submitting" ? "Sending..." : "Send Message"}</span>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c38a00] text-white shadow-sm transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-105">
                          {status === "submitting" ? (
                            <Loader2 className="h-4.5 w-4.5 animate-spin" />
                          ) : (
                            <Send className="h-4.5 w-4.5" />
                          )}
                        </span>
                      </button>
                    </div>

                    {status === "success" && (
                      <div
                        role="status"
                        className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 font-body text-sm text-emerald-700"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        Thanks for reaching out! We will respond within 2 business days.
                      </div>
                    )}

                    {status === "error" && (
                      <div
                        role="alert"
                        className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 font-body text-sm text-red-700"
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        Something went wrong. Please try again or email us directly.
                      </div>
                    )}
                  </form>
                </div>
              </ScrollReveal>
            </div>
          </Container>
        </section>

        {/* Office + map */}
        <section className="border-y border-[#eee4d2] bg-[#fff8eb] py-16 sm:py-20 lg:py-24">
          <Container>
            <ScrollReveal>
              <div className="mx-auto max-w-3xl text-center">
                <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-[#a7770c]">
                  Where to find us
                </p>
                <h2 className="mt-3 font-display text-4xl font-bold text-deep-navy sm:text-5xl">
                  Our Head Office
                </h2>
                <p className="mx-auto mt-4 max-w-2xl font-body text-base leading-7 text-[#625a4d] sm:text-lg">
                  Visit or contact our team at our Uganda head office.
                </p>
              </div>
            </ScrollReveal>

            <div className="mt-12 overflow-hidden rounded-[2rem] border border-[#eadfc8] bg-white shadow-[0_18px_48px_rgba(55,43,20,.08)]">
              <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
                <ScrollReveal direction="left" className="h-full">
                  <div className="flex h-full flex-col justify-center p-7 sm:p-9 lg:p-10">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff4d7] px-3.5 py-1.5 font-body text-xs font-bold uppercase tracking-[0.14em] text-[#946900]">
                      <span aria-hidden="true">{office.flag}</span>
                      {office.label}
                    </div>

                    <h3 className="mt-5 font-display text-3xl font-bold leading-tight text-deep-navy">
                      {office.name}
                    </h3>

                    <div className="mt-6 flex gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0b2d47] text-white">
                        <MapPin className="h-5 w-5" />
                      </span>
                      <div className="space-y-1 font-body text-sm leading-6 text-[#625a4d] sm:text-base">
                        {office.address.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                    </div>

                    <div className="mt-7 space-y-3 border-t border-[#eee4d2] pt-6">
                      <a
                        href={office.phoneHref}
                        className="flex items-center gap-3 font-body text-sm font-semibold text-deep-navy transition hover:text-[#a7770c]"
                      >
                        <Phone className="h-4 w-4 text-[#c38a00]" />
                        {office.phone}
                      </a>
                      <a
                        href={`mailto:${office.email}`}
                        className="flex items-center gap-3 break-all font-body text-sm font-semibold text-deep-navy transition hover:text-[#a7770c]"
                      >
                        <Mail className="h-4 w-4 shrink-0 text-[#c38a00]" />
                        {office.email}
                      </a>
                    </div>
                  </div>
                </ScrollReveal>

                <div className="min-h-[340px] border-t border-[#eadfc8] lg:min-h-[430px] lg:border-l lg:border-t-0">
                  <iframe
                    title={`Kadesh Hope Mission - ${office.name}`}
                    src={`https://www.google.com/maps?q=${office.mapQuery}&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: "100%" }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-full min-h-[340px] w-full lg:min-h-[430px]"
                  />
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </PageTransition>
  );
}
