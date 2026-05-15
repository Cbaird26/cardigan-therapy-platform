import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentType, ReactNode } from "react";

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

export function ButtonLink({
  href,
  children,
  icon: Icon,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  icon?: Icon;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const className = {
    primary:
      "bg-primary text-primary-foreground border-primary hover:bg-[#244b40]",
    secondary:
      "bg-surface text-foreground border-border hover:bg-surface-muted",
    ghost:
      "bg-transparent text-foreground border-transparent hover:bg-surface-muted",
  }[variant];

  return (
    <Link
      className={`cardigan-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold no-underline transition ${className}`}
      href={href}
    >
      {Icon ? <Icon aria-hidden className="h-4 w-4 shrink-0" /> : null}
      <span>{children}</span>
    </Link>
  );
}

export function Button({
  children,
  icon: Icon,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  icon?: Icon;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const variantClassName = {
    primary:
      "bg-primary text-primary-foreground border-primary hover:bg-[#244b40]",
    secondary:
      "bg-surface text-foreground border-border hover:bg-surface-muted",
    ghost:
      "bg-transparent text-foreground border-transparent hover:bg-surface-muted",
  }[variant];

  return (
    <button
      className={`cardigan-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClassName} ${className}`}
      {...props}
    >
      {Icon ? <Icon aria-hidden className="h-4 w-4 shrink-0" /> : null}
      <span>{children}</span>
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border bg-surface p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  copy,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
      {copy ? <p className="mt-3 text-base leading-7 text-muted">{copy}</p> : null}
    </div>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const className = {
    neutral: "border-border bg-surface-muted text-foreground",
    success: "border-[#8db69d] bg-[#e7f2ea] text-[#25543b]",
    warning: "border-[#d6b369] bg-[#f5ead2] text-[#6c4b13]",
    danger: "border-[#d99999] bg-[#f7dddd] text-[#7d2626]",
  }[tone];

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}
