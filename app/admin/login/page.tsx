"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, ArrowRight, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";
import { useAdminStore } from "@/store/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAdmin } = useAdminStore();
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

      setAdmin(data.admin);
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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-white">
      {/* Premium Light Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(227,24,55,0.08),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(249,115,22,0.05),_transparent_50%)]" />
      
      {/* Subtle floating grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* Animated glowing orbs */}
      <motion.div 
        animate={{ y: [0, -20, 0], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" 
      />
      <motion.div 
        animate={{ y: [0, 20, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent-orange/10 rounded-full blur-[80px]" 
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.3 }}
            className="inline-flex items-center justify-center p-4 bg-white/5 rounded-3xl backdrop-blur-md border border-white/10 shadow-2xl mb-4"
          >
            <ShieldCheck className="w-10 h-10 text-primary" strokeWidth={1.5} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-4xl font-black tracking-tight text-warm-900 mb-1">
              Admin <span className="text-primary">Portal</span>
            </h1>
            <p className="text-warm-500 text-sm font-medium tracking-wide uppercase">
              Hello Pizza Secure Access
            </p>
          </motion.div>
        </div>

        {/* Card */}
        <motion.div
          layout
          className="bg-white/80 backdrop-blur-2xl rounded-[2rem] p-8 border border-warm-200 relative overflow-hidden"
          style={{ boxShadow: "0 24px 64px -12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,1)" }}
        >
          {/* Subtle card inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
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
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
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
                    className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSendOTP}>
                  <div className="mb-6">
                    <label className="text-xs font-semibold text-warm-500 mb-2 block uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
                      <input
                        suppressHydrationWarning
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@hellopizza.com"
                        required
                        autoFocus
                        className="w-full pl-12 pr-4 py-4 bg-warm-50 rounded-2xl text-warm-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all placeholder:text-warm-300 border border-warm-200 shadow-inner"
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full bg-gradient-to-r from-primary to-[#cc1530] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_8px_32px_-8px_rgba(227,24,55,0.4)] relative overflow-hidden group"
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <span className="relative flex items-center gap-2">
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending Code...
                        </>
                      ) : (
                        <>
                          Send Verification Code
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
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
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
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
                    className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium"
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
                  <label className="text-xs font-semibold text-warm-500 mb-3 block uppercase tracking-wider text-center">
                    Enter 6-Digit Code
                  </label>
                  <div className="flex gap-2 mb-6 justify-center">
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
                        className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black bg-warm-50 text-warm-900 rounded-2xl border border-warm-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white transition-all shadow-inner"
                      />
                    ))}
                  </div>

                  {countdown > 0 && (
                    <div className="flex items-center justify-center gap-2 mb-6 text-sm text-warm-500">
                      <KeyRound className="w-4 h-4" />
                      Code expires in <span className="font-bold text-primary">{formatCountdown(countdown)}</span>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading || otp.some((d) => !d)}
                    className="w-full bg-gradient-to-r from-primary to-[#cc1530] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_8px_32px_-8px_rgba(227,24,55,0.4)] relative overflow-hidden group"
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <span className="relative flex items-center gap-2">
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
                    </span>
                  </motion.button>
                </form>

                <div className="flex items-center justify-between mt-6 px-1">
                  <button
                    onClick={() => { setStep("email"); setError(""); setOtp(["", "", "", "", "", ""]); }}
                    className="text-sm text-warm-500 hover:text-warm-700 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Change email
                  </button>
                  <button
                    onClick={handleResend}
                    disabled={loading || countdown > 0}
                    className="text-sm text-primary hover:text-[#cc1530] transition-colors font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-center text-xs text-warm-500 mt-6 font-medium">
          Secured with OTP verification • Hello Pizza © 2026
        </p>
      </motion.div>
    </div>
  );
}
