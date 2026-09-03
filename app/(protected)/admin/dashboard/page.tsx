"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import {
  Shield, AlertTriangle, Activity, CheckCircle, Clock, Ban,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";

const MOCK_DAILY_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `Sep ${i + 1}`,
  received: Math.floor(Math.random() * 50) + 20,
  approved: Math.floor(Math.random() * 40) + 15,
}));

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [apiHealth, setApiHealth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const user = session?.user as any;

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadData();
    loadApiHealth();
  }, [user, statusFilter]);

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/applications?${params}`);
      if (!res.ok) {
        setApplications([]);
        setPagination({ page: 1, total: 0, pages: 0 });
      } else {
        const data = await res.json();
        setApplications(data.applications || []);
        setPagination(data.pagination || { page: 1, total: 0, pages: 0 });
      }
    } catch {
      setApplications([]);
    }
    setLoading(false);
  };

  const loadApiHealth = async () => {
    try {
      const res = await fetch("/api/admin/api-health");
      if (res.ok) {
        const data = await res.json();
        setApiHealth(data.apis || []);
      }
    } catch {}
  };

  const handleOverride = async (id: string, status: string) => {
    const reason = prompt(`Reason for setting status to ${status}:`);
    if (!reason) return;
    try {
      await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      loadData(pagination.page);
    } catch {}
  };

  const getHealthColor = (ms: number) => {
    if (ms < 500) return "text-success";
    if (ms < 2000) return "text-warning";
    return "text-error";
  };

  const getHealthDot = (ms: number) => {
    if (ms < 500) return "bg-success";
    if (ms < 2000) return "bg-warning";
    return "bg-error";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-2xl font-bold text-navy">Admin Dashboard</h1>
            <p className="text-text-muted text-sm">Government Officer View — All Applications</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Charts */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-navy">Daily Applications vs Approved (Last 30 Days)</h2>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={MOCK_DAILY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DCE2EB" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="received" stroke="#1C5AA0" name="Received" strokeWidth={2} />
                  <Line type="monotone" dataKey="approved" stroke="#22964A" name="Approved" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* API Health */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              API Health
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {apiHealth.map((api, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getHealthDot(api.lastResponseMs)}`} />
                  <span className="text-navy truncate max-w-[140px]">{api.name}</span>
                </div>
                <span className={`font-mono text-xs ${getHealthColor(api.lastResponseMs)}`}>
                  {api.lastResponseMs}ms
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-bold text-navy">
            All Applications ({pagination.total})
          </h2>
          <div className="flex gap-2">
            {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  statusFilter === s
                    ? "bg-accent text-white"
                    : "bg-background text-text-muted hover:bg-card-border"
                }`}
              >
                {s || "All"}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="text-left py-3 text-text-muted font-medium">Ref ID</th>
                  <th className="text-left py-3 text-text-muted font-medium">Citizen</th>
                  <th className="text-left py-3 text-text-muted font-medium">Scheme</th>
                  <th className="text-left py-3 text-text-muted font-medium">Status</th>
                  <th className="text-left py-3 text-text-muted font-medium">Amount</th>
                  <th className="text-right py-3 text-text-muted font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-card-border last:border-0">
                    <td className="py-3 font-mono text-xs">{app.ref}</td>
                    <td className="py-3">{app.citizenName}</td>
                    <td className="py-3 text-text-muted">{app.schemeName}</td>
                    <td className="py-3">
                      <Badge
                        variant={
                          app.status === "APPROVED" ? "success" :
                          app.status === "REJECTED" ? "error" :
                          app.status === "DISBURSED" ? "info" : "warning"
                        }
                      >
                        {app.status}
                      </Badge>
                    </td>
                    <td className="py-3 font-semibold">
                      {app.amount ? `₹${app.amount.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="py-3 text-right">
                      {app.status === "PENDING" && (
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOverride(app.id, "APPROVED")}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleOverride(app.id, "REJECTED")}
                          >
                            <Ban className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-muted">
                      No applications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: pagination.pages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => loadData(i + 1)}
                  className={`px-3 py-1 rounded text-sm ${
                    pagination.page === i + 1
                      ? "bg-accent text-white"
                      : "bg-background text-text-muted"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
