"use client";

import { ArrowRight, LockKeyhole, ShieldAlert } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, StatusPill } from "@/components/ui";

const isStaticPreview = process.env.NEXT_PUBLIC_CARDIGAN_STATIC_PREVIEW === "true";

export function ProviderLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isStaticPreview) {
      setError("Provider login is available in the local fullstack app, not the static Pages site.");
      return;
    }

    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/provider-login", {
        body: JSON.stringify({
          email: form.get("email"),
          passcode: form.get("passcode"),
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Provider login failed.");
      }

      router.push("/provider");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Provider login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submitLogin}>
      <div className="rounded-lg border border-[#8db69d] bg-[#e7f2ea] p-4 text-sm text-[#25543b]">
        <div className="flex items-start gap-2">
          <LockKeyhole aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Christopher provider access</p>
            <p className="mt-1 leading-6">
              Use this local fullstack login to review client requests, update intake status, and
              write simple practice notes.
            </p>
            {isStaticPreview ? (
              <div className="mt-3">
                <StatusPill tone="warning">server runtime required</StatusPill>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold" htmlFor="email">
          Provider email
        </label>
        <input
          autoComplete="email"
          className="cardigan-focus rounded-lg border border-border bg-background px-3 py-3"
          defaultValue="christopher@cardiganincorporated.com"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold" htmlFor="passcode">
          Passcode
        </label>
        <input
          autoComplete="current-password"
          className="cardigan-focus rounded-lg border border-border bg-background px-3 py-3"
          id="passcode"
          name="passcode"
          required
          type="password"
        />
        {!isStaticPreview ? (
          <p className="text-xs leading-5 text-muted">
            Local default: cardigan-local-provider
          </p>
        ) : null}
      </div>

      <Button disabled={isSubmitting} icon={ArrowRight} type="submit">
        {isSubmitting ? "Signing in" : "Enter provider workspace"}
      </Button>

      {error ? (
        <div className="rounded-lg border border-[#d99999] bg-[#f7dddd] p-4 text-sm text-[#7d2626]">
          <div className="flex items-start gap-2">
            <ShieldAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      ) : null}
    </form>
  );
}
