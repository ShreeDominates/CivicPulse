"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileWarning,
  Building2,
  Clock,
  Shuffle,
  AlertTriangle,
  FileQuestion,
  HelpCircle,
  XCircle,
  Check,
  RefreshCw,
} from "lucide-react";

interface BureaucracyLog {
  id: string;
  department: string;
  status: string;
  comment: string;
  delayDays: number;
}

const CHAOS_SILOS = [
  { name: "Tehsil Office (Income)", icon: Building2, color: "#1C5AA0", backlog: "14,210 files pending" },
  { name: "State Board Examination Cell", icon: FileQuestion, color: "#EB7820", backlog: "Archived in physical godown" },
  { name: "District Caste Scrutiny Committee", icon: AlertTriangle, color: "#DC2626", backlog: "Meeting scheduled next quarter" },
  { name: "Panchayat / LGD Cadastre Desk", icon: FileWarning, color: "#22964A", backlog: "Talathi on field inspection" },
  { name: "Core Banking Branch IFSC Desk", icon: HelpCircle, color: "#7C3AED", backlog: "Name mismatch queue: 45 days" },
  { name: "District Treasury & PFMS Cell", icon: Clock, color: "#0F2240", backlog: "Awaiting physical token dispatch" },
];

const SATIRICAL_EVENTS: BureaucracyLog[] = [
  {
    id: "step-1",
    department: "Room 104, Desk 3 (Inward Clerk)",
    status: "File Accepted with Objection",
    comment: "Application received. Candidate submitted 3 self-attested photocopies, but clerk demanded 4.",
    delayDays: 4,
  },
  {
    id: "step-2",
    department: "Discretionary Forwarding Cell",
    status: "Forwarded to Forwarding Dept",
    comment: "Your application has been forwarded to the department responsible for forwarding applications.",
    delayDays: 7,
  },
  {
    id: "step-3",
    department: "Caste Verification Sub-Committee",
    status: "Pending Gazetted Signature",
    comment: "Sub-divisional officer is attending a mandatory 3-day zonal conference. Physical stamp locked in cupboard.",
    delayDays: 11,
  },
  {
    id: "step-4",
    department: "District Treasury Accounts Division",
    status: "Inadvertently Misplaced",
    comment: "File temporarily untraceable. Located behind Almirah B under a stack of 2021 pension audits.",
    delayDays: 18,
  },
  {
    id: "step-5",
    department: "Bank Reconciliation Counter",
    status: "Fatal Discrepancy",
    comment: "Scholarship rejected: Candidate wrote 'Aryan Mehta' on portal, but passbook reads 'Aryan H. Mehta'. Start over.",
    delayDays: 28,
  },
];

export default function BureaucracyChaos({ onProceedToCivicPulse }: { onProceedToCivicPulse: () => void }) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [accumulatedDays, setAccumulatedDays] = useState<number>(0);

  const simulateStep = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    let nextIndex = currentStepIndex + 1;
    if (nextIndex >= SATIRICAL_EVENTS.length) {
      nextIndex = 0;
      setAccumulatedDays(0);
    } else {
      setAccumulatedDays((prev) => prev + SATIRICAL_EVENTS[nextIndex].delayDays);
    }

    setTimeout(() => {
      setCurrentStepIndex(nextIndex);
      setIsSimulating(false);
    }, 600);
  };

  const resetSimulation = () => {
    setCurrentStepIndex(0);
    setAccumulatedDays(0);
  };

  const currentLog = SATIRICAL_EVENTS[currentStepIndex];

  return (
    <div className="w-full bg-navy-900 border border-navy-700/60 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden text-white">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-error/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-saffron/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-error/20 border border-error/40 text-error-light text-xs font-semibold uppercase tracking-wider mb-4">
          <AlertTriangle className="h-3.5 w-3.5" /> Act 1: The Bureaucratic Maze
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
          "Somewhere in this diagram is your application."
        </h2>
        <p className="text-navy-200 text-sm md:text-base leading-relaxed">
          How 6 disconnected departments, 4 paper photocopies, and a missing gazetted stamp
          turn a 3-minute scholarship into a 28-day bureaucratic marathon.
        </p>
      </div>

      {/* Grid of Siloed Departments */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
        {CHAOS_SILOS.map((silo, idx) => {
          const Icon = silo.icon;
          const isActive = idx === (currentStepIndex % CHAOS_SILOS.length);
          return (
            <motion.div
              key={idx}
              animate={{
                scale: isActive ? [1, 1.03, 1] : 1,
                borderColor: isActive ? silo.color : "rgba(77, 107, 125, 0.3)",
              }}
              transition={{ repeat: isActive ? Infinity : 0, duration: 1.5 }}
              className={`p-4 rounded-xl border bg-navy-800/80 backdrop-blur-sm relative transition-colors ${
                isActive ? "shadow-lg" : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: silo.color }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-navy-100 leading-tight">
                  {silo.name}
                </span>
              </div>
              <p className="text-[11px] text-navy-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping inline-block" />
                {silo.backlog}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Traditional Bureaucracy Simulator */}
      <div className="relative z-10 bg-navy-800/90 border border-navy-700 rounded-xl p-5 md:p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-700">
          <div>
            <span className="text-xs text-navy-300 uppercase tracking-wider font-semibold">
              Live Traditional File Tracker
            </span>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
              File No: <span className="text-saffron font-mono">MH-EDU-2026-PHYSICAL-9941</span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-error/20 border border-error/40 text-error-light text-xs font-semibold flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Delay Accumulated: {accumulatedDays} Days
            </span>
          </div>
        </div>

        {/* Current Bureaucratic Status */}
        <div className="py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLog.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-saffron bg-saffron/10 px-2.5 py-0.5 rounded border border-saffron/20">
                  {currentLog.department}
                </span>
                <span className="text-xs text-navy-300">
                  Step {currentStepIndex + 1} of {SATIRICAL_EVENTS.length}
                </span>
              </div>
              <h4 className="text-base font-semibold text-white">
                Status: <span className="text-error-light">{currentLog.status}</span>
              </h4>
              <p className="text-sm text-navy-200 italic bg-navy-900/60 p-3 rounded-lg border border-navy-700/60">
                "{currentLog.comment}"
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-navy-700">
          <button
            onClick={simulateStep}
            disabled={isSimulating}
            className="px-5 py-2.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-white font-medium text-sm flex items-center gap-2 transition-colors active:scale-95 disabled:opacity-50"
          >
            {isSimulating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Shuffle className="h-4 w-4 text-saffron" />
            )}
            Track Next Bureaucratic Step
          </button>

          <button
            onClick={resetSimulation}
            className="text-xs text-navy-300 hover:text-white underline transition-colors"
          >
            Reset Simulation
          </button>
        </div>
      </div>

      {/* Transition to CivicPulse Solution */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-navy-800 to-accent/30 border border-accent/40">
        <div>
          <h4 className="text-sm font-bold text-white">
            Tired of paper queues and clerk roulette?
          </h4>
          <p className="text-xs text-navy-200">
            See how CivicPulse collapses 28 days of physical friction into 3.2 seconds of deterministic verification.
          </p>
        </div>
        <button
          onClick={onProceedToCivicPulse}
          className="px-6 py-2.5 rounded-lg bg-saffron hover:bg-saffron-dark text-white font-bold text-sm shadow-lg shadow-saffron/20 transition-all flex items-center gap-2 flex-shrink-0 active:scale-95"
        >
          Activate CivicPulse Gateway →
        </button>
      </div>
    </div>
  );
}
