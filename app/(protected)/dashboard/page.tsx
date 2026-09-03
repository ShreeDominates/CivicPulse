"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { FileText, Clock, CheckCircle, XCircle, Banknote } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
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

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      fetch("/api/applications").then((r) => r.json()),
      fetch("/api/stats/district-map").then((r) => r.json()),
    ])
      .then(([appData, district]) => {
        setApplications(appData.applications || []);
        setDistrictData(district.districts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="rounded-xl bg-navy mb-8">
          <div className="px-6 py-6">
            <h1 className="text-xl md:text-2xl font-bold text-white">
              Namaste, {user?.name || "Citizen"}! Your records are already verified.
            </h1>
            <p className="text-navy-200 text-sm mt-2">
              Your identity is verified via MeriPehchan. All government data is fetched automatically.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* My Applications */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                {t("dashboard.my_applications")}
              </h2>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No applications yet</p>
                  <a href="/services/scholarship" className="text-accent text-sm underline mt-1 inline-block">
                    Apply for a Scholarship →
                  </a>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-card-border">
                        <th className="text-left py-3 text-text-muted font-medium">Ref ID</th>
                        <th className="text-left py-3 text-text-muted font-medium">Service</th>
                        <th className="text-left py-3 text-text-muted font-medium">Date</th>
                        <th className="text-left py-3 text-text-muted font-medium">Status</th>
                        <th className="text-right py-3 text-text-muted font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => {
                        const status = STATUS_MAP[app.status] || STATUS_MAP.PENDING;
                        return (
                          <tr key={app.id} className="border-b border-card-border last:border-0">
                            <td className="py-3 font-mono text-xs">{app.ref}</td>
                            <td className="py-3">{app.schemeName}</td>
                            <td className="py-3 text-text-muted">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3">
                              <Badge variant={status.variant as any}>{status.label}</Badge>
                            </td>
                            <td className="py-3 text-right font-semibold">
                              {app.amount ? `₹${app.amount.toLocaleString("en-IN")}` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* District Analytics Chart */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-navy">
                {t("dashboard.district_analytics")}
              </h2>
            </CardHeader>
            <CardContent>
              {districtData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={districtData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DCE2EB" />
                    <XAxis dataKey="district" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="applications" fill="#1C5AA0" name="Applications" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="disbursed" fill="#22964A" name="Disbursed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-text-muted">
                  Loading chart data...
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Eligible Schemes */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <Banknote className="h-5 w-5 text-success" />
                {t("dashboard.eligible_for")}
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Higher Education Scholarship", match: "98%", href: "/services/scholarship" },
                { name: "Post-Matric Scholarship (OBC)", match: "85%", href: "#" },
                { name: "Merit-cum-Means Scholarship", match: "72%", href: "#" },
              ].map((scheme, i) => (
                <a
                  key={i}
                  href={scheme.href}
                  className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <span className="text-sm font-medium text-navy">{scheme.name}</span>
                  <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">
                    {scheme.match} match
                  </span>
                </a>
              ))}
            </CardContent>
          </Card>

          {/* Data Access Log */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                {t("dashboard.data_access_log")}
              </h2>
            </CardHeader>
            <CardContent>
              <AuditTrail logs={auditLogs} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
