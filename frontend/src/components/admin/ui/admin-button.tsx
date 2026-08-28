import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground hover:opacity-90",
  secondary: "border border-border bg-surface text-foreground hover:bg-accent-soft hover:text-accent",
  danger: "bg-danger text-danger-foreground hover:opacity-90",
};

const BASE_CLASSES = "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

interface AdminLinkButtonProps {
  href: string;
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

export function AdminLinkButton({ href, variant = "primary", children, className = "" }: AdminLinkButtonProps) {
  return (
    <Link href={href} className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
    </Link>
  );
}

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function AdminButton({ variant = "primary", className = "", children, ...rest }: AdminButtonProps) {
  return (
    <button className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
