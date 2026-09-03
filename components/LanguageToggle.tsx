"use client";

import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === "hi";

  const toggle = () => {
    i18n.changeLanguage(isHindi ? "en" : "hi");
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-navy-600 hover:bg-navy-500 text-white transition-colors"
    >
      <Globe className="h-3.5 w-3.5" />
      {isHindi ? "EN" : "HI"}
    </button>
  );
}
