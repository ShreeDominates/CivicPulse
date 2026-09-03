import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "bordered";
}

export function Card({ children, className, variant = "default" }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl",
        {
          "bg-white border border-card-border": variant === "default",
          "bg-white shadow-sm border border-card-border": variant === "elevated",
          "bg-white border-2 border-card-border": variant === "bordered",
        },
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("px-6 py-4 border-b border-card-border", className)}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx("px-6 py-4", className)}>{children}</div>;
}
