"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "nav.home": "Home",
      "nav.about": "About",
      "nav.dashboard": "Dashboard",
      "nav.scholarship": "Scholarship",
      "nav.login": "Login",
      "nav.logout": "Logout",
      "hero.title": "CivicPulse",
      "hero.subtitle": "Sarkari Kaam, Ab 3 Second Mein",
      "hero.description": "Zero-Touch, Life-Event driven citizen service portal. Instead of uploading PDFs to multiple government portals, CivicPulse connects directly to government APIs and fetches, verifies, and processes all data automatically.",
      "hero.cta_primary": "Apply for a Service",
      "hero.cta_secondary": "See How It Works",
      "hero.team": "Built by Team UrbanIQ for 1.4 billion citizens",
      "stats.total_scholarships": "Total Scholarships Disbursed This Year",
      "stats.students_benefited": "Students Benefited in 2026",
      "stats.old_processing": "Average Old Processing Time",
      "stats.new_processing": "CivicPulse Processing Time",
      "stats.days": "Days",
      "stats.seconds": "Seconds",
      "life_events.title": "Services Available",
      "life_events.subtitle": "Zero Document Upload Required",
      "life_events.scholarship": "Higher Education Scholarship",
      "life_events.birth": "Child Birth Registration",
      "life_events.business": "MSME / Business Registration",
      "life_events.farmer": "Farmer Support (PM-KISAN)",
      "life_events.pension": "Senior Citizen Pension",
      "life_events.disability": "Disability Certificate",
      "how_it_works.title": "How CivicPulse Works",
      "how_it_works.step1": "Login Once",
      "how_it_works.step1_desc": "Verify identity via MeriPehchan",
      "how_it_works.step2": "Give Consent",
      "how_it_works.step2_desc": "Authorize under DPDP Act 2023",
      "how_it_works.step3": "We Fetch",
      "how_it_works.step3_desc": "Automatic government API calls",
      "how_it_works.step4": "Auto Verify",
      "how_it_works.step4_desc": "Cross-department verification",
      "how_it_works.step5": "Instant Approval",
      "how_it_works.step5_desc": "DBT to your bank account",
      "dashboard.greeting": "Namaste, {{name}}! Your identity is already verified.",
      "dashboard.my_applications": "My Applications",
      "dashboard.eligible_for": "You May Be Eligible For",
      "dashboard.district_analytics": "District-wise Scholarship Disbursements",
      "dashboard.data_access_log": "My Data Access Log"
    }
  },
  hi: {
    translation: {
      "nav.home": "होम",
      "nav.about": "हमारे बारे में",
      "nav.dashboard": "डैशबोर्ड",
      "nav.scholarship": "छात्रवृत्ति",
      "nav.login": "लॉगिन",
      "nav.logout": "लॉगआउट",
      "hero.title": "सिविकपल्स",
      "hero.subtitle": "सरकारी काम, अब 3 सेकंड में",
      "hero.description": "ज़ीरो-टच, लाइफ-इवेंट ड्रिवन नागरिक सेवा पोर्टल। सिविकपल्स सरकारी API से सीधे जुड़ता है।",
      "hero.cta_primary": "सेवा के लिए आवेदन करें",
      "hero.cta_secondary": "देखें यह कैसे काम करता है",
      "hero.team": "1.4 अरब नागरिकों के लिए टीम UrbanIQ द्वारा निर्मित",
      "stats.total_scholarships": "इस वर्ष कुल छात्रवृत्ति वितरित",
      "stats.students_benefited": "2026 में लाभान्वित छात्र",
      "stats.old_processing": "पुरानी औसत प्रसंस्करण समय",
      "stats.new_processing": "सिविकपल्स प्रसंस्करण समय",
      "stats.days": "दिन",
      "stats.seconds": "सेकंड",
      "life_events.title": "उपलब्ध सेवाएँ",
      "life_events.subtitle": "शून्य दस्तावेज़ अपलोड आवश्यक",
      "life_events.scholarship": "उच्च शिक्षा छात्रवृत्ति",
      "life_events.birth": "बच्चे का जन्म पंजीकरण",
      "life_events.business": "MSME / व्यवसाय पंजीकरण",
      "life_events.farmer": "किसान सहायता (पीएम-किसान)",
      "life_events.pension": "वरिष्ठ नागरिक पेंशन",
      "life_events.disability": "विकलांगता प्रमाणपत्र",
      "how_it_works.title": "सिविकपल्स कैसे काम करता है",
      "how_it_works.step1": "एक बार लॉगिन करें",
      "how_it_works.step1_desc": "मेरी पहचान से पहचान सत्यापित करें",
      "how_it_works.step2": "सहमति दें",
      "how_it_works.step2_desc": "डीपीडीपी अधिनियम 2023 के तहत प्राधिकरण",
      "how_it_works.step3": "हम प्राप्त करते हैं",
      "how_it_works.step3_desc": "स्वचालित सरकारी API कॉल",
      "how_it_works.step4": "स्वतः सत्यापन",
      "how_it_works.step4_desc": "अंतर-विभागीय सत्यापन",
      "how_it_works.step5": "तत्काल अनुमोदन",
      "how_it_works.step5_desc": "आपके बैंक खाते में DBT",
      "dashboard.greeting": "नमस्ते, {{name}}! आपकी पहचान पहले से सत्यापित है।",
      "dashboard.my_applications": "मेरे आवेदन",
      "dashboard.eligible_for": "आप इनके लिए पात्र हो सकते हैं",
      "dashboard.district_analytics": "जिला-वार छात्रवृत्ति वितरण",
      "dashboard.data_access_log": "मेरा डेटा एक्सेस लॉग"
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
