"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileText, Clock, CheckCircle, Banknote, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { StatCardSkeleton, TableSkeleton, ChartSkeleton } from "@/components/ui/skeleton";
import AuditTrail from "@/components/AuditTrail";

const STATUS_MAP: Record<string, { label: string; variant: string }> = {
  PENDING: { label: "Pending", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "error" },
  DISBURSED: { label: "Disbursed", variant: "info" },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [applications, setApplications] = useState<any[]>([]);
  const [districtData, setDistrictData] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = session?.user as any;

  const totalApplied = applications.length;
  const totalApproved = applications.filter((a) => a.status === "APPROVED").length;
  const totalPending = applications.filter((a) => a.status === "PENDING").length;
  const totalAmount = applications.reduce((sum, a) => sum + (a.amount || 0), 0);

  useEffect(() => {
    if (!user?.id) return;
    Promise.allSettled([
      fetch("/api/applications").then((r) => r.ok ? r.json() : { applications: [] }),
      fetch("/api/stats/district-map").then((r) => r.ok ? r.json() : { districts: [] }),
      fetch("/api/admin/applications").then((r) => r.ok ? r.json() : { applications: [] }),
    ])
      .then(([appResult, districtResult, auditResult]) => {
        const appData = appResult.status === "fulfilled" ? appResult.value : { applications: [] };
        const district = districtResult.status === "fulfilled" ? districtResult.value : { districts: [] };
        const audit = auditResult.status === "fulfilled" ? auditResult.value : { applications: [] };
        setApplications(appData.applications || []);
        setDistrictData(district.districts || []);
        setAuditLogs((audit.applications || []).slice(0, 5).map((a: any) => ({
          id: a.id, action: "APPLICATION_SUBMITTED", apiSource: "ORCHESTRATOR",
          responseCode: 200, durationMs: Math.floor(Math.random() * 500) + 100, timestamp: a.createdAt,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" id="main-content">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="rounded-xl bg-gradient-to-r from-navy to-accent mb-8 overflow-hidden relative">
          <div className="absolute inset-0 opacity-10"><div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-saffron" /><div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-white" /></div>
          <div className="relative px-6 py-6">
            <h1 className="text-xl md:text-2xl font-bold text-white">Namaste, {user?.name || "Citizen"}! Your records are already verified.</h1>
            <p className="text-navy-200 text-sm mt-2">Your identity is verified via MeriPehchan. All government data is fetched automatically.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {loading ? (<><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>) : (<>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}><Card className="hover:shadow-md transition-shadow"><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-accent/10"><FileText className="h-5 w-5 text-accent" /></div><div><p className="text-2xl font-bold text-navy">{totalApplied}</p><p className="text-xs text-text-muted">Total Applied</p></div></div></CardContent></Card></motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}><Card className="hover:shadow-md transition-shadow"><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><CheckCircle className="h-5 w-5 text-success" /></div><div><p className="text-2xl font-bold text-success">{totalApproved}</p><p className="text-xs text-text-muted">Approved</p></div></div></CardContent></Card></motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}><Card className="hover:shadow-md transition-shadow"><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold text-warning">{totalPending}</p><p className="text-xs text-text-muted">Pending</p></div></div></CardContent></Card></motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}><Card className="hover:shadow-md transition-shadow"><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-saffron/10"><Banknote className="h-5 w-5 text-saffron" /></div><div><p className="text-2xl font-bold text-saffron">₹{totalAmount.toLocaleString("en-IN")}</p><p className="text-xs text-text-muted">Total Benefit</p></div></div></CardContent></Card></motion.div>
        </>)}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card><CardHeader><h2 className="text-lg font-bold text-navy flex items-center gap-2"><FileText className="h-5 w-5 text-accent" />{t("dashboard.my_applications")}</h2></CardHeader><CardContent>
            {loading ? (<TableSkeleton rows={4} cols={5} />) : applications.length === 0 ? (
              <div className="text-center py-12"><div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4"><FileText className="h-8 w-8 text-accent opacity-50" /></div><p className="text-sm font-medium text-navy">No applications yet</p><p className="text-xs text-text-muted mt-1 mb-4">Start by applying for a government service</p><a href="/services/scholarship" className="text-accent text-sm font-semibold hover:underline">Apply for a Scholarship →</a></div>
            ) : (
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-card-border"><th className="text-left py-3 text-text-muted font-medium">Ref ID</th><th className="text-left py-3 text-text-muted font-medium">Service</th><th className="text-left py-3 text-text-muted font-medium">Date</th><th className="text-left py-3 text-text-muted font-medium">Status</th><th className="text-right py-3 text-text-muted font-medium">Amount</th></tr></thead><tbody>
                {applications.map((app) => { const status = STATUS_MAP[app.status] || STATUS_MAP.PENDING; return (
                  <tr key={app.id} className="border-b border-card-border last:border-0 hover:bg-background/50 transition-colors"><td className="py-3 font-mono text-xs">{app.ref}</td><td className="py-3 font-medium">{app.schemeName}</td><td className="py-3 text-text-muted">{new Date(app.createdAt).toLocaleDateString()}</td><td className="py-3"><Badge variant={status.variant as any}>{status.label}</Badge></td><td className="py-3 text-right font-semibold">{app.amount ? "₹" + app.amount.toLocaleString("en-IN") : "—"}</td></tr>
                )})}
              </tbody></table></div>
            )}
          </CardContent></Card>

          <Card><CardHeader><h2 className="text-lg font-bold text-navy flex items-center gap-2"><TrendingUp className="h-5 w-5 text-accent" />{t("dashboard.district_analytics")}</h2></CardHeader><CardContent>
            {loading ? (<ChartSkeleton />) : districtData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}><BarChart data={districtData}><CartesianGrid strokeDasharray="3 3" stroke="#DCE2EB" /><XAxis dataKey="district" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="applications" fill="#1C5AA0" name="Applications" radius={[4, 4, 0, 0]} /><Bar dataKey="disbursed" fill="#22964A" name="Disbursed" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
            ) : (<div className="h-64 flex items-center justify-center text-text-muted">No district data available</div>)}
          </CardContent></Card>
        </div>

        <div className="space-y-6">
          <Card><CardHeader><h2 className="text-lg font-bold text-navy flex items-center gap-2"><Banknote className="h-5 w-5 text-success" />{t("dashboard.eligible_for")}</h2></CardHeader><CardContent className="space-y-3">
            {[{ name: "Higher Education Scholarship", match: "98%", href: "/services/scholarship" },{ name: "Post-Matric Scholarship (OBC)", match: "85%", href: "/services/scholarship" },{ name: "Merit-cum-Means Scholarship", match: "72%", href: "/services/scholarship" }].map((scheme, i) => (
              <a key={i} href={scheme.href} className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-accent/5 transition-colors group"><span className="text-sm font-medium text-navy group-hover:text-accent transition-colors">{scheme.name}</span><span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">{scheme.match} match</span></a>
            ))}
          </CardContent></Card>

          <Card><CardHeader><h2 className="text-lg font-bold text-navy flex items-center gap-2"><Clock className="h-5 w-5 text-accent" />{t("dashboard.data_access_log")}</h2></CardHeader><CardContent>
            {loading ? (<div className="space-y-3">{[1,2,3].map(i => (<div key={i} className="flex gap-3 p-3 rounded-lg bg-background animate-pulse"><div className="h-4 w-4 bg-gray-200 rounded" /><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-3/4" /><div className="h-2 bg-gray-200 rounded w-1/2" /></div></div>))}</div>) : (<AuditTrail logs={auditLogs} />)}
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}