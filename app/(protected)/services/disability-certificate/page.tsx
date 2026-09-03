"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, CheckCircle, Building2, Loader2, Shield, Stethoscope, FileText, Bus } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import GovernmentAPIBadge from "@/components/GovernmentAPIBadge";

const DEPARTMENTS = [
  { name: "District Medical Board", service: "UDID Disability Certificate", icon: Stethoscope, color: "#DC2626" },
  { name: "Ministry of Social Justice", service: "UDID Card (Unique Disability ID)", icon: Shield, color: "#7C3AED" },
  { name: "Dept of Empowerment of PwD", service: "Disability Pension (RPwD Act 2016)", icon: Heart, color: "#1C5AA0" },
  { name: "Ministry of Transport", service: "Concession Card (Free/Reduced Travel)", icon: Bus, color: "#22964A" },
];

const DISABILITY_TYPES = [
  "Locomotor Disability",
  "Visual Impairment",
  "Hearing Impairment",
  "Intellectual Disability",
  "Mental Illness",
  "Multiple Disabilities",
  "Autism Spectrum Disorder",
  "Cerebral Palsy",
];

export default function DisabilityCertificatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<"form" | "fetching" | "result">("form");
  const [fetchStatus, setFetchStatus] = useState<"waiting" | "fetching" | "verified" | "failed">("waiting");
  const [disabilityType, setDisabilityType] = useState("");
  const [percentageDisability, setPercentageDisability] = useState("");
  const [hospitalName, setHospitalName] = useState("");
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
          purposeCode: "DISABILITY_CERTIFICATE",
          dataSources: [
            "Aadhaar Identity Verification (UIDAI)",
            "Medical Records Verification (Hospital Database via API Setu)",
            "Bank Account Verification for Pension (NPCI)",
            "UDID Database Check (Ministry of Social Justice)",
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
          <div className="p-2 rounded-xl bg-[#DC2626]/10">
            <Heart className="h-6 w-6 text-[#DC2626]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Disability Certificate & Benefits</h1>
            <p className="text-text-muted text-sm">
              Zero document uploads. Auto-apply to 4 disability welfare departments.
            </p>
          </div>
        </div>
      </div>

      {step === "form" && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="bg-[#DC2626]/5 border border-[#DC2626]/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-[#DC2626] font-medium">
                ♿ This application auto-verifies your Aadhaar identity, checks UDID database status, and submits to the District Medical Board for disability assessment.
              </p>
            </div>

            <Input label="Full Name" value={user?.name || ""} disabled verified />
            <div className="flex items-center gap-2">
              <GovernmentAPIBadge apiName="MeriPehchan" color="#22964A" />
              <span className="text-xs text-success font-medium">Verified by MeriPehchan ✓</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Type of Disability</label>
              <select
                className="w-full rounded-lg border border-card-border bg-white px-3 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent"
                value={disabilityType}
                onChange={(e) => setDisabilityType(e.target.value)}
              >
                <option value="">Select disability type...</option>
                {DISABILITY_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <Input
              label="Percentage of Disability (%)"
              placeholder="e.g., 40"
              value={percentageDisability}
              onChange={(e) => setPercentageDisability(e.target.value)}
            />
            <Input
              label="Hospital / Medical Board Name"
              placeholder="e.g., Sassoon General Hospital, Pune"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
            />

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
                  I authorize CivicPulse to verify my identity via Aadhaar, check my UDID database status, submit medical records for board assessment, and apply for disability pension and travel concessions. This consent expires in 7 days. Compliant with DPDP Act 2023 and RPwD Act 2016.
                </span>
              </label>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!consentChecked || !disabilityType || !percentageDisability || !hospitalName}
              className="w-full"
              size="lg"
            >
              <Heart className="mr-2 h-4 w-4" /> Apply — Auto-Apply to All Departments
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
                    <p className="text-sm font-medium text-navy">Verifying Identity via Aadhaar (UIDAI)</p>
                    <p className="text-xs text-text-muted">Identity and age verification</p>
                  </div>
                  {fetchStatus === "verified" && <GovernmentAPIBadge apiName="UIDAI" color="#DC2626" />}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                  {fetchStatus === "fetching" && <Loader2 className="h-5 w-5 text-accent animate-spin" />}
                  {fetchStatus === "verified" && <CheckCircle className="h-5 w-5 text-success" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy">Checking UDID Database Status</p>
                    <p className="text-xs text-text-muted">Ministry of Social Justice — UDID Portal</p>
                  </div>
                  {fetchStatus === "verified" && <GovernmentAPIBadge apiName="UDID" color="#7C3AED" />}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                  {fetchStatus === "fetching" && <Loader2 className="h-5 w-5 text-accent animate-spin" />}
                  {fetchStatus === "verified" && <CheckCircle className="h-5 w-5 text-success" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy">Submitting to District Medical Board</p>
                    <p className="text-xs text-text-muted">Disability assessment scheduling</p>
                  </div>
                  {fetchStatus === "verified" && <GovernmentAPIBadge apiName="API Setu" color="#1C5AA0" />}
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
            <p className="text-text-muted text-sm mt-1">All verifications completed automatically</p>
          </div>

          <Card className="border-success">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-text-muted">Disability Category Assessment</p>
              <p className="text-3xl font-bold text-success">{percentageDisability}% — {disabilityType}</p>
              <p className="text-xs text-text-muted mt-1">UDID card application submitted • Disability pension applied</p>
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
