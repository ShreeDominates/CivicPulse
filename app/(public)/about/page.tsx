"use client";

import { motion } from "framer-motion";
import {
  Shield, Zap, Database, Globe, ArrowDown, CheckCircle,
  XCircle, Building2, FileText, Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  const problems = [
    "Citizens visit 4+ portals for a single scholarship",
    "Same documents uploaded 8+ times across departments",
    "Average processing time: 21 days for a simple application",
    "No cross-department data sharing or verification",
    "District names spelled differently across portals cause matching failures",
    "No consent tracking under DPDP Act 2023",
  ];

  const solutions = [
    "Single login, single consent, zero document uploads",
    "CivicPulse fetches directly from government APIs",
    "Processing time: 3 seconds with automated eligibility",
    "Interoperability layer normalizes all data schemas",
    "LGD codes standardize all geographic references",
    "Full DPDP Act 2023 compliant consent audit trail",
  ];

  const archLayers = [
    { label: "Citizen Portal (CivicPulse UI)", icon: Users, color: "#EB7820" },
    { label: "Authentication (MeriPehchan / NextAuth)", icon: Shield, color: "#1C5AA0" },
    { label: "Consent Gate (DPDP Act 2023)", icon: CheckCircle, color: "#22964A" },
    { label: "CivicPulse Orchestrator API", icon: Zap, color: "#7C3AED" },
    { label: "Government APIs (API Setu, DigiLocker, LGD)", icon: Globe, color: "#1C5AA0" },
    { label: "Authoritative Registers (Revenue, CBSE, Civil, Parivahan)", icon: Database, color: "#DC2626" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-16 flex-1">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold text-navy mb-4 text-center">
            About CivicPulse
          </h1>
          <p className="text-text-muted text-center mb-12 max-w-2xl mx-auto">
            Eliminating fragmented, paper-based citizen services through intelligent
            interoperability between government digital platforms.
          </p>
        </motion.div>

        {/* Problem vs Solution */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border-error/20">
            <div className="px-6 py-4 bg-error/5 rounded-t-xl border-b border-error/20">
              <h2 className="text-lg font-bold text-error flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                The Problem
              </h2>
            </div>
            <CardContent className="space-y-3 pt-4">
              {problems.map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-error mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-navy">{p}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-success/20">
            <div className="px-6 py-4 bg-success/5 rounded-t-xl border-b border-success/20">
              <h2 className="text-lg font-bold text-success flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Our Solution
              </h2>
            </div>
            <CardContent className="space-y-3 pt-4">
              {solutions.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-navy">{s}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Architecture Diagram */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-navy text-center mb-8">
            System Architecture
          </h2>
          <div className="max-w-2xl mx-auto space-y-3">
            {archLayers.map((layer, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div
                  className="flex items-center gap-3 p-4 rounded-xl border-2"
                  style={{ borderColor: layer.color, backgroundColor: `${layer.color}08` }}
                >
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${layer.color}20` }}>
                    <layer.icon className="h-5 w-5" style={{ color: layer.color }} />
                  </div>
                  <span className="text-sm font-medium text-navy">
                    Layer {i + 1}: {layer.label}
                  </span>
                </div>
                {i < archLayers.length - 1 && (
                  <ArrowDown className="h-4 w-4 text-navy-200 mx-auto my-1" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Integrated APIs */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-navy mb-6">
            Integrated Government APIs
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: "API Setu", color: "#1C5AA0", org: "MeitY" },
              { name: "DigiLocker", color: "#EB7820", org: "MeitY" },
              { name: "Aadhaar / MeriPehchan", color: "#DC2626", org: "UIDAI" },
              { name: "LGD", color: "#22964A", org: "MoPR" },
              { name: "PFMS", color: "#7C3AED", org: "MoF" },
              { name: "Razorpay UPI", color: "#2D89EF", org: "NPCI" },
              { name: "Bhashini", color: "#0891B2", org: "MeitY" },
            ].map((api, i) => (
              <div
                key={i}
                className="px-4 py-2 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: api.color }}
              >
                {api.name} <span className="text-white/60 text-xs">({api.org})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
