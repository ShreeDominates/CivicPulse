"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Baby, CheckCircle, Building2, Syringe, UtensilsCrossed } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DEPARTMENTS = [
  { name: "Civil Registration System", service: "Birth Certificate", icon: Building2, color: "#1C5AA0" },
  { name: "PM Matru Vandana Yojana", service: "Maternity Benefit", icon: Baby, color: "#EB7820" },
  { name: "U-WIN Immunization", service: "Vaccination Schedule", icon: Syringe, color: "#22964A" },
  { name: "Anganwadi Services", service: "Nutrition Scheme", icon: UtensilsCrossed, color: "#7C3AED" },
];

export default function BirthRegistrationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [hospital, setHospital] = useState("");
  const [dob, setDob] = useState("");
  const [motherName, setMotherName] = useState("");
  const [fatherName, setFatherName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-navy mb-2">Child Birth Registration</h1>
      <p className="text-text-muted text-sm mb-8">
        Zero document uploads. CivicPulse automatically applies to 4 departments on your behalf.
      </p>

      {!submitted ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Input label="Hospital Name" placeholder="City Hospital" value={hospital} onChange={(e) => setHospital(e.target.value)} />
            <Input label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            <Input label="Mother's Name" placeholder="Mother's full name" value={motherName} onChange={(e) => setMotherName(e.target.value)} />
            <Input label="Father's Name" placeholder="Father's full name" value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
            <Button onClick={handleSubmit} className="w-full" size="lg">
              Submit — Auto-Apply to All Departments
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-success/5 border border-success/20 rounded-xl p-6 text-center mb-6">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
            <h2 className="text-xl font-bold text-success">
              CivicPulse has applied to 4 departments automatically
            </h2>
            <p className="text-text-muted text-sm mt-1">No document uploads required</p>
          </div>

          {DEPARTMENTS.map((dept, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2 }}
            >
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
