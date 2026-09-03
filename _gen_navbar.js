const fs = require('fs');

const navbar = `"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslation } from "react-i18next";
import {
  Menu, X, Shield, ChevronDown, LogOut, LayoutDashboard,
  GraduationCap, Baby, Building2, Leaf, Users, Heart,
} from "lucide-react";
import LanguageToggle from "./LanguageToggle";

const SERVICES = [
  { href: "/services/scholarship", label: "Scholarship", icon: GraduationCap, color: "#1C5AA0" },
  { href: "/services/birth-registration", label: "Birth Registration", icon: Baby, color: "#EB7820" },
  { href: "/services/business", label: "Business Registration", icon: Building2, color: "#22964A" },
  { href: "/services/farmer-support", label: "Farmer Support", icon: Leaf, color: "#16A34A" },
  { href: "/services/senior-citizen-pension", label: "Senior Citizen Pension", icon: Users, color: "#7C3AED" },
  { href: "/services/disability-certificate", label: "Disability Certificate", icon: Heart, color: "#DC2626" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const user = session?.user as any;
  const isLoggedIn = !!session;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) setServicesOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const publicLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/about", label: t("nav.about") },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-navy border-b border-navy-600" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2" aria-label="CivicPulse Home">
            <Shield className="h-8 w-8 text-saffron" />
            <span className="text-xl font-bold text-white tracking-tight">
              Civic<span className="text-saffron">Pulse</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={\`text-sm font-medium transition-colors relative \${
                  pathname === link.href ? "text-saffron" : "text-navy-200 hover:text-white"
                }\`}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-saffron rounded-full" />
                )}
              </Link>
            ))}

            <div ref={servicesRef} className="relative">
              <button
                onClick={() => setServicesOpen(!servicesOpen)}
                className={\`flex items-center gap-1 text-sm font-medium transition-colors \${
                  pathname.startsWith("/services") ? "text-saffron" : "text-navy-200 hover:text-white"
                }\`}
                aria-expanded={servicesOpen}
                aria-haspopup="true"
              >
                {t("nav.services") || "Services"}
                <ChevronDown className={\`h-3.5 w-3.5 transition-transform \${servicesOpen ? "rotate-180" : ""}\`} />
              </button>

              {servicesOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-card-border py-2 z-50">
                  <div className="px-3 py-2 border-b border-card-border">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Government Services</p>
                  </div>
                  {SERVICES.map((svc) => (
                    <Link
                      key={svc.href}
                      href={svc.href}
                      onClick={() => setServicesOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-background transition-colors"
                    >
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: svc.color + "15" }}>
                        <svc.icon className="h-4 w-4" style={{ color: svc.color }} />
                      </div>
                      <span className="text-sm font-medium text-navy">{svc.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {isLoggedIn && (
              <Link
                href="/dashboard"
                className={\`text-sm font-medium transition-colors \${
                  pathname === "/dashboard" ? "text-saffron" : "text-navy-200 hover:text-white"
                }\`}
              >
                {t("nav.dashboard")}
              </Link>
            )}

            <LanguageToggle />

            {isLoggedIn ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-navy-600 hover:bg-navy-500 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-7 h-7 rounded-full bg-saffron flex items-center justify-center text-xs font-bold text-white">
                    {(user?.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline font-medium max-w-[100px] truncate">{user?.name || "User"}</span>
                  <ChevronDown className={\`h-3.5 w-3.5 transition-transform \${userMenuOpen ? "rotate-180" : ""}\`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-card-border py-2 z-50">
                    <div className="px-3 py-2 border-b border-card-border">
                      <p className="text-sm font-semibold text-navy truncate">{user?.name}</p>
                      <p className="text-xs text-text-muted truncate">{user?.email}</p>
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/10 text-accent">
                        {user?.role || "CITIZEN"}
                      </span>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 hover:bg-background transition-colors text-sm text-navy"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    {user?.role === "ADMIN" && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 hover:bg-background transition-colors text-sm text-navy"
                      >
                        <Shield className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-1 border-card-border" />
                    <button
              
