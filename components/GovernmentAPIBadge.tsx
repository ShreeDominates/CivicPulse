interface GovernmentAPIBadgeProps {
  apiName: string;
  color?: string;
}

const API_COLORS: Record<string, string> = {
  "API Setu": "#1C5AA0",
  "DigiLocker": "#EB7820",
  "LGD": "#22964A",
  "PFMS": "#7C3AED",
  "Razorpay": "#2D89EF",
  "Aadhaar": "#DC2626",
  "Income Tax": "#1C5AA0",
  "CBSE": "#EB7820",
  "NPCI": "#22964A",
  "Razorpay UPI": "#2D89EF",
};

export default function GovernmentAPIBadge({
  apiName,
  color,
}: GovernmentAPIBadgeProps) {
  const bgColor = color || API_COLORS[apiName] || "#1C5AA0";

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: bgColor }}
    >
      <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 opacity-80" />
      {apiName}
    </span>
  );
}
