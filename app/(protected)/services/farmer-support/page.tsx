"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Leaf, CheckCircle, Building2, Loader2, Shield, Tractor, Banknote, CloudRain } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import GovernmentAPIBadge from "@/components/GovernmentAPIBadge";

const DEPARTMENTS = [
  { name: "Ministry of Agriculture", service: "PM-KISAN Direct Benefit Transfer", icon: Banknote, color: "#22964A" },
  { name: "Fasal Bima Yojana", service: "Crop Insurance Scheme", icon: CloudRain, color: "#1C5AA0" },
  { name: "State Revenue Department", service: "Land Records Verification (7/12 Extract)", icon: Building2, color: "#EB7820" },
  { name: "NABARD", service: "Kisan Credit Card Processing", icon: Tractor, color: "#7C3AED" },
];

export default function FarmerSupportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<"form" | "fetching" | "result">("form");
  const [fetchStatus, setFetchStatus] = useState<"waiting" | "fetching" | "verified" | "failed">("waiting");
  const [landId, setLandId] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [cropType, setCropType] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  const user = session?.user as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) return;

    // Step 1: Grant consent
    setStep("fetching");
    setFetchStatus("fetching");

    // Step 2: Auto-fetch data from government APIs
    try {
      await fetch("/api/consent/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purposeCode: "FARMER_SUPPORT",
          dataSources: [
            "Land Records (7/12 Extract via State Revenue Portal)",
            "Aadhaar-Linked Bank Account Verification (NPCI)",
            "Crop Details (AgriStack Database)",
          ],
          expiresInDays: 7,
        }),
      });
    } catch {
      // Continue with demo flow even if consent API fails
    }

    // Simulate API fetch with realistic delay
    await new Promise((r) => setTimeout(r, 2500));
    setFetchStatus("verified");

    // Step 3: Show results
    setTimeout(() => setStep("result"), 500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-[#22964A]/10">
            <Leaf className="h-6 w-6 text-[#22964A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Farmer Support Services</h1>
            <p className="text-text-muted text-sm">
              Zero document uploads. CivicPulse auto-applies to 4 agricultural departments.
            </p>
          </div>
        </div>
      </div>

      {step === "form" && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="bg-[#22964A]/5 border border-[#22964A]/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-[#22964A] font-medium">
                🌾 This application auto-fetches your land records, bank details, and Aadhaar verification from government databases.
              </p>
            </div>

            <Input label="Full Name" value={user?.name || ""} disabled verified />
            <div className="flex items-center gap-2">
              <GovernmentAPIBadge apiName="MeriPehchan" color="#22964A" />
              <span className="text-xs text-success font-medium">Verified by MeriPehchan ✓</span>
            </div>

            <Input
              label="Land Record ID (7/12 Extract Number)"
              placeholder="e.g., MH/PUN/2024/12345"
              value={landId}
              onChange={(e) => setLandId(e.target.value)}
            />
            <Input
              label="Total Farm Size (in Acres)"
              placeholder="e.g., 2.5"
              value={farmSize}
              onChange={(e) => setFarmSize(e.target.value)}
            />
            <Input
              label="Primary Crop Type"
              placeholder="e.g., Rice, Wheat, Sugarcane, Cotton"
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
            />

            <hr className="border-card-border" />

            {/* Consent */}
            <div className="bg-background rounded-lg p-4 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-card-border"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                />
                <span className="text-sm text-text-muted">
                  I authorize CivicPulse to fetch my land records from the State Revenue Department, verify my bank account via NPCI, and check crop details from the AgriStack database for PM-KISAN and Fasal Bima Yojana eligibility. This consent expires in 7 days. Compliant with DPDP Act 2023.
                </span>
              </label>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!consentChecked || !landId || !farmSize || !cropType}
              className="w-full"
              size="lg"
            >
              <Leaf className="mr-2 h-4 w-4" /> Apply — Auto-Apply to All Departments
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
                {/* Task 1 */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                  {fetchStatus === "fetching" && <Loader2 className="h-5 w-5 text-accent animate-spin" />}
                  {fetchStatus === "verified" && <CheckCircle className="h-5 w-5 text-success" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy">Fetching Land Records (7/12 Extract)</p>
                    <p className="text-xs text-text-muted">State Revenue Portal via API Setu</p>
                  </div>
                  {fetchStatus === "verified" && (
                    <GovernmentAPIBadge apiName="API Setu" color="#1C5AA0" />
                  )}
                </div>

                {/* Task 2 */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                  {fetchStatus === "fetching" && <Loader2 className="h-5 w-5 text-accent animate-spin" />}
                  {fetchStatus === "verified" && <CheckCircle className="h-5 w-5 text-success" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy">Verifying Aadhaar-Linked Bank Account</p>
                    <p className="text-xs text-text-muted">NPCI via Razorpay API</p>
                  </div>
                  {fetchStatus === "verified" && (
                    <GovernmentAPIBadge apiName="NPCI" color="#2D89EF" />
                  )}
                </div>

                {/* Task 3 */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                  {fetchStatus === "fetching" && <Loader2 className="h-5 w-5 text-accent animate-spin" />}
                  {fetchStatus === "verified" && <CheckCircle className="h-5 w-5 text-success" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy">Checking Crop Registration (AgriStack)</p>
                    <p className="text-xs text-text-muted">Ministry of Agriculture Database</p>
                  </div>
                  {fetchStatus === "verified" && (
                    <GovernmentAPIBadge apiName="AgriStack" color="#22964A" />
                  )}
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
            <p className="text-text-muted text-sm mt-1">All data fetched automatically — zero document uploads</p>
          </div>

          <Card className="border-success">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-text-muted">PM-KISAN Benefit Amount</p>
              <p className="text-3xl font-bold text-success">₹6,000 / year</p>
              <p className="text-xs text-text-muted mt-1">Direct transfer to your Aadhaar-linked bank account</p>
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
