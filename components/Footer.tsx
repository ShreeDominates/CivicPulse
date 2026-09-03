import { Shield } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-navy-200 border-t border-navy-700">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-7 w-7 text-saffron" />
              <span className="text-xl font-extrabold text-white tracking-tight">
                Civic<span className="text-saffron">Pulse</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-md text-navy-200">
              Zero-Touch, Life-Event driven sovereign citizen benefit delivery gateway.
              Built by Team UrbanIQ for Smart India Hackathon 2026.
            </p>
            <p className="text-xs mt-3 text-navy-300">
              Government of Maharashtra • Problem Statement SIH26129
            </p>
            <div className="mt-4 p-3 rounded-lg bg-navy-800/80 border border-navy-700 max-w-md text-[11px] text-navy-300">
              <strong className="text-white block mb-0.5">Architectural Simulation Disclosure:</strong>
              All government data providers, banking verification switches, and PFMS disbursement rails operate in high-fidelity architectural simulation mode (<code>mode: "SIMULATED"</code>).
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3 text-sm tracking-wide uppercase">Core Architecture</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/services/scholarship" className="hover:text-white transition-colors">Higher Education Scholarship</Link></li>
              <li><Link href="/services/birth-registration" className="hover:text-white transition-colors">Birth Registration</Link></li>
              <li><Link href="/services/business" className="hover:text-white transition-colors">Business Clearance</Link></li>
              <li><Link href="/services/farmer-support" className="hover:text-white transition-colors">Farmer Support (PM-KISAN)</Link></li>
              <li><Link href="/services/senior-citizen-pension" className="hover:text-white transition-colors">Senior Citizen Pension</Link></li>
              <li><Link href="/services/disability-certificate" className="hover:text-white transition-colors">Disability Certificate</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3 text-sm tracking-wide uppercase">Gateway Adapters</h3>
            <ul className="space-y-2 text-xs">
              <li><span className="text-saffron font-semibold">CBDT Income Tax</span> — API Setu</li>
              <li><span className="text-saffron font-semibold">CBSE DigiLocker</span> — MeitY</li>
              <li><span className="text-saffron font-semibold">Caste Scrutiny Portal</span> — Govt of MH</li>
              <li><span className="text-saffron font-semibold">LGD Cadastre</span> — MoPR</li>
              <li><span className="text-saffron font-semibold">PFMS APBS Rail</span> — Ministry of Finance</li>
              <li><span className="text-saffron font-semibold">Razorpay / NPCI FAV</span> — Bank Validation</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-navy-400">
          <p>&copy; 2026 CivicPulse by UrbanIQ. Open source under MIT License.</p>
          <p className="mt-2 md:mt-0 font-medium text-navy-300">
            Sovereign Benefit Gateway for Smart India Hackathon 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
