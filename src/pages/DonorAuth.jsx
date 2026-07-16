import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Heart, Mail, Lock, User, Phone, MapPin, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

import PageTransition from "@/animations/PageTransition";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { useDonorAuth } from "@/context/DonorAuthContext";

export default function DonorAuth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useDonorAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    location: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        await signUp({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          location: form.location,
        });
      } else {
        await signIn({ email: form.email, password: form.password });
      }
      navigate("/donate");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-deep-navy py-28">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-vibrant-blue/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-hope-orange/20 blur-3xl" />
        </div>

        <Container className="relative z-10">
          <div className="max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10"
            >
              <div className="w-16 h-16 rounded-2xl bg-hope-orange/10 flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-hope-orange" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
                {mode === "signup" ? "Create Your Account" : "Welcome Back"}
              </h1>
              <p className="font-body text-body-lg text-white/70">
                {mode === "signup"
                  ? "Sign up to start making a difference through your donations"
                  : "Log in to continue your generous giving"}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl p-8 md:p-10 shadow-xl"
            >
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === "signup" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
                      <input
                        required
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={form.firstName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-soft-accent focus:ring-2 focus:ring-vibrant-blue focus:outline-none font-body text-on-background"
                      />
                    </div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
                      <input
                        required
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={form.lastName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-soft-accent focus:ring-2 focus:ring-vibrant-blue focus:outline-none font-body text-on-background"
                      />
                    </div>
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-soft-accent focus:ring-2 focus:ring-vibrant-blue focus:outline-none font-body text-on-background"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password (min 6 characters)"
                    minLength={6}
                    value={form.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-soft-accent focus:ring-2 focus:ring-vibrant-blue focus:outline-none font-body text-on-background"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-deep-navy transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {mode === "signup" && (
                  <>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        value={form.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-soft-accent focus:ring-2 focus:ring-vibrant-blue focus:outline-none font-body text-on-background"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
                      <input
                        type="text"
                        name="location"
                        placeholder="City, Country"
                        value={form.location}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-soft-accent focus:ring-2 focus:ring-vibrant-blue focus:outline-none font-body text-on-background"
                      />
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  variant="orange"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      {mode === "signup" ? "Creating Account..." : "Logging in..."}
                    </>
                  ) : (
                    <>
                      <Heart className="h-5 w-5 mr-2" />
                      {mode === "signup" ? "Create Account & Start Giving" : "Log In to Donate"}
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="font-body text-sm text-on-surface-variant">
                  {mode === "signup" ? (
                    <>
                      Already have an account?{" "}
                      <button
                        onClick={() => { setMode("login"); setError(""); }}
                        className="text-vibrant-blue font-medium hover:underline"
                      >
                        Log in
                      </button>
                    </>
                  ) : (
                    <>
                      Don&apos;t have an account?{" "}
                      <button
                        onClick={() => { setMode("signup"); setError(""); }}
                        className="text-vibrant-blue font-medium hover:underline"
                      >
                        Sign up
                      </button>
                    </>
                  )}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center mt-8"
            >
              <Link
                to="/donate"
                className="font-body text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                Skip for now &rarr;
              </Link>
            </motion.div>
          </div>
        </Container>
      </section>
    </PageTransition>
  );
}
