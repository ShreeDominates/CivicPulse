"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  GraduationCap,
  Baby,
  Building2,
  Leaf,
  Users,
  Heart,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle,
  Banknote,
  Clock,
  Loader2,
  Sparkles,
  Layers,
  FileCheck,
  ChevronDown,
  Lock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import BureaucracyChaos from "@/components/sih/BureaucracyChaos";
import PipelineDemonstration from "@/components/sih/PipelineDemonstration";

function AnimatedCounter({ target, duration = 2 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const increment = target / (duration * 60);
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setCount(Math.floor(current));
    }, (duration * 1000) / 60);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString("en-IN")}</span>;
}

export default function LandingPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const arenaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/stats/disbursements")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const scrollToArena = () => {
    arenaRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const lifeEvents = [
    { icon: GraduationCap, title: "Higher Education Scholarship", href: "/services/scholarship", color: "#1C5AA0", desc: "Live B3-B7 demonstration scheme" },
    { icon: Baby, title: "Janma Praman Patra", href: "/services/birth-registration", color: "#EB7820", desc: "Civil registration lifecycle" },
    { icon: Building2, title: "Udyam Aadhaar Enterprise", href: "/services/business", color: "#22964A", desc: "Single-window business clearance" },
    { icon: Leaf, title: "PM-KISAN Samman Nidhi", href: "/services/farmer-support", color: "#16A34A", desc: "LGD cadastre-linked direct benefit" },
    { icon: Users, title: "Indira Gandhi Senior Pension", href: "/services/senior-citizen-pension", color: "#7C3AED", desc: "Aadhaar APBS monthly disbursement" },
    { icon: Heart, title: "Divyangjan Disability Card", href: "/services/disability-certificate", color: "#DC2626", desc: "UDID medical board verification" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-saffron selection:text-white">
      <Navbar />

      {/* =========================================================================
          HERO: THE SOVEREIGN BENEFIT REVOLUTION
          ========================================================================= */}
      <section className="bg-navy text-white pt-20 pb-28 md:pt-28 md:pb-36 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-saffron blur-3xl" />
          <div className="absolute bottom-0 -left-32 w-96 h-96 rounded-full bg-accent blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          {/* SIH 2026 Header Pill */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-800 border border-navy-600 text-saffron-light text-xs font-bold tracking-wide uppercase mb-6 shadow-sm"
          >
            <Shield className="h-4 w-4 text-saffron" />
            Smart India Hackathon 2026 • Sovereign Public Infrastructure
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-4xl mx-auto"
          >
            From Bureaucracy to <span className="text-saffron">3-Second</span> Benefit Delivery.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg sm:text-xl md:text-2xl text-navy-200 mb-10 max-w-3xl mx-auto font-normal leading-relaxed"
          >
            Zero Paper Uploads. Zero Attestation Stamps. Zero Clerk Discretion.
            A deterministic government data gateway that turns 28 days of physical queues into 3.2 seconds of auditable truth.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={scrollToArena}
              className="w-full sm:w-auto bg-saffron hover:bg-saffron-dark text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-saffron/20 transition-all inline-flex items-center justify-center gap-2 active:scale-95"
            >
              Launch SIH Live Demonstration <ArrowRight className="h-5 w-5" />
            </button>
            <Link
              href="/login"
              className="w-full sm:w-auto bg-navy-800 hover:bg-navy-700 border border-navy-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all inline-flex items-center justify-center gap-2"
            >
              Citizen Demo Login (OTP)
            </Link>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          KEY METRICS STRIP
          ========================================================================= */}
      <section className="bg-white border-b border-card-border py-12 relative -mt-10 max-w-6xl mx-auto w-11/12 rounded-2xl shadow-xl z-20">
        <div className="px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-accent">
              {stats ? <AnimatedCounter target={stats.totalScholarshipsDisbursed || 12480} /> : "12,480"}
            </p>
            <p className="text-xs sm:text-sm text-text-muted mt-1 font-medium">Benefits Disbursed</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-saffron">
              {stats ? <AnimatedCounter target={stats.studentsBenefited2026 || 4820} /> : "4,820"}
            </p>
            <p className="text-xs sm:text-sm text-text-muted mt-1 font-medium">Students Funded (2026)</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-error flex items-center justify-center gap-1.5">
              <Clock className="h-7 w-7 inline" /> 28 Days
            </p>
            <p className="text-xs sm:text-sm text-text-muted mt-1 font-medium">Traditional Processing</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-success flex items-center justify-center gap-1.5">
              <Zap className="h-7 w-7 inline" /> 3.2 Sec
            </p>
            <p className="text-xs sm:text-sm text-text-muted mt-1 font-medium">CivicPulse Gateway</p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ACT 1: THE SATIRICAL BUREAUCRACY
          ========================================================================= */}
      <section className="py-20 px-4 max-w-6xl mx-auto w-full">
        <BureaucracyChaos onProceedToCivicPulse={scrollToArena} />
      </section>

      {/* =========================================================================
          ACT 2: THE CIVICPULSE REVEAL (CINEMATIC REORGANIZATION)
          ========================================================================= */}
      <section className="py-16 bg-navy text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="text-xs font-bold text-saffron uppercase tracking-wider block mb-2">
            Act 2: The Quantum Architecture Shift
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            How CivicPulse Reorganizes the Chaos
          </h2>
          <p className="text-navy-200 text-sm md:text-base max-w-2xl mx-auto mb-12">
            Instead of asking the citizen to collect 5 paper certificates from 5 different counters,
            CivicPulse communicates directly with the source authorities through a unified, sovereign gateway.
          </p>

          {/* 5-Layer Architectural Flow Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-left">
            {[
              {
                step: "01",
                title: "B3 Gateway",
                desc: "5 Canonical Government Adapters (ITR, CBSE, Caste, LGD, Bank)",
                badge: "Canonical Adapters",
              },
              {
                step: "02",
                title: "B4 Normalization",
                desc: "Cleanses raw payloads into deterministic facts & executes statutory rules",
                badge: "Deterministic Rules",
              },
              {
                step: "03",
                title: "B5 Sanction & PFMS",
                desc: "Generates formal Sanction Orders & clears simulated APBS DBT transfers",
                badge: "Treasury Clearing",
              },
              {
                step: "04",
                title: "B6 Audit Trail",
                desc: "Immutable chronological event ledger with actor hashes & correlation IDs",
                badge: "Zero-Trust Receipts",
              },
              {
                step: "05",
                title: "B7 Intelligence",
                desc: "Advisory heuristic engine detecting name token variance & near-expiry risks",
                badge: "Advisory Integrity",
              },
            ].map((layer, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-navy-800/90 border border-navy-700 relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-saffron">{layer.step}</span>
                    <span className="text-[10px] font-semibold bg-navy-700 text-navy-200 px-2 py-0.5 rounded border border-navy-600">
                      {layer.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">{layer.title}</h3>
                  <p className="text-xs text-navy-300 leading-relaxed">{layer.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ACTS 3 TO 8: THE LIVE SIH DEMONSTRATION ARENA
          ========================================================================= */}
      <section ref={arenaRef} className="py-20 px-4 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Acts 3 to 8: Live Demonstration Arena
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-navy tracking-tight mb-2">
            Experience the End-to-End System
          </h2>
          <p className="text-text-muted text-sm md:text-base">
            Select test scenarios to inspect live B3 verification, B4 deterministic rules, B5 sanction generation, B5 PFMS payment clearing, and B7 advisory intelligence.
          </p>
        </div>

        <PipelineDemonstration />
      </section>

      {/* =========================================================================
          ACT 9: LIFE EVENTS CATALOG
          ========================================================================= */}
      <section className="py-20 bg-background border-t border-card-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-navy mb-2">Sovereign Life-Events Architecture</h2>
            <p className="text-text-muted text-sm md:text-base">
              CivicPulse unifies public service delivery under unified citizen life events with zero document uploads.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lifeEvents.map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={event.href}>
                  <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group border-card-border hover:border-accent">
                    <div className="flex items-start gap-4">
                      <div
                        className="p-3.5 rounded-xl flex-shrink-0"
                        style={{ backgroundColor: event.color + "15" }}
                      >
                        <event.icon className="h-6 w-6" style={{ color: event.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-navy group-hover:text-accent transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-xs text-text-muted mt-1">{event.desc}</p>
                        <span className="inline-flex items-center gap-1 text-xs text-success font-semibold mt-3">
                          <CheckCircle className="h-3.5 w-3.5" /> Zero Upload Required
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SIH ARCHITECTURAL TRANSPARENCY NOTICE
          ========================================================================= */}
      <section className="bg-navy-900 text-white py-12 px-4 border-t border-navy-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-navy-300">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-saffron flex-shrink-0" />
            <div>
              <span className="font-bold text-white block">
                CivicPulse Architectural Simulation Transparency Protocol
              </span>
              <span>
                All government data providers, banking validation networks, and PFMS clearing switches operate in architectural simulation mode (<code>mode: "SIMULATED"</code>).
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="bg-navy-800 text-saffron px-3 py-1.5 rounded-lg border border-navy-700 font-mono text-[11px]">
              Environment: SIH-2026-DEV
            </span>
            <Link
              href="/about"
              className="text-white hover:text-saffron underline font-semibold transition-colors"
            >
              Read Architecture Whitepaper →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}