import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/supabase/client";
import Button from "@/components/ui/Button";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mode, setMode] = useState("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) {
      setMode("recovery");
      return;
    }
    const queryMode = searchParams.get("mode");
    if (queryMode === "recovery") {
      setMode("recovery");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    navigate("/admin");
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        forgotEmail,
        { redirectTo: `${window.location.origin}/admin/login?mode=recovery` }
      );
      if (resetError) throw resetError;
      setMode("check-email");
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      setSuccess("Password updated! Redirecting to login...");
      setTimeout(() => {
        setMode("login");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = (newMode) => {
    setError("");
    setSuccess("");
    setLoading(false);
    setMode(newMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] to-[#1a2f5a] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#F37021] flex items-center justify-center mx-auto mb-4">
                <span className="font-display font-bold text-xl text-white">KH</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-[#0D1B3E]">
                {mode === "forgot-password"
                  ? "Reset Password"
                  : mode === "recovery"
                    ? "Set New Password"
                    : mode === "check-email"
                      ? "Check Your Email"
                      : "Admin Login"}
              </h1>
              <p className="text-gray-500 font-body mt-1">
                {mode === "forgot-password"
                  ? "Enter your email to receive a reset link"
                  : mode === "recovery"
                    ? "Choose a new password for your account"
                    : mode === "check-email"
                      ? "If an account exists, we've sent a reset link"
                      : "Sign in to manage your site"}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-sm"
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                {success}
              </motion.div>
            )}

            {mode === "check-email" ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-display text-xl font-bold text-[#0D1B3E]">Check your email</h3>
                <p className="font-body text-gray-500 leading-relaxed">
                  We sent a password reset link to{" "}
                  <strong className="text-[#0D1B3E]">{forgotEmail}</strong>.
                  Check your inbox and follow the link to set a new password.
                </p>
                <Button
                  variant="primary"
                  onClick={() => handleModeSwitch("login")}
                  className="mt-2"
                >
                  Return to Login
                </Button>
              </div>
            ) : mode === "recovery" ? (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
                      placeholder="Min 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    "Set New Password"
                  )}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => handleModeSwitch("login")}
                    className="text-sm text-gray-500 hover:text-[#2563EB] transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </button>
                </div>
              </form>
            ) : mode === "forgot-password" ? (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
                      placeholder="admin@kadeshhope.org"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => handleModeSwitch("login")}
                    className="text-sm text-gray-500 hover:text-[#2563EB] transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </button>
                </div>
              </form>
            ) : (
              <>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
                  placeholder="admin@kadeshhope.org"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-body font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => { handleModeSwitch("forgot-password"); setForgotEmail(email); }}
              className="text-sm text-gray-500 hover:text-[#2563EB] transition-colors"
            >
              Forgot your password?
            </button>
          </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
