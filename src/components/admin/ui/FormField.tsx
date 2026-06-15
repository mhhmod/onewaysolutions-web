import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes
} from "react";
import { cn } from "@/lib/cn";

const controlBase =
  "w-full rounded-md border border-border bg-white px-3 text-sm text-primary outline-none transition placeholder:text-steel/70 focus:border-accent disabled:bg-muted disabled:text-steel";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-primary">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-5 text-steel">{hint}</p>
      ) : null}
    </div>
  );
}

type InvalidProp = { invalid?: boolean };

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & InvalidProp>(
  function TextInput({ className, invalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(controlBase, "min-h-11", invalid && "border-danger focus:border-danger", className)}
        aria-invalid={invalid || undefined}
        {...props}
      />
    );
  }
);

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & InvalidProp>(
  function TextArea({ className, invalid, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(controlBase, "py-2.5 leading-6", invalid && "border-danger focus:border-danger", className)}
        aria-invalid={invalid || undefined}
        {...props}
      />
    );
  }
);

export const SelectInput = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & InvalidProp>(
  function SelectInput({ className, invalid, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(controlBase, "min-h-11", invalid && "border-danger focus:border-danger", className)}
        aria-invalid={invalid || undefined}
        {...props}
      >
        {children}
      </select>
    );
  }
);
