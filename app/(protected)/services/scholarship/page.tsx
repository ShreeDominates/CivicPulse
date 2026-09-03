"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ArrowRight, ArrowLeft, FileText, Download, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useScholarshipStore } from "@/lib/store";
import ConsentBanner from "@/components/ConsentBanner";
import DataFetchProgress from "@/components/DataFetchProgress";
import EligibilityCard from "@/components/EligibilityCard";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import GovernmentAPIBadge from "@/components/GovernmentAPIBadge";
import { Card, CardContent } from "@/components/ui/card";

const Confetti = dynamic(() => import("canvas-confetti"), { ssr: false });

const STEPS = ["Identity", "Data Fetch", "Decision", "Confirmation"];

export default function ScholarshipPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const store = useScholarshipStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const user = session?.user as any;

  // Step 1: Grant Consent
  const handleGrantConsent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/consent/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purposeCode: "SCHOLARSHIP_ELIGIBILITY",
          dataSources: [
            "Income Certificate (Income Tax Dept via API Setu)",
            "12th Board Result (CBSE via DigiLocker)",
            "Caste/Category Certificate (State Revenue Portal)",
            "Address to LGD District Code Normalization",
            "Bank Account Validation (NPCI via Razorpay)",
          ],
          expiresInDays: 7,
        }),
      });
      const data = await res.json();
      if (data.consentId) {
        store.setConsent(true, data.consentId);
        store.setCurrentStep(2);
      }
    } catch {
      setError("Failed to grant consent. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [store]);

  // Step 2: Fetch data
  const handleFetchData = useCallback(async () => {
    store.setCurrentStep(2);

    // Start all tasks as fetching simultaneously
    const tasks = ["income", "marks", "caste", "lgd", "bank"];
    tasks.forEach((id) => store.updateTaskStatus(id, "fetching"));

    // Fetch all in parallel
    const fetchIncome = async () => {
      try {
        const res = await fetch("/api/gov/fetch-income", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pan: store.panNumber || "ABCDE1234F", consentId: store.consentId }),
        });
        const data = await res.json();
        store.setIncomeData(data);
        store.updateTaskStatus(
          "income", "verified",
          `Annual Income: ₹${data.annualIncome?.toLocaleString("en-IN")} — Verified by ${data.source}`,
          "API Setu", "#1C5AA0"
        );
      } catch {
        store.updateTaskStatus("income", "failed", undefined, undefined, undefined, "Failed to fetch income data");
      }
    };

    const fetchMarks = async () => {
      try {
        const res = await fetch("/api/gov/fetch-marks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rollNumber: "23456789", year: 2025, consentId: store.consentId }),
        });
        const data = await res.json();
        store.setMarksData(data);
        store.updateTaskStatus(
          "marks", "verified",
          `Score: ${data.percentage}% — Roll ${data.rollNumber} — Digitally Signed by CBSE ✓`,
          "DigiLocker", "#EB7820"
        );
      } catch {
        store.updateTaskStatus("marks", "failed", undefined, undefined, undefined, "Failed to fetch marks");
      }
    };

    const fetchCaste = async () => {
      // Simulated - in production, call API Setu
      await new Promise((r) => setTimeout(r, 800));
      const data = { category: "OBC", certificateId: "MH/CST/2024/887123", source: "State Revenue Portal" };
      store.setCasteData(data);
      store.updateTaskStatus(
        "caste", "verified",
        `Category: ${data.category} — Certificate ${data.certificateId}`,
        "API Setu", "#1C5AA0"
      );
    };

    const fetchLGD = async () => {
      try {
        const res = await fetch("/api/gov/lgd-lookup?name=pune&state=maharashtra");
        const data = await res.json();
        store.setLgdData(data);
        store.updateTaskStatus(
          "lgd", "verified",
          `District: ${data.districtName} (LGD Code: ${data.districtCode}, State: ${data.stateName} ${data.stateCode})`,
          "LGD", "#22964A"
        );
      } catch {
        store.updateTaskStatus("lgd", "failed", undefined, undefined, undefined, "LGD lookup failed");
      }
    };

    const fetchBank = async () => {
      try {
        const res = await fetch("/api/gov/validate-bank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountNumber: store.bankAccount || "12345678901234",
            ifsc: store.bankIfsc || "SBIN0001234",
            name: user?.name || "Aryan Mehta",
            consentId: store.consentId,
          }),
        });
        const data = await res.json();
        store.setBankData(data);
        store.updateTaskStatus(
          "bank", "verified",
          `Bank: ${data.bankName} — Account XXXX${data.accountLast4} — Name matches ✓`,
          "Razorpay", "#2D89EF"
        );
      } catch {
        store.updateTaskStatus("bank", "failed", undefined, undefined, undefined, "Bank validation failed");
      }
    };

    // Run all in parallel
    await Promise.allSettled([fetchIncome(), fetchMarks(), fetchCaste(), fetchLGD(), fetchBank()]);

    // Check results and proceed
    setTimeout(() => {
      const updatedTasks = useScholarshipStore.getState().tasks;
      const allVerified = updatedTasks.every((t) => t.status === "verified");
      if (allVerified) {
        // Run eligibility
        runEligibility();
      }
    }, 500);
  }, [store, user]);

  // Auto-trigger data fetch when step changes to 2
  const fetchStartedRef = useRef(false);
  useEffect(() => {
    if (store.currentStep === 2 && !fetchStartedRef.current && store.tasks.every((t) => t.status === "waiting")) {
      fetchStartedRef.current = true;
      handleFetchData();
    }
  }, [store.currentStep, store.tasks]);

  const runEligibility = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications/scholarship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pan: store.panNumber || "ABCDE1234F",
          aadhaar: store.aadhaarNumber || "123456789012",
          bankAccount: store.bankAccount || "12345678901234",
          bankIfsc: store.bankIfsc || "SBIN0001234",
          consentId: store.consentId,
          districtName: "Pune",
        }),
      });
      const data = await res.json();
      if (data.eligibility) {
        store.setEligibilityResult(data.eligibility);
        store.setApplicationRef(data.application?.ref);
        store.setCurrentStep(3);

        if (data.eligibility.approved) {
          // Fire confetti!
          setTimeout(() => {
            if (typeof window !== "undefined") {
              import("canvas-confetti").then((confetti) => {
                confetti.default({
                  particleCount: 150,
                  spread: 80,
                  origin: { y: 0.3 },
                  colors: ["#22964A", "#EB7820", "#1C5AA0", "#FFD700"],
                });
              });
            }
          }, 500);
        }
      }
    } catch (err: any) {
      setError("Failed to process application. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [store]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  store.currentStep > i + 1
                    ? "bg-success text-white"
                    : store.currentStep === i + 1
                    ? "bg-saffron text-white"
                    : "bg-card-border text-text-muted"
                }`}
              >
                {store.currentStep > i + 1 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span className="hidden sm:inline ml-2 text-sm font-medium text-navy">
                {step}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`hidden sm:block w-12 h-0.5 mx-3 ${
                    store.currentStep > i + 1 ? "bg-success" : "bg-card-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-navy">
          Higher Education Scholarship — {STEPS[store.currentStep - 1]}
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Zero document upload required. All data fetched from government APIs.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Identity Confirmation */}
        {store.currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    value={user?.name || "Aryan Mehta"}
                    disabled
                    verified
                  />
                  <div className="flex items-center gap-2">
                    <GovernmentAPIBadge apiName="MeriPehchan" color="#22964A" />
                    <span className="text-xs text-success font-medium">
                      Verified by MeriPehchan ✓
                    </span>
                  </div>
                  <Input
                    label="Mobile Number"
                    value={user?.mobile || "+91 98765 43210"}
                    disabled
                  />
                  <Input
                    label="Date of Birth"
                    value="15 March 2007"
                    disabled
                  />
                </div>

                <hr className="border-card-border" />

                <Input
                  label="PAN Number (for income verification)"
                  placeholder="ABCDE1234F"
                  value={store.panNumber}
                  onChange={(e) => store.setPanNumber(e.target.value.toUpperCase())}
                />
                <Input
                  label="DigiLocker-linked Aadhaar"
                  placeholder="1234 5678 9012"
                  value={store.aadhaarNumber}
                  onChange={(e) => store.setAadhaarNumber(e.target.value.replace(/\s/g, ""))}
                  maxLength={12}
                />
                <Input
                  label="Bank Account Number"
                  placeholder="Account number"
                  value={store.bankAccount}
                  onChange={(e) => store.setBankAccount(e.target.value)}
                />
                <Input
                  label="IFSC Code"
                  placeholder="SBIN0001234"
                  value={store.bankIfsc}
                  onChange={(e) => store.setBankIfsc(e.target.value.toUpperCase())}
                />
              </CardContent>
            </Card>

            {!store.consentGranted ? (
              <ConsentBanner
                purpose="Scholarship eligibility verification — Income, Marks, Caste, Address, Bank Account"
                dataSources={[
                  "Income Certificate (Income Tax Dept via API Setu)",
                  "12th Board Result (CBSE via DigiLocker)",
                  "Caste/Category (State Revenue Portal)",
                  "Address to LGD District Code (LGD)",
                  "Bank Account (NPCI via Razorpay)",
                ]}
                expiresInDays={7}
                onAuthorize={handleGrantConsent}
                onCancel={() => {}}
                loading={loading}
              />
            ) : (
              <Button onClick={() => store.setCurrentStep(2)} className="w-full" size="lg">
                Continue to Data Fetching <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </motion.div>
        )}

        {/* STEP 2: Live Data Fetching */}
        {store.currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardContent className="pt-6">
                <DataFetchProgress tasks={store.tasks} />
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => store.setCurrentStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              {store.tasks.filter((t) => t.status === "verified").length === 5 && (
                <Button onClick={runEligibility} loading={loading} className="flex-1">
                  Evaluate Eligibility <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 3: Eligibility Decision */}
        {store.currentStep === 3 && store.eligibilityResult && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <EligibilityCard
              approved={store.eligibilityResult.approved}
              criteria={store.eligibilityResult.criteria}
              scholarshipAmount={store.eligibilityResult.scholarshipAmount}
              applicationRef={store.applicationRef || undefined}
            />

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => store.setCurrentStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => store.setCurrentStep(4)} className="flex-1">
                View Confirmation <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Confirmation */}
        {store.currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card className={store.eligibilityResult?.approved ? "border-success" : "border-error"}>
              <CardContent className="pt-6 text-center">
                <CheckCircle className={`h-16 w-16 mx-auto mb-4 ${store.eligibilityResult?.approved ? "text-success" : "text-error"}`} />
                <h2 className="text-2xl font-bold text-navy mb-2">
                  Application {store.eligibilityResult?.approved ? "Submitted" : "Not Eligible"}
                </h2>
                <p className="text-text-muted mb-4">Reference: {store.applicationRef}</p>

                {store.eligibilityResult?.approved && (
                  <div className="bg-success/5 p-4 rounded-lg mb-4">
                    <p className="text-success font-semibold text-lg">
                      Scholarship Amount: ₹48,000
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                      Amount will be transferred to your Aadhaar-linked bank account within 24 hours via PFMS
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <Button onClick={() => router.push("/dashboard")} variant="secondary">
                    Track Application
                  </Button>
                  <Button onClick={() => router.push("/")}>
                    Apply for Another Service
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-4 bg-error/5 border border-error/20 rounded-lg p-4 text-sm text-error">
          {error}
        </div>
      )}
    </div>
  );
}
