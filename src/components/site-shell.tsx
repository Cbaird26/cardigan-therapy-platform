import {
  CalendarClock,
  HeartHandshake,
  LayoutDashboard,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "./ui";

const navItems = [
  { href: "/start", label: "Start" },
  { href: "/pricing", label: "Pricing" },
  { href: "/providers", label: "Providers" },
  { href: "/groups", label: "Groups" },
  { href: "/client", label: "Client" },
  { href: "/provider", label: "Provider" },
  { href: "/admin", label: "Admin" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link className="cardigan-focus flex items-center gap-3 no-underline" href="/">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HeartHandshake aria-hidden className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-tight">Cardigan Incorporated</span>
              <span className="hidden text-xs text-muted sm:block">Therapy matching and membership care</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {navItems.map((item) => (
              <Link
                className="cardigan-focus rounded-lg px-3 py-2 text-sm font-medium text-muted no-underline hover:bg-surface-muted hover:text-foreground"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ButtonLink href="/client" icon={MessageSquareText} variant="secondary">
              Portal
            </ButtonLink>
            <ButtonLink href="/start" icon={Sparkles}>Begin</ButtonLink>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-muted md:grid-cols-[1.2fr_1fr_1fr] md:px-6">
          <div>
            <p className="font-semibold text-foreground">Cardigan Incorporated</p>
            <p className="mt-2 max-w-xl leading-6">
              Florida pilot platform for curated therapy matching, membership care, secure messaging,
              live sessions, and safety-bounded AI support.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["HIPAA-ready", ShieldCheck],
              ["Live sessions", CalendarClock],
              ["Care teams", UsersRound],
              ["Provider tools", Stethoscope],
              ["Dashboards", LayoutDashboard],
            ].map(([label, Icon]) => (
              <span
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
                key={label as string}
              >
                <Icon aria-hidden className="h-4 w-4" />
                {label as string}
              </span>
            ))}
          </div>
          <p className="leading-6">
            Production use requires signed BAAs, clinical/legal review, and vendor approval before
            collecting PHI, payments, or AI conversations.
          </p>
        </div>
      </footer>
    </div>
  );
}
