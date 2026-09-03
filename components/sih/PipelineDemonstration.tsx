"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  ExternalLink,
  Layers,
  Banknote,
  FileCheck,
  FileText,
  Clock,
  Sparkles,
  Lock,
  ArrowRight,
  RefreshCw,
  Building,
  GraduationCap,
  Landmark,
  UserCheck,
  MapPin,
  FileSearch,
  Zap,
} from "lucide-react";

interface CandidateScenario {
  id: string;
  name: string;
  tagline: string;
  candidateName: string;
  annualIncome: number;
  boardMarks: number;
  category: string;
  nclExpiry: string;
  district: string;
  state: string;
  bankHolderName: string;
  expectedOutcome: "APPROVED" | "REJECTED";
  expectedGrant: number;
  highlight: string;
}

const DEMO_SCENARIOS: CandidateScenario[] = [
  {
    id: "aryan_golden",
    name: "Aryan Mehta (The Golden Candidate)",
    tagline: "Pristine merit-cum-means applicant satisfying all 5 criteria",
    candidateName: "Aryan Mehta",
    annualIncome: 160000,
    boardMarks: 87.4,
    category: "OBC (Kunbi)",
    nclExpiry: "2027-03-31",
    district: "Pune",
    state: "Maharashtra (27)",
    bankHolderName: "Aryan Mehta",
    expectedOutcome: "APPROVED",
    expectedGrant: 48000,
    highlight: "100% Coherent Multi-Source Evidence — Zero Anomalies",
  },
  {
    id: "rohan_impersonator",
    name: "Rohan Verma (The Identity Impersonator)",
    tagline: "Applicant attempts to use a different student's board marksheet",
    candidateName: "Aryan Mehta",
    annualIncome: 160000,
    boardMarks: 87.4, // Marksheet registered to Rohan Verma
    category: "OBC",
    nclExpiry: "2027-03-31",
    district: "Pune",
    state: "Maharashtra (27)",
    bankHolderName: "Aryan Mehta",
    expectedOutcome: "REJECTED",
    expectedGrant: 0,
    highlight: "B4 Rejection + B7 Critical Cross-Source Identity Conflict",
  },
  {
    id: "jaipur_domicile",
    name: "Jaipur Resident (Out-of-State Domicile)",
    tagline: "High merit candidate, but home taluka is in Rajasthan",
    candidateName: "Aryan Mehta",
    annualIncome: 160000,
    boardMarks: 87.4,
    category: "OBC",
    nclExpiry: "2027-03-31",
    district: "Jaipur",
    state: "Rajasthan (08)",
    bankHolderName: "Aryan Mehta",
    expectedOutcome: "REJECTED",
    expectedGrant: 0,
    highlight: "LGD Location Resolution Rejects Non-Maharashtra Applicant",
  },
  {
    id: "priya_near_expiry",
    name: "Priya Sharma (Near-Expiry Certificate)",
    tagline: "Valid candidate whose Caste NCL certificate expires in 29 days",
    candidateName: "Priya Sharma",
    annualIncome: 190000,
    boardMarks: 82.0,
    category: "OBC",
    nclExpiry: "2026-10-03", // ~29 days from current simulation
    district: "Nagpur",
    state: "Maharashtra (27)",
    bankHolderName: "Priya Sharma",
    expectedOutcome: "APPROVED",
    expectedGrant: 48000,
    highlight: "B4 Approves Statutory Rule; B7 Emits Advisory Expiry Warning",
  },
  {
    id: "vikram_npci_retry",
    name: "Vikram Rao (Bank Seeding Failure & Retry)",
    tagline: "Aadhaar unlinked in NPCI APBS mapper; fails payment, retries to success",
    candidateName: "Vikram Rao",
    annualIncome: 180000,
    boardMarks: 79.5,
    category: "SC",
    nclExpiry: "Permanent",
    district: "Thane",
    state: "Maharashtra (27)",
    bankHolderName: "Vikram Rao",
    expectedOutcome: "APPROVED",
    expectedGrant: 48000,
    highlight: "Simulates PFMS Settlement Failure & Clean Financial Retry",
  },
];

