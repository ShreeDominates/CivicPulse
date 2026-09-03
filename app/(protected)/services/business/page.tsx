"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, CheckCircle, FileText, Landmark, CreditCard } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DEPARTMENTS = [
  { name: "Ministry of MSME", service: "Udyam Registration", icon: Building2, color: "#1C5AA0" },
  { name: "GST Network", service: "GST Registration", icon: FileText, color: "#EB7820" },
  { name: "Ministry of Corporate Affairs", service: "Company Incorporation", icon: Landmark, color: "#22964A" },
  { name: "PMEGP Portal", service: "Credit Guarantee Scheme", icon: CreditCard, color: "#7C3AED" },
];

export default function BusinessPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-navy mb-2">MSME / Business Registration</h1>
      <p className="text-text-muted text-sm mb-8">
        Register your business across all departments in one go. Zero document uploads.
      </p>

      {!submitted ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Input label="Business Name" placeholder="My Business Pvt Ltd" />
            <Input label="Business Type" placeholder="Private Limited / Partnership / Sole Proprietorship" />
            <Input label="Owner Aadhaar" placeholder="1234 5678 9012" />
            <Input label="PAN Number" placeholder="ABCDE1234F" />
            <Button onClick={() => setSubmitted(true)} className="w-full" size="lg">
              Register Business — Auto-Apply to All Departments
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-success/5 border border-success/20 rounded-xl p-6 text-center mb-6">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
            <h2 className="text-xl font-bold text-success">
              Applications submitted to 4 departments
            </h2>
          </div>
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
                  <CheckCircle className="h-5 w-5 text-success" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
