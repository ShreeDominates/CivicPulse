import { Clock, Database, FileCheck, AlertCircle } from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  apiSource: string;
  responseCode: number;
  durationMs: number;
  timestamp: string;
}

interface AuditTrailProps {
  logs: AuditEntry[];
}

const ACTION_ICONS: Record<string, any> = {
  INCOME_FETCH: Database,
  MARKS_FETCH: FileCheck,
  BANK_VALIDATION: Database,
  SCHOLARSHIP_APPLICATION: FileCheck,
  ADMIN_OVERRIDE: AlertCircle,
};

const ACTION_LABELS: Record<string, string> = {
  INCOME_FETCH: "Your income data was accessed",
  INCOME_FETCH_FAILED: "Income data access failed",
  MARKS_FETCH: "Your CBSE marks were accessed",
  MARKS_FETCH_FAILED: "Marks data access failed",
  BANK_VALIDATION: "Your bank account was verified",
  SCHOLARSHIP_APPLICATION: "Scholarship application submitted",
  ADMIN_OVERRIDE: "Application status was manually updated",
};

export default function AuditTrail({ logs }: AuditTrailProps) {
  if (!logs.length) {
    return (
      <div className="text-center py-8 text-text-muted">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No data access events yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const Icon = ACTION_ICONS[log.action] || Clock;
        return (
          <div
            key={log.id}
            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-card-border"
          >
            <Icon className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-navy font-medium">
                {ACTION_LABELS[log.action] || log.action}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                <span>{log.apiSource}</span>
                <span>•</span>
                <span
                  className={
                    log.responseCode === 200 ? "text-success" : "text-error"
                  }
                >
                  {log.responseCode}
                </span>
                <span>•</span>
                <span>{log.durationMs}ms</span>
                <span>•</span>
                <span>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
