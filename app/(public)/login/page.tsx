"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Smartphone, Key, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"aadhaar" | "google">("aadhaar");
  const [aadhaar, setAadhaar] = useState("123456789012");
  const [otp, setOtp] = useState("123456");
  const [name, setName] = useState("Aryan Mehta");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "verifying" | "success">("form");

  const handleAadhaarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
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
        // Small delay for the success animation
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 800);
      } else {
        setError("Unexpected response from server. Please try again.");
        setStep("form");
      }
    } catch (err: any) {
      console.error("[CivicPulse] Login error:", err);
      setError(`Network error: ${err?.message || "Please check your connection and try again."}`);
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err: any) {
      setError("Google sign-in failed. Please try Aadhaar OTP instead.");
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
              Sign in once via MeriPehchan to access all government services
            </p>
          </div>

          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* Success State */}
              {step === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-10 w-10 text-success" />
                  </div>
                  <h2 className="text-lg font-bold text-navy">Identity Verified ✓</h2>
                  <p className="text-sm text-text-muted mt-1">Redirecting to dashboard...</p>
                </motion.div>
              )}

              {/* Verifying State */}
              {step === "verifying" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <Loader2 className="h-10 w-10 text-accent animate-spin mx-auto mb-4" />
                  <h2 className="text-lg font-bold text-navy">Verifying via MeriPehchan...</h2>
                  <p className="text-sm text-text-muted mt-1">Hashing Aadhaar & creating secure session</p>
                </motion.div>
              )}

              {/* Form State */}
              {step === "form" && (
                <>
                  {/* Mode Toggle */}
                  <div className="flex bg-background rounded-lg p-1">
                    <button
                      onClick={() => setMode("aadhaar")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        mode === "aadhaar"
                          ? "bg-white text-navy shadow-sm"
                          : "text-text-muted"
                      }`}
                    >
                      <Smartphone className="h-4 w-4" />
                      Aadhaar OTP
                    </button>
                    <button
                      onClick={() => setMode("google")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        mode === "google"
                          ? "bg-white text-navy shadow-sm"
                          : "text-text-muted"
                      }`}
                    >
                      <Key className="h-4 w-4" />
                      Google
                    </button>
                  </div>

                  {mode === "aadhaar" ? (
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

                      <Button
                        type="submit"
                        loading={loading}
                        className="w-full"
                        size="lg"
                      >
                        Sign In via MeriPehchan
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-4">
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
                      <Button
                        onClick={handleGoogleLogin}
                        loading={loading}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        Continue with Google
                      </Button>
                    </div>
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