export default function PipelineDemonstration() {
  const [selectedScenario, setSelectedScenario] = useState<CandidateScenario>(DEMO_SCENARIOS[0]);
  const [activeTab, setActiveTab] = useState<"pipeline" | "evidence" | "intelligence" | "sanction" | "audit">("pipeline");
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<"IDLE" | "VERIFYING" | "ELIGIBLE" | "SANCTIONED" | "DISBURSED">("IDLE");
  const [evidenceModalData, setEvidenceModalData] = useState<any | null>(null);
  const [disbursementFailed, setDisbursementFailed] = useState(false);
  const [idempotencyTriggered, setIdempotencyTriggered] = useState(false);

  // Simulation execution handler
  const runDemonstration = () => {
    setRunning(true);
    setStage("VERIFYING");
    setDisbursementFailed(false);
    setIdempotencyTriggered(false);

    setTimeout(() => {
      setStage("ELIGIBLE");
      setTimeout(() => {
        if (selectedScenario.expectedOutcome === "APPROVED") {
          setStage("SANCTIONED");
          setTimeout(() => {
            if (selectedScenario.id === "vikram_npci_retry") {
              setDisbursementFailed(true);
              setStage("SANCTIONED"); // Stops at sanctioned with failed disbursement
            } else {
              setStage("DISBURSED");
            }
            setRunning(false);
          }, 1200);
        } else {
          setRunning(false);
        }
      }, 1000);
    }, 1400);
  };

  const retryPayment = () => {
    setRunning(true);
    setTimeout(() => {
      setDisbursementFailed(false);
      setStage("DISBURSED");
      setRunning(false);
    }, 800);
  };

  const triggerIdempotencyTest = () => {
    setIdempotencyTriggered(true);
    setTimeout(() => setIdempotencyTriggered(false), 3000);
  };

  const isApproved = selectedScenario.expectedOutcome === "APPROVED";

  return (
    <div className="w-full bg-white border border-card-border rounded-2xl shadow-xl overflow-hidden">
      {/* Top Header with SIH Presentation Badge */}
      <div className="bg-navy text-white px-6 py-5 border-b border-navy-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-saffron">
              Live Interactive Architecture Arena
            </span>
            <span className="text-xs bg-navy-800 text-navy-200 px-2 py-0.5 rounded border border-navy-700">
              B3 → B4 → B5 → B6 → B7
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            CivicPulse Real-Time Execution Engine
          </h2>
        </div>

        {/* Demo Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={runDemonstration}
            disabled={running}
            className="px-5 py-2.5 rounded-lg bg-saffron hover:bg-saffron-dark text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {running ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4 fill-white" />
            )}
            Run CivicPulse Pipeline
          </button>
        </div>
      </div>

      {/* Scenario Selector Ribbon */}
      <div className="bg-background border-b border-card-border p-4">
        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
          Select Candidate Demonstration Scenario:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {DEMO_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => {
                setSelectedScenario(sc);
                setStage("IDLE");
                setDisbursementFailed(false);
              }}
              className={`p-2.5 rounded-lg border text-left transition-all text-xs ${
                selectedScenario.id === sc.id
                  ? "bg-white border-accent shadow-sm ring-1 ring-accent"
                  : "bg-white/60 border-card-border hover:bg-white hover:border-navy-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-navy truncate">{sc.name.split(" (")[0]}</span>
                {sc.expectedOutcome === "APPROVED" ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-success/10 text-success font-semibold">PASS</span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-error/10 text-error font-semibold">REJECT</span>
                )}
              </div>
              <p className="text-[11px] text-text-muted truncate">{sc.tagline}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Active Candidate Profile Banner */}
      <div className="bg-navy-50/70 px-6 py-3 border-b border-card-border flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-navy flex items-center gap-1.5">
            <UserCheck className="h-4 w-4 text-accent" /> Candidate: {selectedScenario.candidateName}
          </span>
          <span className="text-text-muted">|</span>
          <span className="text-text-primary">Income: ₹{selectedScenario.annualIncome.toLocaleString("en-IN")}</span>
          <span className="text-text-muted">|</span>
          <span className="text-text-primary">Merit: {selectedScenario.boardMarks}%</span>
          <span className="text-text-muted">|</span>
          <span className="text-text-primary">Category: {selectedScenario.category}</span>
          <span className="text-text-muted">|</span>
          <span className="text-text-primary">Domicile: {selectedScenario.district} ({selectedScenario.state})</span>
        </div>
        <div className="text-[11px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
          {selectedScenario.highlight}
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-card-border px-6 bg-white overflow-x-auto">
        {[
          { id: "pipeline", label: "1. Gateway & Rules (B3/B4)", icon: Layers },
          { id: "evidence", label: "2. Evidence Graph", icon: FileSearch },
          { id: "intelligence", label: "3. Anomaly Intelligence (B7)", icon: Sparkles },
          { id: "sanction", label: "4. Sanction & DBT (B5)", icon: Banknote },
          { id: "audit", label: "5. Audit Receipts (B6)", icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3.5 px-4 font-semibold text-xs transition-colors border-b-2 whitespace-nowrap ${
                isActive
                  ? "border-saffron text-navy font-bold"
                  : "border-transparent text-text-muted hover:text-navy"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-saffron" : "text-text-muted"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="p-6 bg-background/50 min-h-[420px]">
        {/* TAB 1: PIPELINE & ELIGIBILITY */}
        {activeTab === "pipeline" && (
          <div className="space-y-6">
            {/* Stage Stepper */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { title: "B3 Verification", status: stage !== "IDLE" ? "COMPLETED" : "WAITING", desc: "5 Source Adapters" },
                { title: "B4 Rule Engine", status: stage === "ELIGIBLE" || stage === "SANCTIONED" || stage === "DISBURSED" ? "COMPLETED" : "WAITING", desc: "MAHA_HED_RULES v2.1" },
                { title: "B5 Sanction Order", status: stage === "SANCTIONED" || stage === "DISBURSED" ? "COMPLETED" : "WAITING", desc: "Grant ₹48,000" },
                { title: "DBT Disbursement", status: stage === "DISBURSED" ? "COMPLETED" : (disbursementFailed ? "FAILED" : "WAITING"), desc: "PFMS / APBS Rail" },
              ].map((st, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border transition-all ${
                    st.status === "COMPLETED"
                      ? "bg-success/5 border-success/30 text-success"
                      : st.status === "FAILED"
                      ? "bg-error/5 border-error/30 text-error"
                      : "bg-white border-card-border text-text-muted"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{st.title}</span>
                    {st.status === "COMPLETED" && <CheckCircle className="h-4 w-4 text-success" />}
                    {st.status === "FAILED" && <XCircle className="h-4 w-4 text-error" />}
                  </div>
                  <p className="text-[11px] text-text-muted">{st.desc}</p>
                </div>
              ))}
            </div>

            {/* B4 Authoritative Eligibility Card */}
            <div className={`p-6 rounded-xl border-2 transition-all ${
              stage === "IDLE"
                ? "bg-white border-card-border"
                : isApproved
                ? "bg-success/5 border-success"
                : "bg-error/5 border-error"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    Authoritative Decision (B4 Deterministic Engine)
                  </span>
                  <h3 className={`text-2xl font-extrabold mt-0.5 ${
                    stage === "IDLE" ? "text-navy" : isApproved ? "text-success" : "text-error"
                  }`}>
                    {stage === "IDLE"
                      ? "READY FOR EVALUATION"
                      : isApproved
                      ? "ELIGIBLE FOR SCHOLARSHIP GRANT ✓"
                      : "APPLICATION REJECTED ✗"}
                  </h3>
                  <p className="text-xs text-text-muted mt-1 font-mono">
                    Rule Set: MAHA_HED_SCHOLARSHIP_RULES (v2.1.0) • Scheme Code: SCH-HED-2026
                  </p>
                </div>
                {isApproved && stage !== "IDLE" && (
                  <div className="text-right">
                    <span className="text-xs text-text-muted block">Approved Benefit Grant</span>
                    <span className="text-3xl font-extrabold text-navy">₹48,000</span>
                  </div>
                )}
              </div>

              {/* 5 Statutory Criteria Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    label: "Economic Ceiling (≤ ₹2,50,000)",
                    actual: `₹${selectedScenario.annualIncome.toLocaleString("en-IN")}`,
                    pass: selectedScenario.annualIncome <= 250000,
                    source: "CBDT Income Tax Dept (API Setu)",
                  },
                  {
                    label: "Academic Merit Cut-Off (≥ 75.0%)",
                    actual: `${selectedScenario.boardMarks}% ${selectedScenario.id === "rohan_impersonator" ? "(Name: Rohan Verma)" : ""}`,
                    pass: selectedScenario.boardMarks >= 75.0 && selectedScenario.id !== "rohan_impersonator",
                    source: "CBSE DigiLocker X.509 Signature",
                  },
                  {
                    label: "Affirmative Action Category",
                    actual: selectedScenario.category,
                    pass: true,
                    source: "Maharashtra Caste Scrutiny Portal",
                  },
                  {
                    label: "State Domicile (LGD Code 27)",
                    actual: `${selectedScenario.district} (${selectedScenario.state})`,
                    pass: selectedScenario.id !== "jaipur_domicile",
                    source: "Local Government Directory (LGD)",
                  },
                  {
                    label: "Direct Benefit Bank Validation",
                    actual: `${selectedScenario.bankHolderName} (SBI XXXX-1234)`,
                    pass: true,
                    source: "NPCI Core Banking System (FAV)",
                  },
                ].map((crit, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      crit.pass ? "bg-white border-card-border" : "bg-error/10 border-error/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {crit.pass ? (
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-error flex-shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-navy block">{crit.label}</span>
                        <span className="text-[10px] text-text-muted">{crit.source}</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-navy">{crit.actual}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EVIDENCE GRAPH */}
        {activeTab === "evidence" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-card-border">
              <h3 className="text-base font-bold text-navy mb-1">
                Multi-Source Canonical Evidence Explorer
              </h3>
              <p className="text-xs text-text-muted mb-6">
                Click any government data provider to inspect the canonical response payload, provenance metadata, and audit correlation IDs.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    title: "Income Tax Registry",
                    dept: "CBDT / Ministry of Finance",
                    ref: "ITR-REQ-2026-991A",
                    status: "DATA_VERIFIED",
                    data: { annualIncome: selectedScenario.annualIncome, assessmentYear: "2025-26", taxFiled: true },
                    icon: Building,
                  },
                  {
                    title: "CBSE DigiLocker Cell",
                    dept: "Ministry of Education",
                    ref: "CBSE-DL-2026-X509",
                    status: selectedScenario.id === "rohan_impersonator" ? "VERIFICATION_FAILED" : "DATA_VERIFIED",
                    data: { percentage: selectedScenario.boardMarks, candidateName: selectedScenario.id === "rohan_impersonator" ? "Rohan Verma" : selectedScenario.candidateName },
                    icon: GraduationCap,
                  },
                  {
                    title: "Caste Certificate Registry",
                    dept: "Govt of Maharashtra",
                    ref: "CST-MH-2024-8871",
                    status: "DATA_VERIFIED",
                    data: { category: selectedScenario.category, nclExpiry: selectedScenario.nclExpiry },
                    icon: FileCheck,
                  },
                  {
                    title: "Local Government Directory",
                    dept: "Ministry of Panchayati Raj",
                    ref: "LGD-MH-PUNE-519",
                    status: selectedScenario.id === "jaipur_domicile" ? "DATA_VERIFIED (OUT_OF_STATE)" : "DATA_VERIFIED",
                    data: { district: selectedScenario.district, state: selectedScenario.state },
                    icon: MapPin,
                  },
                  {
                    title: "Core Banking / NPCI FAV",
                    dept: "Reserve Bank / NPCI",
                    ref: "FAV-SBIN-2026-1234",
                    status: "DATA_VERIFIED",
                    data: { accountHolder: selectedScenario.bankHolderName, ifsc: "SBIN0001234", accountMasked: "XXXX-XXXX-1234" },
                    icon: Landmark,
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => setEvidenceModalData(item)}
                      className="p-4 rounded-xl border border-card-border bg-background hover:bg-white hover:border-accent cursor-pointer transition-all hover:shadow-md"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-navy text-white flex items-center justify-center">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-navy">{item.title}</h4>
                          <span className="text-[10px] text-text-muted">{item.dept}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-card-border flex items-center justify-between text-[11px]">
                        <span className="font-mono text-text-muted">{item.ref}</span>
                        <span className="text-accent font-semibold flex items-center gap-1">
                          Inspect <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: B7 ANOMALY INTELLIGENCE */}
        {activeTab === "intelligence" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-card-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    <h3 className="text-lg font-bold text-navy">
                      B7 Cross-Evidence Anomaly Intelligence
                    </h3>
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    Deterministic heuristic analysis evaluating multi-source token consistency, near-expiry proximity, and evidence completeness.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold">
                  Advisory Mode • Analyzer v1.0.0
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-background border border-card-border">
                  <span className="text-xs text-text-muted font-semibold block">Risk Level</span>
                  <span className={`text-2xl font-extrabold ${
                    selectedScenario.id === "aryan_golden" ? "text-success" : selectedScenario.id === "priya_near_expiry" ? "text-warning" : "text-error"
                  }`}>
                    {selectedScenario.id === "aryan_golden" ? "LOW (0/100)" : selectedScenario.id === "priya_near_expiry" ? "MEDIUM (15/100)" : "HIGH (40/100)"}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-background border border-card-border">
                  <span className="text-xs text-text-muted font-semibold block">Multi-Source Coherence</span>
                  <span className="text-2xl font-extrabold text-navy">
                    {selectedScenario.id === "rohan_impersonator" ? "0.50 (CONFLICT)" : "1.00 (COHERENT)"}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-background border border-card-border">
                  <span className="text-xs text-text-muted font-semibold block">Evidence Completeness</span>
                  <span className="text-2xl font-extrabold text-accent">5 of 5 Sources (100%)</span>
                </div>
              </div>

              {/* Detected Anomalies */}
              <div>
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-3">
                  Detected Anomaly Log
                </h4>
                {selectedScenario.id === "aryan_golden" ? (
                  <div className="p-4 rounded-lg bg-success/5 border border-success/20 text-success text-xs flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Zero anomalies detected across all 5 independent government sources. Candidate exhibits pristine coherence.
                  </div>
                ) : selectedScenario.id === "rohan_impersonator" ? (
                  <div className="p-4 rounded-lg bg-error/10 border border-error/30 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-error text-white text-[10px] font-bold">CRITICAL</span>
                      <span className="text-xs font-bold text-error">IDENTITY_CROSS_SOURCE_CONFLICT_ACADEMIC</span>
                    </div>
                    <p className="text-xs text-navy">
                      Candidate claimed name "Aryan Mehta" conflicts with CBSE Marksheet name "Rohan Verma". Potential identity impersonation vector.
                    </p>
                    <span className="text-[11px] font-mono text-text-muted block">Evidence Ref: CBSE-REQ-001</span>
                  </div>
                ) : selectedScenario.id === "jaipur_domicile" ? (
                  <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-warning text-white text-[10px] font-bold">WARNING</span>
                      <span className="text-xs font-bold text-navy">OUT_OF_STATE_DOMICILE</span>
                    </div>
                    <p className="text-xs text-navy">
                      Resolved district "Jaipur" belongs to State Code 08 (Rajasthan). Scheme mandates Maharashtra domicile (State 27).
                    </p>
                  </div>
                ) : selectedScenario.id === "priya_near_expiry" ? (
                  <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-warning text-white text-[10px] font-bold">WARNING</span>
                      <span className="text-xs font-bold text-navy">DOCUMENT_NEAR_EXPIRY_NCL</span>
                    </div>
                    <p className="text-xs text-navy">
                      Caste Non-Creamy Layer certificate expires in 29 days. Candidate is advised to renew before final PFMS disbursement cycle.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-error/10 border border-error/30 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-error text-white text-[10px] font-bold">CRITICAL</span>
                      <span className="text-xs font-bold text-error">DBT_BENEFICIARY_MAPPING_ERROR</span>
                    </div>
                    <p className="text-xs text-navy">
                      Aadhaar not linked in NPCI APBS mapper. Bank account rejected for Direct Benefit Transfer.
                    </p>
                  </div>
                )}
              </div>

              {/* Legal Boundary Notice */}
              <div className="mt-6 pt-4 border-t border-card-border text-[11px] text-text-muted flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-navy" />
                <span>
                  <strong>Legal Safety Boundary:</strong> B7 intelligence is strictly advisory and operational. Statutory scholarship decisions are determined solely by B4 deterministic rule execution.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: B5 SANCTION & DBT SIMULATION */}
        {activeTab === "sanction" && (
          <div className="space-y-6">
            {stage === "IDLE" || stage === "VERIFYING" ? (
              <div className="bg-white p-8 rounded-xl border border-card-border text-center">
                <Clock className="h-8 w-8 text-saffron mx-auto mb-2 animate-bounce" />
                <h3 className="text-base font-bold text-navy">Awaiting B4 Eligibility Completion</h3>
                <p className="text-xs text-text-muted mt-1">
                  Click "Run CivicPulse Pipeline" above to progress through verification and sanction generation.
                </p>
              </div>
            ) : !isApproved ? (
              <div className="bg-white p-8 rounded-xl border border-error/30 text-center">
                <XCircle className="h-8 w-8 text-error mx-auto mb-2" />
                <h3 className="text-base font-bold text-error">Sanction & Disbursement Blocked</h3>
                <p className="text-xs text-text-muted mt-1">
                  Server-side gate strictly blocks sanction generation for ineligbile applications. Zero taxpayer funds disbursed.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Official Sanction Certificate */}
                <div className="bg-white p-6 rounded-xl border-2 border-navy/20 shadow-sm relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-card-border gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-saffron uppercase tracking-wider">
                        Govt of Maharashtra • Higher & Technical Education Dept
                      </span>
                      <h3 className="text-lg font-bold text-navy mt-0.5">
                        Formal Sanction Order Ref: <span className="font-mono text-accent">SANCTION-MH-HED-2026-CP-9941</span>
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded bg-success/10 text-success text-xs font-bold border border-success/20">
                        SANCTION ACTIVE ✓
                      </span>
                    </div>
                  </div>

                  <div className="py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-text-muted block">Beneficiary</span>
                      <span className="font-bold text-navy">{selectedScenario.candidateName}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block">Sanctioned Grant</span>
                      <span className="font-bold text-success text-sm">₹48,000</span>
                    </div>
                    <div>
                      <span className="text-text-muted block">Disbursement Rail</span>
                      <span className="font-bold text-navy">NPCI APBS / PFMS</span>
                    </div>
                    <div>
                      <span className="text-text-muted block">Treasury Bill Head</span>
                      <span className="font-mono text-navy">TB-MH-2026-8871</span>
                    </div>
                  </div>
                </div>

                {/* PFMS DBT Clearing Machine */}
                <div className="bg-navy-900 p-6 rounded-xl border border-navy-700 text-white">
                  <div className="flex items-center justify-between pb-4 border-b border-navy-700">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-saffron" />
                      <h4 className="text-sm font-bold text-white">
                        PFMS DBT Clearing Terminal (NPCI APBS Rail)
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-navy-300">
                      clearingMode: NPCI_APBS (SIMULATED)
                    </span>
                  </div>

                  {disbursementFailed ? (
                    <div className="py-6 text-center space-y-3">
                      <XCircle className="h-10 w-10 text-error mx-auto" />
                      <h4 className="text-base font-bold text-error-light">
                        DBT Beneficiary Clearing Rejected
                      </h4>
                      <p className="text-xs text-navy-200 max-w-md mx-auto">
                        PFMS Beneficiary Validation Rejected: Aadhaar-bank account mapping inactive in NPCI mapper (NPCI_ABPS_ERR_04).
                      </p>
                      <button
                        onClick={retryPayment}
                        className="px-5 py-2 rounded-lg bg-saffron hover:bg-saffron-dark text-white font-bold text-xs shadow transition-all active:scale-95"
                      >
                        Update Bank Account & Retry Clearing →
                      </button>
                    </div>
                  ) : stage === "DISBURSED" ? (
                    <div className="py-6 space-y-4">
                      <div className="p-4 rounded-lg bg-success/10 border border-success/30 text-success-light flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
                          <div>
                            <span className="text-xs font-bold text-white block">
                              Direct Benefit Transfer Successfully Credited
                            </span>
                            <span className="text-xs text-navy-200">
                              Amount ₹48,000 transferred to Aadhaar-linked account (SBI XXXX-1234).
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono text-saffron block">PFMS Ref: C2026MHFD9EB1A9</span>
                          <span className="text-[11px] font-mono text-navy-300">UTR: RBI1788471852418BBAA</span>
                        </div>
                      </div>

                      {/* Idempotency Test Action */}
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xs text-navy-300">
                          Verify Financial Safety & Double-Spend Protection:
                        </span>
                        <button
                          onClick={triggerIdempotencyTest}
                          className="px-4 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-xs font-semibold text-white border border-navy-600 active:scale-95 transition-all"
                        >
                          Trigger Duplicate Disbursement Call
                        </button>
                      </div>

                      {idempotencyTriggered && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-lg bg-accent/20 border border-accent/40 text-xs text-accent-light"
                        >
                          🛡️ <strong>Idempotency Guard Activated:</strong> Duplicate payment instruction detected for Application CP-9941. Replayed existing transaction without creating secondary debit.
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-navy-300">
                      Clearing sequence executing...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: AUDIT RECEIPTS */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border border-card-border">
              <h3 className="text-base font-bold text-navy mb-1">
                Immutable Lifecycle Audit Log ("Show Me the Receipts")
              </h3>
              <p className="text-xs text-text-muted mb-6">
                Every state transition, actor hash, timestamp, and gateway correlation ID is permanently recorded in the audit trail.
              </p>

              <div className="space-y-3">
                {[
                  {
                    action: "APPLICATION_SUBMITTED",
                    time: "2026-09-04T02:45:10.120Z",
                    actor: "Citizen (Aryan Mehta • SHA-256)",
                    ref: "CP-2026-JOURNEY-A-9941",
                    status: "200 OK",
                    color: "bg-accent text-white",
                  },
                  {
                    action: "B4_ELIGIBILITY_EVALUATED",
                    time: "2026-09-04T02:45:10.340Z",
                    actor: "CivicPulse Rule Engine (v2.1.0)",
                    ref: "MAHA_HED_SCHOLARSHIP_RULES",
                    status: isApproved ? "ELIGIBLE ✓" : "NOT_ELIGIBLE ✗",
                    color: isApproved ? "bg-success text-white" : "bg-error text-white",
                  },
                  {
                    action: "SANCTION_ORDER_ISSUED",
                    time: "2026-09-04T02:45:11.210Z",
                    actor: "Directorate of Higher Education",
                    ref: "SANCTION-MH-HED-2026-9941",
                    status: isApproved ? "SANCTIONED" : "GATE_BLOCKED",
                    color: isApproved ? "bg-navy text-white" : "bg-error text-white",
                  },
                  {
                    action: "DBT_DISBURSEMENT_SUCCESS",
                    time: "2026-09-04T02:45:12.550Z",
                    actor: "PFMS / NPCI APBS Switch",
                    ref: "RBI1788471852418BBAA",
                    status: isApproved ? "CREDITED (₹48,000)" : "BLOCKED",
                    color: isApproved ? "bg-success text-white" : "bg-navy-700 text-white",
                  },
                ].map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border border-card-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono ${log.color}`}>
                        {log.action}
                      </span>
                      <div>
                        <span className="font-bold text-navy block">{log.actor}</span>
                        <span className="text-[11px] font-mono text-text-muted">{log.ref}</span>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-end justify-between sm:justify-center">
                      <span className="font-mono text-text-muted text-[11px]">{log.time}</span>
                      <span className="font-bold text-navy">{log.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal for Evidence Inspection */}
      {evidenceModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-card-border"
          >
            <div className="flex items-center justify-between pb-3 border-b border-card-border mb-4">
              <div>
                <span className="text-xs text-text-muted uppercase font-bold">{evidenceModalData.dept}</span>
                <h3 className="text-lg font-bold text-navy">{evidenceModalData.title}</h3>
              </div>
              <button
                onClick={() => setEvidenceModalData(null)}
                className="w-8 h-8 rounded-full bg-background hover:bg-navy-100 flex items-center justify-center text-navy font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded bg-background">
                <span className="text-text-muted">Correlation Request ID:</span>
                <span className="font-mono font-bold text-accent">{evidenceModalData.ref}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-background">
                <span className="text-text-muted">Verification Status:</span>
                <span className="font-bold text-success">{evidenceModalData.status}</span>
              </div>

              <div>
                <span className="text-text-muted font-bold block mb-1">Raw Normalized Payload:</span>
                <pre className="p-3 rounded-lg bg-navy-900 text-green-400 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(evidenceModalData.data, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-card-border text-right">
              <button
                onClick={() => setEvidenceModalData(null)}
                className="px-4 py-2 rounded-lg bg-navy text-white text-xs font-bold"
              >
                Close Inspector
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
