"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, CheckCircle, Building2, Loader2, Heart, Wallet, Home, FileText } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import GovernmentAPIBadge from "@/components/GovernmentAPIBadge";

const DEPARTMENTS = [
  { name: "Ministry of Social Justice", service: "National Social Assistance Programme (NSAP)", icon: Heart, color: "#7C3AED" },
  { name: "EPFO", service: "Employee Pension Scheme / EPF Withdrawal", icon: Wallet, color: "#1C5AA0" },
  { name: "State Social Welfare Dept", service: "Old Age Pension (Maharashtra State Scheme)", icon: Users, color: "#EB7820" },
  { name: "Ayushman Bharat", service: "PM-JAY Health Insurance (₹5 Lakh Cover)", icon: FileText, color: "#22964A" },
];

export default function SeniorCitizenPensionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<"form" | "fetching" | "result">("form");
  const [fetchStatus, setFetchStatus] = useState<"waiting" | "fetching" | "verified" | "failed">("waiting");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [hasPension, setHasPension] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  const user = session?.user as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) return;

    setStep("fetching");
    setFetchStatus("fetching");

    try {
      await fetch("/api/consent/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purposeCode: "SENIOR_CITIZEN_PENSION",
          dataSources: [
            "Aadhaar Identity & Age Verification (UIDAI)",
            "Income Certificate (ITR via API Setu)",
            "Bank Account Verification (NPCI)",
            "EPFO Member Records (EPFO Database)",
          ],
          expiresInDays: 7,
        }),
      });
    } catch {
      // Continue with demo flow
    }

    await new Promise((r) => setTimeout(r, 2500));
    setFetchStatus("verified");
    setTimeout(() => setStep("result"), 500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-[#7C3AED]/10">
            <Users className="h-6 w-6 text-[#7C3AED]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Senior Citizen Pension & Benefits</h1>
            <p className="text-text-muted text-sm">
              Zero document uploads. Auto-apply to 4 pension and welfare departments.
            </p>
          </div>
        </div>
      </div>

      {step === "form" && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-[#7C3AED] font-medium">
                👴 This application auto-fetches your age verification from Aadhaar, income from ITR, and EPFO records to determine pension eligibility.
              </p>
            </div>

            <Input label="Full Name" value={user?.name || ""} disabled verified />
            <div className="flex items-center gap-2">
              <GovernmentAPIBadge apiName="MeriPehchan" color="#22964A" />
              <span className="text-xs text-success font-medium">Verified by MeriPehchan ✓</span>
            </div>

            <Input
              label="Date of Birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
            <Input
              label="Annual Household Income (₹)"
              placeholder="e.g., 120000"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Existing Pension/Scheme</label>
              <select
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent"
                value={hasPension}
                onChange={(e) => setHasPension(e.target.value)}
              >
                <option value="">Select...</option>
                <option value="none">No existing pension</option>
                <option value="epfo">EPFO Pension (small amount)</option>
                <option value="state">State Old Age Pension</option>
                <option value="central">Central Government Pension</option>
              </select>
            </div>

            <hr className="border-card-border" />

            <div className="bg-background rounded-lg p-4 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-card-border"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                />
                <span className="text-sm text-text-muted">
                  I authorize CivicPulse to verify my identity and age via Aadhaar, fetch my income records from ITR, check my EPFO status, and evaluate eligibility for NSAP, State Old Age Pension, and Ayushman Bharat. This consent expires in 7 days. Compliant with DPDP Act 2023.
                </span>
              </label>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!consentChecked || !dateOfBirth || !annualIncome || !hasPension}
              className="w-full"
              size="lg"
            >
              <Users className="mr-2 h-4 w-4" /> Apply — Auto-Apply to All Departments
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "fetching" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-lg font-bold text-navy mb-4">Fetching Data from Government APIs</h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                  {fetchStatus === "fetching" && <Loader2 className="h-5 w-5 text-accent animate-spin" />}
                  {fetchStatus === "verified" && <CheckCircle className="h-5 w-5 text-success" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy">Verifying Age via Aadhaar (UIDAI)</p>
                    <p className="text-xs text-text-muted">Age verification against DOB on Aadhaar</p>
                  </div>
                  {fetchStatus === "verified" && <GovernmentAPIBadge apiName="UIDAI" color="#DC2626" />}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                  {fetchStatus === "fetching" && <Loader2 className="h-5 w-5 text-accent animate-spin" />}
                  {fetchStatus === "verified" && <CheckCircle className="h-5 w-5 text-success" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy">Fetching Income from ITR (API Setu)</p>
                    <p className="text-xs text-text-muted">Income Tax Return verification</p>
                  </div>
                  {fetchStatus === "verified" && <GovernmentAPIBadge apiName="API Setu" color="#1C5AA0" />}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                  {fetchStatus === "fetching" && <Loader2 className="h-5 w-5 text-accent animate-spin" />}
                  {fetchStatus === "verified" && <CheckCircle className="h-5 w-5 text-success" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy">Checking EPFO Member Status</p>
                    <p className="text-xs text-text-muted">EPFO Unified Portal Database</p>
                  </div>
                  {fetchStatus === "verified" && <GovernmentAPIBadge apiName="EPFO" color="#7C3AED" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === "result" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-success/5 border border-success/20 rounded-xl p-6 text-center mb-6">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
            <h2 className="text-xl font-bold text-success">
              Applications Submitted to 4 Departments
            </h2>
            <p className="text-text-muted text-sm mt-1">All verifications done automatically</p>
          </div>

          <Card className="border-success">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-text-muted">Estimated Monthly Pension</p>
              <p className="text-3xl font-bold text-success">₹3,000 / month</p>
              <p className="text-xs text-text-muted mt-1">NSAP + State Old Age Pension combined</p>
            </CardContent>
          </Card>

          {DEPARTMENTS.map((dept, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}>
              <Card>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${dept.color}15` }}>
                    <dept.icon className="h-5 w-5" style={{ color: dept.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-navy text-sm">{dept.name}</p>
                    <p className="text-xs text-text-muted">{dept.service}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="text-xs text-success font-medium">Applied</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          <div className="flex gap-3 mt-6">
            <Button onClick={() => router.push("/dashboard")} variant="secondary" className="flex-1">
              Track Applications
            </Button>
            <Button onClick={() => router.push("/")} className="flex-1">
              Apply for Another Service
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
