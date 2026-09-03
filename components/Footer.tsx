import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-navy text-navy-200 border-t border-navy-600">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-saffron" />
              <span className="text-lg font-bold text-white">
                Civic<span className="text-saffron">Pulse</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-md">
              Zero-Touch, Life-Event driven citizen service portal for India.
              Built by Team UrbanIQ for SIH 2026.
            </p>
            <p className="text-xs mt-3 text-navy-300">
              Government of Maharashtra | Problem Statement SIH26129
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/services/scholarship" className="hover:text-white transition-colors">Scholarship</a></li>
              <li><a href="/services/birth-registration" className="hover:text-white transition-colors">Birth Registration</a></li>
              <li><a href="/services/business" className="hover:text-white transition-colors">Business Registration</a></li>
              <li><a href="/services/farmer-support" className="hover:text-white transition-colors">Farmer Support</a></li>
              <li><a href="/services/senior-citizen-pension" className="hover:text-white transition-colors">Senior Citizen Pension</a></li>
              <li><a href="/services/disability-certificate" className="hover:text-white transition-colors">Disability Certificate</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Integrated APIs</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="text-saffron">API Setu</span> — MeitY</li>
              <li><span className="text-saffron">DigiLocker</span> — MeitY</li>
              <li><span className="text-saffron">LGD</span> — MoPR</li>
              <li><span className="text-saffron">PFMS</span> — MoF</li>
              <li><span className="text-saffron">Razorpay</span> — NPCI</li>
              <li><span className="text-saffron">Aadhaar</span> — UIDAI</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-600 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-navy-300">
          <p>&copy; 2026 CivicPulse by UrbanIQ. Open source under MIT License.</p>
          <p className="mt-2 md:mt-0">Built for Smart India Hackathon 2026</p>
        </div>
      </div>
    </footer>
  );
}
