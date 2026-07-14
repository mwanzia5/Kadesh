import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { FacebookIcon, TwitterIcon, YoutubeIcon, LinkedinIcon } from "@/components/ui/SocialIcons";
import PageTransition from "@/animations/PageTransition";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const inputClasses =
  "w-full px-4 py-3 rounded-lg border border-soft-accent bg-white font-body text-on-background placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/50 focus:border-vibrant-blue transition-all";

export default function Contact() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (data) => {
    alert("Thank you for reaching out! We'll get back to you soon.");
    reset();
  };

  return (
    <PageTransition>
      <Section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="We'd love to hear from you"
            subtitle="Reach out for sponsorship, donations, volunteering, or partnerships"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-16">
            {/* Contact Form */}
            <div className="lg:col-span-7">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-on-background mb-2">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      className={inputClasses}
                      {...register("firstName")}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-on-background mb-2">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      className={inputClasses}
                      {...register("lastName")}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-on-background mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    className={inputClasses}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-on-background mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    className={inputClasses}
                    {...register("subject")}
                  >
                    <option value="">Select a subject</option>
                    <option value="Sponsorship">Sponsorship</option>
                    <option value="Donation">Donation</option>
                    <option value="Volunteering">Volunteering</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Press">Press</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-500">{errors.subject.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-on-background mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="Tell us how you'd like to get involved..."
                    className={inputClasses}
                    {...register("message")}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>
                  )}
                </div>

                <Button type="submit" className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send Message
                </Button>
              </form>
            </div>

            {/* Info Cards */}
            <div className="lg:col-span-5 space-y-6">
              {/* Head Office Card */}
              <div className="bg-navy text-white rounded-2xl p-8">
                <h3 className="text-xl font-display font-bold mb-6">Head Office — Uganda</h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Address</p>
                      <p className="font-body">Kadesh Hope Mission of Africa</p>
                      <p className="font-body">Bulemezi Block 30, Plot No. 106,</p>
                      <p className="font-body">Nakaseta (Mpande), Kalule, Uganda.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Phone</p>
                      <p className="font-body">+256-753407379</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Email</p>
                      <p className="font-body">kadeshhope.africa@gmail.com</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regional Office Card */}
              <div className="bg-cream rounded-2xl p-8">
                <h3 className="text-xl font-display font-bold text-navy mb-6">Regional Office — Kenya</h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-navy" />
                    </div>
                    <div>
                      <p className="text-sm text-navy/60">Address</p>
                      <p className="font-body text-navy">Kadesh Hope Mission of Africa</p>
                      <p className="font-body text-navy">Uasin Gishu, 146, Near Lexo Junction,</p>
                      <p className="font-body text-navy">14/1272, Eldoret, Kenya.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-navy" />
                    </div>
                    <div>
                      <p className="text-sm text-navy/60">Phone</p>
                      <p className="font-body text-navy">(+254) 706 959 383</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-navy" />
                    </div>
                    <div>
                      <p className="text-sm text-navy/60">Email</p>
                      <p className="font-body text-navy">kadesh.kenya@gmail.com</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media Card */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h3 className="text-xl font-display font-bold text-navy mb-6">Follow Us</h3>
                <div className="flex gap-4">
                  {[
                    { icon: FacebookIcon, href: "#", label: "Facebook" },
                    { icon: TwitterIcon, href: "#", label: "Twitter" },
                    { icon: YoutubeIcon, href: "#", label: "YouTube" },
                    { icon: LinkedinIcon, href: "#", label: "LinkedIn" },
                  ].map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center hover:bg-vibrant-blue transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Google Map */}
          <div className="mt-16 rounded-2xl overflow-hidden shadow-sm">
            <iframe
              title="Kadesh Hope Mission - Head Office Uganda"
              src="https://www.google.com/maps?q=Nakaseta+Mpande+Kalule+Uganda&output=embed"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
            />
          </div>
        </div>
      </Section>
    </PageTransition>
  );
}
