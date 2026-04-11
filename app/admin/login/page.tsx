"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, ArrowRight, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    }
  }, [step]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send OTP");
        setLoading(false);
        return;
      }

      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }

      setStep("otp");
      setCountdown(300); // 5 minute countdown
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, "").split("").slice(0, 6);
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setLoading(true);

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid OTP");
        setLoading(false);
        return;
      }

      router.push("/admin");
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.every((d) => d !== "") && step === "otp") {
      handleVerifyOTP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleResend = async () => {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.devOtp) setDevOtp(data.devOtp);
      if (res.ok) setCountdown(300);
      else setError(data.error || "Failed to resend");
    } catch {
      setError("Failed to resend OTP");
    }

    setLoading(false);
  };

  const formatCountdown = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-warm-900 via-warm-800 to-warm-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(227,24,55,0.15),_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(249,115,22,0.1),_transparent_60%)]" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent-orange/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.3 }}
          >
            <span className="text-4xl font-extrabold tracking-tight text-white">
              Hello<span className="text-primary">Pizza</span>
            </span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-warm-400 text-sm font-medium tracking-wide"
          >
            Admin Dashboard
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          layout
          className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-white/20"
          style={{ boxShadow: "0 24px 64px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)" }}
        >
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-warm-900">Welcome Back</h2>
                    <p className="text-warm-500 text-sm">Enter your admin email to continue</p>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSendOTP}>
                  <div className="mb-5">
                    <label className="text-xs font-semibold text-warm-600 mb-2 block uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                      <input
                        suppressHydrationWarning
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@hellopizza.com"
                        required
                        autoFocus
                        className="w-full pl-11 pr-4 py-3.5 bg-warm-50 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all placeholder:text-warm-400 border border-warm-200"
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full bg-gradient-to-r from-primary to-[#cc1530] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:shadow-[0_8px_24px_-4px_rgba(227,24,55,0.4)]"
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending Code...
                      </>
                    ) : (
                      <>
                        Send Verification Code
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-warm-900">Verify Code</h2>
                    <p className="text-warm-500 text-sm">
                      Sent to <span className="font-semibold text-warm-700">{email}</span>
                    </p>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                {devOtp && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                    <span className="font-bold">Dev Mode OTP:</span> {devOtp}
                  </div>
                )}

                <form onSubmit={handleVerifyOTP}>
                  <label className="text-xs font-semibold text-warm-600 mb-3 block uppercase tracking-wider">
                    Enter 6-Digit Code
                  </label>
                  <div className="flex gap-2 mb-5">
                    {otp.map((digit, i) => (
                      <input
                        suppressHydrationWarning
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-full aspect-square max-w-[56px] text-center text-2xl font-black bg-warm-50 rounded-2xl border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all"
                      />
                    ))}
                  </div>

                  {countdown > 0 && (
                    <div className="flex items-center justify-center gap-2 mb-4 text-sm text-warm-500">
                      <KeyRound className="w-3.5 h-3.5" />
                      Code expires in <span className="font-bold text-primary">{formatCountdown(countdown)}</span>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading || otp.some((d) => !d)}
                    className="w-full bg-gradient-to-r from-primary to-[#cc1530] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:shadow-[0_8px_24px_-4px_rgba(227,24,55,0.4)]"
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        Verify & Login
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="flex items-center justify-between mt-5">
                  <button
                    onClick={() => { setStep("email"); setError(""); setOtp(["", "", "", "", "", ""]); }}
                    className="text-sm text-warm-500 hover:text-warm-700 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Change email
                  </button>
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-sm text-primary hover:text-[#cc1530] font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-center text-xs text-warm-500 mt-6">
          Secured with OTP verification • Hello Pizza © 2026
        </p>
      </motion.div>
    </div>
  );
}
