"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Smartphone, Key } from "lucide-react";
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

  const handleAadhaarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        aadhaar,
        otp,
        fullName: name || "Aryan Mehta",
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid Aadhaar or OTP. Use OTP: 123456");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
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
                    <p className="text-sm text-error bg-error/5 p-3 rounded-lg">
                      {error}
                    </p>
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

              <p className="text-xs text-text-muted text-center">
                By signing in, you agree to the DPDP Act 2023 data sharing policy.
                Aadhaar numbers are never stored — only SHA-256 hashes.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
