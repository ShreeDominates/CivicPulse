"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield, Smartphone, AlertCircle, Loader2, CheckCircle,
  Mail, Lock, Eye, EyeOff, ArrowRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Mock Google users for demo
const DEMO_GOOGLE_USERS: Record<string, { name: string; password: string; role: string; mobile: string }> = {
  "priya@civicpulse.gov.in": { name: "Priya Sharma", password: "demo1234", role: "CITIZEN", mobile: "+919876543210" },
  "admin@civicpulse.gov.in": { name: "Rajesh Kumar (Admin)", password: "admin123", role: "ADMIN", mobile: "+919876543211" },
  "demo@google.com": { name: "Demo Citizen", password: "demo1234", role: "CITIZEN", mobile: "+919876543212" },
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"aadhaar" | "google">("aadhaar");

  // Aadhaar state
  const [aadhaar, setAadhaar] = useState("123456789012");
  const [otp, setOtp] = useState("123456");
  const [name, setName] = useState("Aryan Mehta");

  // Google state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Shared state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "verifying" | "success">("form");

  // ─── Aadhaar Login ───────────────────────────────────────────
  const handleAadhaarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanAadhaar = aadhaar.replace(/\s/g, "");
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      setError("Aadhaar must be exactly 12 digits.");
      return;
    }
    if (otp !== "123456") {
      setError("Invalid OTP. Use 123456 for demo.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    setStep("verifying");

    try {
      const result = await signIn("credentials", {
        aadhaar: cleanAadhaar,
        otp,
        fullName: name.trim() || "Aryan Mehta",
        redirect: false,
      });

      if (result?.error) {
        setError(`Authentication failed: ${result.error}`);
        setStep("form");
      } else if (result?.ok) {
        setStep("success");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 800);
      } else {
        setError("Unexpected response from server. Please try again.");
        setStep("form");
      }
    } catch (err: any) {
      setError(`Network error: ${err?.message || "Please check your connection."}`);
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  // ─── Google Login (Mock OAuth2 Authorization Flow) ──────────
  const handleGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate email
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    const user = DEMO_GOOGLE_USERS[email.toLowerCase()];
    if (!user) {
      setError("No account found with this email. Try demo@google.com / demo1234");
      return;
    }
    if (user.password !== password) {
      setError("Incorrect password. Check the demo credentials below.");
      return;
    }

    setLoading(true);
    setStep("verifying");

    try {
      // Simulate the Google OAuth2 authorization code flow:
      // 1. Validate credentials (done above)
      // 2. Exchange authorization code for tokens (simulated)
      // 3. Fetch user profile from Google (simulated)
      // 4. Create session via NextAuth credentials provider

      const result = await signIn("credentials", {
        aadhaar: "000000000000", // Google users don't have Aadhaar
        otp: "123456",
        fullName: user.name,
        redirect: false,
      });

      if (result?.error) {
        setError(`Authorization failed: ${result.error}`);
        setStep("form");
      } else if (result?.ok) {
        setStep("success");
        setTimeout(() => {
          router.push(user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard");
          router.refresh();
        }, 800);
      } else {
        setError("Unexpected response. Please try again.");
        setStep("form");
      }
    } catch (err: any) {
      setError(`Network error: ${err?.message || "Please check your connection."}`);
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Shield className="h-12 w-12 text-saffron mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-navy">Welcome to CivicPulse</h1>
            <p className="text-text-muted text-sm mt-1">
              Sign in to access all government services
            </p>
          </div>

          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* ─── Success State ─── */}
              {step === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-10 w-10 text-success" />
                  </div>
                  <h2 className="text-lg font-bold text-navy">Authorization Complete ✓</h2>
                  <p className="text-sm text-text-muted mt-1">
                    {mode === "google" ? "OAuth2 session established" : "Identity verified via MeriPehchan"}
                  </p>
                  <p className="text-xs text-text-muted mt-2">Redirecting to dashboard...</p>
                </motion.div>
              )}

              {/* ─── Verifying State ─── */}
              {step === "verifying" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <Loader2 className="h-10 w-10 text-accent animate-spin mx-auto mb-4" />
                  <h2 className="text-lg font-bold text-navy">
                    {mode === "google" ? "Completing OAuth2 Authorization..." : "Verifying via MeriPehchan..."}
                  </h2>
                  <p className="text-sm text-text-muted mt-1">
                    {mode === "google"
                      ? "Exchanging authorization code for session tokens"
                      : "Hashing Aadhaar & creating secure session"}
                  </p>
                </motion.div>
              )}

              {/* ─── Form State ─── */}
              {step === "form" && (
                <>
                  {/* Mode Toggle */}
                  <div className="flex bg-background rounded-lg p-1">
                    <button
                      onClick={() => { setMode("aadhaar"); setError(""); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        mode === "aadhaar"
                          ? "bg-white text-navy shadow-sm"
                          : "text-text-muted hover:text-navy"
                      }`}
                    >
                      <Smartphone className="h-4 w-4" />
                      Aadhaar OTP
                    </button>
                    <button
                      onClick={() => { setMode("google"); setError(""); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        mode === "google"
                          ? "bg-white text-navy shadow-sm"
                          : "text-text-muted hover:text-navy"
                      }`}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google Sign-In
                    </button>
                  </div>

                  {/* ─── Aadhaar Form ─── */}
                  {mode === "aadhaar" && (
                    <form onSubmit={handleAadhaarLogin} className="space-y-4">
                      <Input
                        label="Full Name"
                        placeholder="Aryan Mehta"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <Input
                        label="Aadhaar Number"
                        placeholder="1234 5678 9012"
                        value={aadhaar}
                        onChange={(e) => setAadhaar(e.target.value.replace(/\s/g, ""))}
                        maxLength={12}
                      />
                      <Input
                        label="OTP (use 123456 for demo)"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                      />

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2 text-sm text-error bg-error/5 p-3 rounded-lg border border-error/20"
                        >
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </motion.div>
                      )}

                      <Button type="submit" loading={loading} className="w-full" size="lg">
                        Sign In via MeriPehchan
                      </Button>
                    </form>
                  )}

                  {/* ─── Google OAuth2 Form ─── */}
                  {mode === "google" && (
                    <form onSubmit={handleGoogleLogin} className="space-y-4">
                      {/* Google-styled header */}
                      <div className="flex items-center gap-3 pb-2">
                        <svg className="h-6 w-6" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-navy">Sign in with Google</p>
                          <p className="text-xs text-text-muted">OAuth2 Authorization Code Flow</p>
                        </div>
                      </div>

                      {/* Email field */}
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1.5">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                          <input
                            type="email"
                            placeholder="demo@google.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-card-border bg-white pl-10 pr-3 py-2.5 text-sm text-navy placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>
                      </div>

                      {/* Password field */}
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1.5">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-card-border bg-white pl-10 pr-10 py-2.5 text-sm text-navy placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* OAuth2 flow indicator */}
                      <div className="bg-background rounded-lg p-3 space-y-1.5">
                        <p className="text-xs text-text-muted font-medium">OAuth2 Authorization Flow:</p>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <ArrowRight className="h-3 w-3 text-accent" />
                          <span>1. Authenticate with Google Identity</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <ArrowRight className="h-3 w-3 text-accent" />
                          <span>2. Receive authorization code</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <ArrowRight className="h-3 w-3 text-accent" />
                          <span>3. Exchange code for session tokens</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <ArrowRight className="h-3 w-3 text-accent" />
                          <span>4. Create CivicPulse session (JWT)</span>
                        </div>
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2 text-sm text-error bg-error/5 p-3 rounded-lg border border-error/20"
                        >
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </motion.div>
                      )}

                      <Button type="submit" loading={loading} className="w-full" size="lg" variant="outline">
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Authorize via Google
                      </Button>

                      {/* Demo credentials hint */}
                      <div className="bg-background rounded-lg p-3 space-y-1">
                        <p className="text-xs text-text-muted font-medium">Demo Accounts:</p>
                        <p className="text-xs text-text-muted">• <strong>demo@google.com</strong> / demo1234 (Citizen)</p>
                        <p className="text-xs text-text-muted">• <strong>priya@civicpulse.gov.in</strong> / demo1234 (Citizen)</p>
                        <p className="text-xs text-text-muted">• <strong>admin@civicpulse.gov.in</strong> / admin123 (Admin)</p>
                      </div>
                    </form>
                  )}

                  <div className="bg-background rounded-lg p-3 space-y-1">
                    <p className="text-xs text-text-muted text-center">
                      🔒 Aadhaar numbers are never stored — only SHA-256 hashes.
                    </p>
                    <p className="text-xs text-text-muted text-center">
                      DPDP Act 2023 compliant.{" "}
                      <a href="/about" className="text-accent underline">Learn more</a>
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
