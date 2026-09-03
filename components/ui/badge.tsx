import { clsx } from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "error" | "warning" | "info" | "default";
  className?: string;
}

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-success/10 text-success": variant === "success",
          "bg-error/10 text-error": variant === "error",
          "bg-warning/10 text-warning": variant === "warning",
          "bg-accent/10 text-accent": variant === "info",
          "bg-gray-100 text-text-muted": variant === "default",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
