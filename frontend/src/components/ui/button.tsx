import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-semibold " +
  "transition-[background-color,box-shadow,transform,filter,color] duration-150 ease-out active:scale-[.98] " +
  "outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 " +
  "[&_svg]:size-[1.15em] [&_svg]:shrink-0";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent-fill text-accent-foreground shadow-card hover:brightness-[.94]",
  secondary: "border border-field-border bg-surface text-foreground shadow-card hover:bg-field",
  ghost: "text-foreground hover:bg-field",
  danger: "bg-danger text-danger-foreground shadow-card hover:brightness-110",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-label",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
};

const ICON_SIZES: Record<ButtonSize, string> = { sm: "size-8", md: "size-9", lg: "size-10" };

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

function Spinner() {
  return (
    <svg data-spinner aria-hidden="true" viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Deshabilita y muestra un spinner; el texto queda para lectores de pantalla. */
  loading?: boolean;
  icon?: ReactNode;
}

/** Botón del sistema de diseño. `type="button"` por defecto: enviar un formulario se pide explícitamente. */
export function Button({ variant, size, loading = false, icon, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

interface LinkButtonProps {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function LinkButton({ href, variant, size, icon, className, children }: LinkButtonProps) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {icon}
      {children}
    </Link>
  );
}

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Nombre accesible obligatorio: un botón solo de ícono no tiene texto. */
  label: string;
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function IconButton({ label, icon, variant = "ghost", size = "md", className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(BASE, VARIANTS[variant], ICON_SIZES[size], "rounded-full p-0", className)}
      {...rest}
    >
      {icon}
    </button>
  );
}
