import { useState } from "react";
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { FacebookIcon, TwitterIcon, YoutubeIcon, LinkedinIcon } from "@/components/ui/SocialIcons";
import PageTransition from "@/animations/PageTransition";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import ScrollReveal from "@/components/ui/ScrollReveal";

const offices = {
  uganda: {
    label: "Uganda",
    flag: "\uD83C\uDDFA\uD83C\uDDEC",
    name: "Head Office \u2014 Uganda",
    address: ["Kadesh Hope Mission of Africa", "Bulemezi Block 30, Plot No. 106,", "Nakaseta (Mpande), Kalule, Uganda."],
    phone: "+256 753 407 379",
    phoneHref: "tel:+256753407379",
    email: "kadeshhope.africa@gmail.com",
    mapQuery: "Nakaseta+Mpande+Kalule+Uganda",
  },
  kenya: {
    label: "Kenya",
    flag: "\uD83C\uDDF0\uD83C\uDDEA",
    name: "Regional Office \u2014 Kenya",
    address: ["Kadesh Hope Mission of Africa", "Uasin Gishu, 146, Near Lexo Junction,", "14/1272, Eldoret, Kenya."],
    phone: "+254 706 959 383",
    phoneHref: "tel:+254706959383",
    email: "kadesh.kenya@gmail.com",
    mapQuery: "Uasin+Gishu+Near+Lexo+Junction+Eldoret+Kenya",
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

export default function Contact() {
  const [status, setStatus] = useState("idle");
  const [activeOffice, setActiveOffice] = useState("uganda");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("submitting");
    setTimeout(() => {
      setStatus("success");
      setForm({ firstName: "", lastName: "", email: "", subject: "", message: "" });
      setTimeout(() => setStatus("idle"), 4000);
    }, 900);
  };

  const office = offices[activeOffice];

  return (
    <PageTransition>
      <Section className="pt-32 pb-20 px-6 md:px-16">
        <Container>
          {/* Header */}
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="font-body text-label-bold text-vibrant-blue uppercase tracking-widest mb-4 block">
                Contact Us
              </span>
              <h1 className="font-display text-headline-lg md:text-display-lg-mobile text-deep-navy mb-4">
                We&#39;d love to hear from you
              </h1>
              <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                Questions about sponsorship, donations, volunteering, or partnerships &mdash; reach out and our team will respond soon.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-12 gap-12">
            {/* Contact Form */}
            <ScrollReveal className="lg:col-span-7">
              <div className="bg-white rounded-2xl border border-soft-accent p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      required
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={form.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-soft-accent focus:ring-2 focus:ring-vibrant-blue focus:outline-none font-body"
                    />
                    <input
                      required
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={form.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-soft-accent focus:ring-2 focus:ring-vibrant-blue focus:outline-none font-body"
                    />
                  </div>
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-soft-accent focus:ring-2 focus:ring-vibrant-blue focus:outline-none font-body"
                  />
                  <div className="relative">
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-soft-accent focus:ring-2 focus:ring-vibrant-blue focus:outline-none font-body text-on-surface-variant appearance-none"
                    >
                      <option value="" disabled>
                        Subject
                      </option>
                      {subjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant pointer-events-none" />
                  </div>
                  <textarea
                    required
                    name="message"
                    placeholder="Your message"
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-soft-accent focus:ring-2 focus:ring-vibrant-blue focus:outline-none font-body resize-none"
                  />
                  <Button
                    type="submit"
                    disabled={status === "submitting"}
                    variant="orange"
                    size="lg"
                    className="w-full"
                  >
                    {status === "submitting" ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>

                  {status === "success" && (
                    <div
                      role="status"
                      className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Thanks for reaching out! We will respond within 2 business days.
                    </div>
                  )}
                  {status === "error" && (
                    <div
                      role="alert"
                      className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      Something went wrong. Please try again or email us directly.
                    </div>
                  )}
                </form>
              </div>
            </ScrollReveal>

            {/* Info Cards */}
            <ScrollReveal delay={0.2} className="lg:col-span-5 space-y-6">
              {/* Get in Touch Card */}
              <div className="bg-deep-navy text-white rounded-2xl p-8">
                <h3 className="font-display text-headline-md mb-6">Get in Touch</h3>
                <ul className="space-y-5">
                  <li className="flex gap-4">
                    <Mail className="h-5 w-5 text-hope-orange shrink-0 mt-0.5" />
                    <div>
                      <p className="font-body text-label-bold opacity-70 mb-1">EMAIL</p>
                      <p className="font-body text-body-md">info@kadeshhopemission.org</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <Phone className="h-5 w-5 text-hope-orange shrink-0 mt-0.5" />
                    <div>
                      <p className="font-body text-label-bold opacity-70 mb-1">PHONE</p>
                      <p className="font-body text-body-md">+243 000 000 000</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <MapPin className="h-5 w-5 text-hope-orange shrink-0 mt-0.5" />
                    <div>
                      <p className="font-body text-label-bold opacity-70 mb-1">REGIONS</p>
                      <p className="font-body text-body-md">Democratic Republic of Congo &middot; Uganda &middot; Kenya</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Social Card */}
              <div className="bg-surface rounded-2xl p-8 border border-soft-accent">
                <h4 className="font-display text-headline-md text-deep-navy mb-4">Follow Our Work</h4>
                <div className="flex gap-4">
                  {[
                    { icon: FacebookIcon, label: "Facebook" },
                    { icon: TwitterIcon, label: "Twitter" },
                    { icon: YoutubeIcon, label: "YouTube" },
                    { icon: LinkedinIcon, label: "LinkedIn" },
                  ].map(({ icon: Icon, label }) => (
                    <a
                      key={label}
                      href="#"
                      aria-label={label}
                      className="w-11 h-11 rounded-full bg-vibrant-blue/10 text-vibrant-blue flex items-center justify-center hover:bg-vibrant-blue hover:text-white transition-all"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Office Toggle + Map */}
          <ScrollReveal delay={0.3} className="mt-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="font-display text-headline-md text-deep-navy">
                Our Offices
              </h2>
              <div className="flex gap-2">
                {Object.entries(offices).map(([key, o]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveOffice(key)}
                    aria-pressed={activeOffice === key}
                    className={`px-5 py-2.5 rounded-xl font-body text-label-bold transition-all ${
                      activeOffice === key
                        ? "bg-deep-navy text-white shadow-lg"
                        : "bg-white text-deep-navy border border-soft-accent hover:bg-surface"
                    }`}
                  >
                    <span className="mr-2">{o.flag}</span>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Office details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl border border-soft-accent p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activeOffice === "uganda" ? "bg-deep-navy text-white" : "bg-vibrant-blue/10 text-vibrant-blue"
                  }`}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-deep-navy">
                    {office.name}
                  </h3>
                </div>
                <div className="space-y-3 font-body text-body-md text-on-surface-variant">
                  {office.address.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                  <div className="flex items-center gap-2 pt-2">
                    <Phone className="h-4 w-4 text-hope-orange" />
                    <a href={office.phoneHref} className="hover:text-vibrant-blue transition-colors">
                      {office.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-hope-orange" />
                    <a href={`mailto:${office.email}`} className="hover:text-vibrant-blue transition-colors">
                      {office.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden shadow-sm border border-soft-accent">
                <iframe
                  title={`Kadesh Hope Mission - ${office.name}`}
                  src={`https://www.google.com/maps?q=${office.mapQuery}&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "250px" }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                />
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>
    </PageTransition>
  );
}
