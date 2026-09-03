import { forwardRef } from "react";
import { clsx } from "clsx";
import { CheckCircle } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  verified?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, verified, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-navy">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={clsx(
              "w-full px-4 py-2.5 rounded-lg border bg-white text-sm transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
              error
                ? "border-error"
                : "border-card-border hover:border-navy-200",
              verified && "pr-10",
              props.disabled && "bg-background cursor-not-allowed",
              className
            )}
            {...props}
          />
          {verified && (
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />
          )}
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
