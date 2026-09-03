"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  GraduationCap, Baby, Building2, Leaf, Users, Heart,
  ArrowRight, Shield, Zap, CheckCircle, Banknote,
  Clock, Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";

function AnimatedCounter({ target, duration = 2 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const start = 0;
    const end = target;
    const stepTime = (duration * 1000) / 60;
    const increment = (end - start) / (duration * 60);
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) { current = end; clearInterval(timer); }
      setCount(Math.floor(current));
    }, stepTime);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString("en-IN")}</span>;
}

export default function LandingPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/stats/disbursements")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const lifeEvents = [
    { icon: GraduationCap, title: t("life_events.scholarship"), href: "/services/scholarship", color: "#1C5AA0" },
    { icon: Baby, title: t("life_events.birth"), href: "/services/birth-registration", color: "#EB7820" },
    { icon: Building2, title: t("life_events.business"), href: "/services/business", color: "#22964A" },
    { icon: Leaf, title: t("life_events.farmer"), href: "#", color: "#16A34A" },
    { icon: Users, title: t("life_events.pension"), href: "#", color: "#7C3AED" },
    { icon: Heart, title: t("life_events.disability"), href: "#", color: "#DC2626" },
  ];

  const steps = [
    { num: "1", title: t("how_it_works.step1"), desc: t("how_it_works.step1_desc"), icon: Shield },
    { num: "2", title: t("how_it_works.step2"), desc: t("how_it_works.step2_desc"), icon: CheckCircle },
    { num: "3", title: t("how_it_works.step3"), desc: t("how_it_works.step3_desc"), icon: Zap },
    { num: "4", title: t("how_it_works.step4"), desc: t("how_it_works.step4_desc"), icon: Shield },
    { num: "5", title: t("how_it_works.step5"), desc: t("how_it_works.step5_desc"), icon: Banknote },
  ];

  const apiBadges = [
    { name: "API Setu", color: "#1C5AA0" },
    { name: "DigiLocker", color: "#EB7820" },
    { name: "Aadhaar", color: "#DC2626" },
    { name: "LGD", color: "#22964A" },
    { name: "PFMS", color: "#7C3AED" },
    { name: "Razorpay UPI", color: "#2D89EF" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-navy text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
              {t("hero.subtitle")}
            </h1>
            <p className="text-xl md:text-2xl text-navy-200 mb-2 font-semibold">
              {t("hero.title")} — {t("hero.description").split(".")[0]}
            </p>
            <p className="text-sm text-navy-300 mb-8">{t("hero.team")}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services/scholarship"
                className="bg-saffron hover:bg-saffron-dark text-white px-8 py-3.5 rounded-lg font-semibold text-lg transition-colors inline-flex items-center gap-2"
              >
                {t("hero.cta_primary")} <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#how-it-works"
                className="border border-navy-200 hover:border-white text-white px-8 py-3.5 rounded-lg font-semibold text-lg transition-colors"
              >
                {t("hero.cta_secondary")}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="py-16 bg-white border-b border-card-border">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}>
            <Card className="p-6 text-center">
              <p className="text-3xl md:text-4xl font-bold text-accent">
                {stats ? <AnimatedCounter target={stats.totalScholarshipsDisbursed} /> : <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />}
              </p>
              <p className="text-sm text-text-muted mt-2">{t("stats.total_scholarships")}</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <Card className="p-6 text-center">
              <p className="text-3xl md:text-4xl font-bold text-saffron">
                {stats ? <AnimatedCounter target={stats.studentsBenefited2026} /> : <Loader2 className="h-8 w-8 animate-spin mx-auto text-saffron" />}
              </p>
              <p className="text-sm text-text-muted mt-2">{t("stats.students_benefited")}</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <Card className="p-6 text-center">
              <p className="text-3xl md:text-4xl font-bold text-error">
                <Clock className="h-8 w-8 inline mr-2" />
                21 {t("stats.days")}
              </p>
              <p className="text-sm text-text-muted mt-2">{t("stats.old_processing")}</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <Card className="p-6 text-center bg-success/5 border-success/20">
              <p className="text-3xl md:text-4xl font-bold text-success">
                <Zap className="h-8 w-8 inline mr-2" />
                3 {t("stats.seconds")}
              </p>
              <p className="text-sm text-text-muted mt-2">{t("stats.new_processing")}</p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Life Events Grid */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-navy text-center mb-2">{t("life_events.title")}</h2>
          <p className="text-text-muted text-center mb-10">{t("life_events.subtitle")}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lifeEvents.map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={event.href}>
                  <Card className="p-6 hover:shadow-md transition-all duration-200 cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl" style={{ backgroundColor: `${event.color}15` }}>
                        <event.icon className="h-6 w-6" style={{ color: event.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy group-hover:text-accent transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-xs text-success font-medium mt-1">
                          Zero Document Upload Required
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">{t("how_it_works.title")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-full bg-saffron text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">
                  {step.num}
                </div>
                <step.icon className="h-6 w-6 text-accent mx-auto mb-2" />
                <h3 className="font-semibold text-navy text-sm">{step.title}</h3>
                <p className="text-xs text-text-muted mt-1">{step.desc}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-navy-200 mx-auto mt-3 hidden md:block rotate-90 md:rotate-0" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrated APIs */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-navy mb-8">Integrated Government APIs</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {apiBadges.map((api, i) => (
              <span
                key={i}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-white shadow-sm"
                style={{ backgroundColor: api.color }}
              >
                {api.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
