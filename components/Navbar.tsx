"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Shield, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageToggle from "./LanguageToggle";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  const publicLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/about", label: t("nav.about") },
  ];

  const protectedLinks = [
    { href: "/dashboard", label: t("nav.dashboard") },
    { href: "/services/scholarship", label: t("nav.scholarship") },
  ];

  const allLinks = [...publicLinks, ...protectedLinks];

  return (
    <nav className="sticky top-0 z-50 bg-navy border-b border-navy-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-saffron" />
            <span className="text-xl font-bold text-white tracking-tight">
              Civic<span className="text-saffron">Pulse</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-saffron"
                    : "text-navy-200 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <LanguageToggle />
            <Link
              href="/login"
              className="bg-saffron hover:bg-saffron-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              {t("nav.login")}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-lg text-sm ${
                  pathname === link.href
                    ? "bg-navy-600 text-saffron"
                    : "text-navy-200 hover:bg-navy-600"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 px-3 py-2">
              <LanguageToggle />
              <Link
                href="/login"
                className="bg-saffron text-white px-4 py-2 rounded-lg text-sm font-semibold"
                onClick={() => setMobileOpen(false)}
              >
                {t("nav.login")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
