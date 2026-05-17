"use client";

import { ArrowRight, CheckCircle2, LogIn, ShieldAlert } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Button, ButtonLink, StatusPill } from "@/components/ui";
import { clinicalBooking } from "@/lib/booking";
import { buildConsultSlots } from "@/lib/consult-slots";
import { starterDeposit } from "@/lib/revenue";

type OnboardingResult = {
  clientId: string;
  intakeId: string;
  status: "admin-review" | "manual-review" | "out-of-state";
  matches: Array<{
    provider: {
      credentials: string;
      displayName: string;
      id: string;
    };
    reasons: string[];
    score: number;
  }>;
  requestedSession?: {
    endsAt?: string | Date;
    id: string;
    startsAt?: string | Date;
    status?: string;
  } | null;
  storageMode: "memory" | "prisma";
};

const isStaticPreview = process.env.NEXT_PUBLIC_CARDIGAN_STATIC_PREVIEW === "true";

export function IntakeForm() {
  const consultSlots = useMemo(() => buildConsultSlots(), []);
  const [result, setResult] = useState<OnboardingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (isStaticPreview) {
      setError(
        "This public page accepts starter deposits only. Complete clinical intake through the approved secure workflow.",
      );
      return;
    }

    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const requestedSessionStartsAt = form.get("requestedSessionStartsAt");
    const payload = {
      email: form.get("email"),
      legalName: form.get("legalName"),
      preferredName: form.get("preferredName"),
      phone: form.get("phone"),
      clientState: form.get("clientState"),
      ageRange: form.get("ageRange"),
      concerns: form.getAll("concerns"),
      modalityPreference: form.get("modalityPreference"),
      requestedSessionStartsAt:
        typeof requestedSessionStartsAt === "string" ? requestedSessionStartsAt : undefined,
      schedulePreference: form.get("schedulePreference"),
      wantsAiSupport: form.get("wantsAiSupport") === "on",
      consentedToMatch: form.get("consentedToMatch") === "on",
      acceptedTerms: form.get("acceptedTerms") === "on",
      acceptedPrivacy: form.get("acceptedPrivacy") === "on",
      acceptedTelehealth: form.get("acceptedTelehealth") === "on",
    };

    try {
      const response = await fetch("/api/onboarding", {
        body: JSON.stringify(payload),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const contentType = response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "This page is not connected to the secure intake API. Use the approved private workflow for clinical intake.",
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Intake could not be submitted.");
      }

      setResult(data);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Intake could not be submitted from this environment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isStaticPreview) {
    return (
      <div className="grid gap-5">
        <div className="grid gap-4 rounded-lg border border-[#8db69d] bg-[#e7f2ea] p-5 text-sm text-[#25543b]">
          <div className="flex items-start gap-2">
            <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">
                {clinicalBooking.isSimplePracticeEnabled
                  ? "Secure SimplePractice booking is live"
                  : "Online starter step is live"}
              </p>
              <p className="mt-1 leading-6">
                {clinicalBooking.isSimplePracticeEnabled
                  ? "Use SimplePractice to request a consult, register in the client portal, and use the reviewed clinical workflow. Keep clinical details out of public ad, analytics, and payment fields."
                  : "Use this secure Stripe link to reserve the starter deposit for onboarding coordination. Keep payment fields generic: no symptoms, diagnoses, session notes, or clinical details."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href={clinicalBooking.href} icon={ArrowRight}>
              {clinicalBooking.label}
            </ButtonLink>
            <ButtonLink href="/provider-login" icon={LogIn} variant="secondary">
              Provider login
            </ButtonLink>
            {clinicalBooking.isSimplePracticeEnabled ? (
              <ButtonLink href={starterDeposit.paymentUrl} icon={ArrowRight} variant="secondary">
                Generic deposit
              </ButtonLink>
            ) : null}
            <span className="text-xs font-semibold">
              {clinicalBooking.isSimplePracticeEnabled
                ? "Client registration, booking, and telehealth run through SimplePractice."
                : `${starterDeposit.amount} generic deposit. No symptoms, diagnoses, or session details.`}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-5">
          <p className="text-sm font-semibold text-foreground">What happens next</p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted">
            <li className="flex gap-2">
              <CheckCircle2 aria-hidden className="mt-1 h-4 w-4 shrink-0 text-primary" />
              Clinical requests are handled in SimplePractice for the live launch.
            </li>
            <li className="flex gap-2">
              <CheckCircle2 aria-hidden className="mt-1 h-4 w-4 shrink-0 text-primary" />
              Cardigan remains the public front door and internal operating dashboard.
            </li>
            <li className="flex gap-2">
              <CheckCircle2 aria-hidden className="mt-1 h-4 w-4 shrink-0 text-primary" />
              Clinical details are collected only through the private secure intake workflow, not
              through Stripe, GitHub Pages, Notion, ads, or public pages.
            </li>
            <li className="flex gap-2">
              <CheckCircle2 aria-hidden className="mt-1 h-4 w-4 shrink-0 text-primary" />
              Christopher Michael Baird is the only listed clinician for the Florida pilot.
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={submitIntake}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-semibold" htmlFor="legalName">
            Legal name
          </label>
          <input
            className="cardigan-focus rounded-lg border border-border bg-background px-3 py-3"
            id="legalName"
            name="legalName"
            required
            type="text"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-semibold" htmlFor="preferredName">
            Preferred name
          </label>
          <input
            className="cardigan-focus rounded-lg border border-border bg-background px-3 py-3"
            id="preferredName"
            name="preferredName"
            type="text"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-semibold" htmlFor="email">
            Email
          </label>
          <input
            className="cardigan-focus rounded-lg border border-border bg-background px-3 py-3"
            id="email"
            name="email"
            required
            type="email"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-semibold" htmlFor="phone">
            Phone
          </label>
          <input
            className="cardigan-focus rounded-lg border border-border bg-background px-3 py-3"
            id="phone"
            name="phone"
            type="tel"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold" htmlFor="clientState">
          State at time of session
        </label>
        <select
          className="cardigan-focus rounded-lg border border-border bg-background px-3 py-3"
          defaultValue="FL"
          id="clientState"
          name="clientState"
        >
          <option value="FL">Florida</option>
          <option value="OUT">Outside Florida</option>
        </select>
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold">Age range</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {["child", "teen", "adult"].map((age) => (
            <label
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-3 text-sm capitalize"
              key={age}
            >
              <input defaultChecked={age === "adult"} name="ageRange" type="radio" value={age} />
              {age}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold">Care focus</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {["anxiety", "trauma", "stress", "family", "adhd", "life-transitions"].map(
            (concern) => (
              <label
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-3 text-sm"
                key={concern}
              >
                <input
                  defaultChecked={["anxiety", "trauma", "stress"].includes(concern)}
                  name="concerns"
                  type="checkbox"
                  value={concern}
                />
                {concern}
              </label>
            ),
          )}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-semibold" htmlFor="modalityPreference">
            Modality preference
          </label>
          <select
            className="cardigan-focus rounded-lg border border-border bg-background px-3 py-3"
            defaultValue="emdr"
            id="modalityPreference"
            name="modalityPreference"
          >
            {["emdr", "cbt", "dbt", "family", "skills", "unsure"].map((modality) => (
              <option key={modality} value={modality}>
                {modality.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-semibold" htmlFor="schedulePreference">
            Schedule preference
          </label>
          <select
            className="cardigan-focus rounded-lg border border-border bg-background px-3 py-3"
            defaultValue="evening"
            id="schedulePreference"
            name="schedulePreference"
          >
            {["weekday", "evening", "weekend", "flexible"].map((schedule) => (
              <option key={schedule} value={schedule}>
                {schedule}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="grid gap-3 rounded-lg border border-border bg-surface p-4">
        <legend className="px-1 text-sm font-semibold">Choose a consult slot</legend>
        <p className="text-sm leading-6 text-muted">
          This requests a time for Christopher to review. It is not confirmed until the provider
          accepts it.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {consultSlots.map((slot, index) => (
            <label
              className="flex min-h-16 items-center gap-2 rounded-lg border border-border bg-background px-3 py-3 text-sm"
              key={slot.startsAt}
            >
              <input
                defaultChecked={index === 0}
                name="requestedSessionStartsAt"
                type="radio"
                value={slot.startsAt}
              />
              <span>{slot.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-2">
        {[
          ["acceptedTerms", "I accept the Cardigan terms for this intake."],
          ["acceptedPrivacy", "I accept the privacy notice for this intake."],
          ["acceptedTelehealth", "I consent to telehealth eligibility review."],
          ["consentedToMatch", "I consent to provider matching from these answers."],
          ["wantsAiSupport", "I am interested in optional AI skills support after review."],
        ].map(([name, label]) => (
          <label
            className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3 text-sm"
            key={name}
          >
            <input
              defaultChecked={name !== "wantsAiSupport"}
              name={name}
              required={name !== "wantsAiSupport"}
              type="checkbox"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <Button disabled={isSubmitting} icon={ArrowRight} type="submit">
        {isSubmitting ? "Submitting" : "Submit for review"}
      </Button>

      {error ? (
        <div className="rounded-lg border border-[#d99999] bg-[#f7dddd] p-4 text-sm text-[#7d2626]">
          <div className="flex items-start gap-2">
            <ShieldAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="rounded-lg border border-[#8db69d] bg-[#e7f2ea] p-4 text-sm text-[#25543b]">
          <div className="flex items-start gap-2">
            <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">
                Booking request received for provider review.
              </p>
              <p className="mt-1">Reference: {result.intakeId.slice(0, 18)}</p>
              {result.requestedSession?.startsAt ? (
                <p className="mt-1">
                  Requested slot:{" "}
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "America/New_York",
                  }).format(new Date(result.requestedSession.startsAt))}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill tone="success">{result.storageMode}</StatusPill>
                {result.matches.map((match) => (
                  <StatusPill key={match.provider.id}>{match.provider.displayName}</StatusPill>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
