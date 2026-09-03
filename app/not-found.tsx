import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-saffron/10 flex items-center justify-center mx-auto mb-6">
          <Shield className="h-10 w-10 text-saffron" />
        </div>
        <h1 className="text-6xl font-bold text-navy mb-4">404</h1>
        <h2 className="text-xl font-semibold text-navy mb-2">Page Not Found</h2>
        <p className="text-text-muted text-sm mb-8">
          The page you are looking for does not exist or has been moved.
          This could be a government service that is not yet available in your region.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-saffron hover:bg-saffron-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 border border-card-border text-navy hover:bg-background px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
