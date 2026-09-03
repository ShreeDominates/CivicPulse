"use client";

import { useState } from "react";
import { Shield, CheckCircle, XCircle } from "lucide-react";

interface ConsentBannerProps {
  purpose: string;
  dataSources: string[];
  expiresInDays: number;
  onAuthorize: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConsentBanner({
  purpose,
  dataSources,
  expiresInDays,
  onAuthorize,
  onCancel,
  loading = false,
}: ConsentBannerProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="bg-white border-2 border-accent rounded-xl p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <Shield className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-navy text-lg">
            Data Sharing Consent
          </h3>
          <p className="text-sm text-text-muted mt-1">
            Under the Digital Personal Data Protection Act, 2023 (DPDP Act)
          </p>
        </div>
      </div>

      <div className="bg-background rounded-lg p-4 mb-4">
        <p className="text-sm font-medium text-navy mb-2">
          CivicPulse will fetch the following data on your behalf:
        </p>
        <ul className="space-y-2">
          {dataSources.map((source, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>{source}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-sm text-text-muted mb-4 space-y-1">
        <p>
          <strong>Purpose:</strong> {purpose}
        </p>
        <p>
          <strong>Consent expires:</strong> {expiresInDays} days from now
        </p>
        <p>
          <a href="#" className="text-accent underline hover:text-accent-dark">
            Read our DPDP Act 2023 policy
          </a>
        </p>
      </div>

      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="h-4 w-4 rounded border-card-border text-accent focus:ring-accent"
        />
        <span className="text-sm text-navy">
          I have read and understood the data sharing purpose
        </span>
      </label>

      <div className="flex gap-3">
        <button
          onClick={onAuthorize}
          disabled={!checked || loading}
          className="flex-1 bg-saffron hover:bg-saffron-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
        >
          {loading ? "Authorizing..." : "Authorize & Continue"}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-3 border border-card-border rounded-lg text-text-muted hover:bg-background transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
