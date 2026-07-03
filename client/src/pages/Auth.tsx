import React, { useState } from "react";
import { useApp } from "../contexts/AppContext.js";
import { apiFetch } from "../lib/api.js";
import { Lock, Mail, User, ShieldCheck, TrendingUp, Sparkles, Key, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type AuthMode = "login" | "signup" | "forgot" | "reset";

export const Auth: React.FC = () => {
  const { login: handleLoginSuccess, addToast, t } = useApp();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<number>(26);
  const [salary, setSalary] = useState<number>(85000);
  const [riskLevel, setRiskLevel] = useState<"Low" | "Medium" | "High">("Medium");

  // OTP & Reset states
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [activeEmail, setActiveEmail] = useState(""); // cache for OTP verification

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await apiFetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (res.status === 200) {
          handleLoginSuccess(data.token, data.user);
        } else {
          addToast(data.error || "Login failed", "error");
        }
      } else if (mode === "signup") {
        const res = await apiFetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, fullName, age, salary, riskLevel }),
        });

        const data = await res.json();
        if (res.ok) {
          addToast(data.message, "success");
          handleLoginSuccess(data.token, data.user);
        } else {
          addToast(data.error || "Signup failed", "error");
        }
      } else if (mode === "forgot") {
        const res = await apiFetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        if (res.ok) {
          addToast(data.message, "success");
          setActiveEmail(data.email);
          if (data.otp) {
            setOtpCode(data.otp);
            addToast(`SANDBOX OTP: ${data.otp}`, "info");
          }
          setMode("reset");
        } else {
          addToast(data.error || "Email not registered", "error");
        }
      } else if (mode === "reset") {
        const res = await apiFetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: activeEmail, otp: otpCode, newPassword }),
        });

        const data = await res.json();
        if (res.ok) {
          addToast(data.message, "success");
          setMode("login");
          setPassword("");
        } else {
          addToast(data.error || "Failed to reset password", "error");
        }
      }
    } catch (error) {
      addToast("Network connection error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-100/90 dark:bg-slate-950 font-sans">
      {/* LEFT COLUMN: HERO MARKETING */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

        {/* Top Header */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-bold font-display shadow-md">
            FB
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight flex items-center gap-1">
              FinBuddy AI
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            </h1>
            <p className="text-[10px] text-blue-200 uppercase tracking-widest font-mono">
              IDBI Innovate 2026 Hackathon
            </p>
          </div>
        </div>

        {/* Center Pitch */}
        <div className="z-10 my-auto space-y-6">
          <h2 className="text-4xl font-extrabold font-display leading-tight tracking-tight">
            AI-Powered Personal Wealth & Wealth Management Solutions.
          </h2>
          <p className="text-blue-100/90 text-sm leading-relaxed max-w-md">
            FinBuddy AI utilizes state-of-the-art Generative AI (Gemini) to provide hyper-personalized financial planning, budget models, risk protection, and real-time support.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-300">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-blue-100">
                Custom Portfolio Modeling & Expected Return trackers
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-blue-100">
                Advanced AI-Powered anomaly tracking and Fraud indicators
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="z-10 text-xs text-blue-200 font-mono">
          © 2026 FinBuddy AI. Developed for IDBI Innovate.
        </div>
      </div>

      {/* RIGHT COLUMN: AUTH PANELS */}
      <div className="col-span-1 lg:col-span-7 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md glass-card p-8 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-center">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
              {mode === "login" && "Login to Wealth Space"}
              {mode === "signup" && "Create Premium Account"}
              {mode === "forgot" && "Reset Password Request"}
              {mode === "reset" && "Create New Password"}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {mode === "login" && "Enter your credentials to access FinBuddy"}
              {mode === "signup" && "Sign up and build your AI-personalized financial model"}
              {mode === "forgot" && "We will generate a 6-digit verification code"}
              {mode === "reset" && "Enter your 6-digit OTP code and new password"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {/* 1. FULL NAME (Signup Only) */}
            {mode === "signup" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Sallu Khan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100 transition"
                  />
                </div>
              </div>
            )}

            {/* 2. EMAIL (Login, Signup, Forgot) */}
            {(mode === "login" || mode === "signup" || mode === "forgot") && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="yourname@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100 transition"
                  />
                </div>
              </div>
            )}

            {/* 3. SIGNUP-SPECIFIC EXTRA FIELDS (Age, Salary, Risk Profile) */}
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">Age</label>
                  <input
                    type="number"
                    required
                    min={18}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">Salary (p.m.)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">Risk Tolerance</label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as any)}
                    className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100"
                  >
                    <option value="Low">Low (FDs, PPF, Bonds)</option>
                    <option value="Medium">Medium (Mutual Funds, SIPs, Hybrid)</option>
                    <option value="High">High (Direct Equities, Emerging Caps)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 4. PASSWORD (Login & Signup) */}
            {(mode === "login" || mode === "signup") && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[11px] text-blue-500 hover:underline font-semibold"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    minLength={mode === "signup" ? 8 : undefined}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100 transition"
                  />
                </div>
                {mode === "signup" && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Use at least 8 characters.
                  </p>
                )}
              </div>
            )}

            {/* 5. OTP INPUT (OTP Verification & Reset mode) */}
            {mode === "reset" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">6-Digit Verification Code</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-center font-mono tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100 transition"
                  />
                </div>
                {/* Notice banner for sandbox testing */}
                <div className="bg-blue-500/10 rounded-lg p-2.5 flex gap-2 border border-blue-500/10 mt-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-600 dark:text-blue-400">
                    <strong>Sandbox notice</strong>: For simple evaluation, the mock OTP has been pre-filled or returned in the terminal response console logs!
                  </p>
                </div>
              </div>
            )}

            {/* 6. NEW PASSWORD (Reset Mode) */}
            {mode === "reset" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 dark:text-gray-100 transition"
                  />
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Use at least 8 characters.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-md shadow-blue-600/10 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === "login" && "Log In to Account"}
                    {mode === "signup" && "Create My Account"}
                    {mode === "forgot" && "Send OTP Code"}
                    {mode === "reset" && "Change Password"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* TOGGLE MODES */}
          <div className="text-center mt-6 text-xs text-gray-500 dark:text-gray-400">
            {mode === "login" && (
              <p>
                Don't have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-blue-500 hover:underline font-semibold"
                >
                  Create one now
                </button>
              </p>
            )}
            {mode === "signup" && (
              <p>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-blue-500 hover:underline font-semibold"
                >
                  Log in here
                </button>
              </p>
            )}
            {(mode === "forgot" || mode === "reset") && (
              <button
                onClick={() => setMode("login")}
                className="text-blue-500 hover:underline font-semibold"
              >
                ← Back to Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
