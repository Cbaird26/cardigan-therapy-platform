# Cardigan Incorporated Therapy Platform

A Next.js, TypeScript, Prisma, PostgreSQL, and AWS CDK scaffold for a HIPAA-ready therapy marketplace.

The app is BetterHelp-inspired but original: Cardigan branding, Florida-first matching, membership care, secure messaging, live-session boundaries, provider switching, dashboards, and a safety-bounded AI companion.

## What is implemented

- Public routes: `/`, `/start`, `/pricing`, `/providers`, `/groups`
- Role routes: `/client`, `/provider`, `/admin`
- Care routes: `/session/:id`, `/messages/:threadId`
- API routes for persisted intake, matching, consent signing, admin review, role-aware dashboards, provider switching, secure messages, session requests, checkout gating, Stripe webhook idempotency, AI safety routing, assessments, notes, and audit export
- Prisma schema for the core platform entities
- Unit tests for matching, role access, consent gates, Stripe webhook idempotency, Daily room naming, AI safety, and PHI metadata checks
- Provider-gated Notion Company OS sync for operational records only, with PHI/client clinical data excluded
- AWS CDK scaffold for Cognito, KMS, S3, Aurora Postgres, CloudTrail, and audit logs
- PWA manifest and security headers

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## GitHub Pages demo

This repo includes `.github/workflows/pages.yml` for a static GitHub Pages demo.

```bash
npm run build:pages
```

GitHub Pages can host the public/client/provider/admin demo screens, but it cannot run
the Next.js API routes. For production PHI, messaging, payments, Daily video, Bedrock AI,
and database-backed workflows, deploy the app to a server-capable HIPAA-ready platform.
The Pages build marks intake as preview-only, disables real intake submissions,
and links to a generic Cardigan Starter Deposit Stripe Payment Link.

## Verification

```bash
npm run lint
npm test
npm run build
```

Optional browser smoke tests:

```bash
npm run test:e2e
```

Optional infrastructure synthesis:

```bash
npm run cdk:synth
```

Advertising guardrails are documented in `docs/advertising-readiness.md`.

## Environment

Copy `.env.example` to `.env.local` for local work.

Production PHI use requires signed BAAs and legal/clinical approval before enabling real vendor calls.

Required production decisions:

- `DATABASE_URL`: Aurora/RDS Postgres connection string
- `CARDIGAN_DATA_STORE`: use `prisma` for server-backed environments and `memory` only for local demos/tests
- `CARDIGAN_REQUIRE_DATABASE`: set to `true` in production so DB failures do not fall back to memory
- `CARDIGAN_ENABLE_BILLING`, `CARDIGAN_ENABLE_VIDEO`, `CARDIGAN_ENABLE_AI`: keep `false` until vendor BAAs, approvals, and legal/clinical review are complete
- `NEXT_PUBLIC_CARDIGAN_PAYMENT_LINK`: public Stripe Payment Link for a generic non-PHI starter deposit
- `NEXT_PUBLIC_SIMPLEPRACTICE_BOOKING_URL`: public SimplePractice booking/client portal URL for tonight's live clinical path
- `STRIPE_SECRET_KEY`: Stripe account approved for the intended telehealth billing use
- `DAILY_API_KEY` and `DAILY_DOMAIN`: Daily Healthcare/HIPAA account
- `AWS_REGION` and `BEDROCK_MODEL_ID`: AWS Bedrock model in an approved account/region
- `NOTION_TOKEN` plus the `NOTION_*_DATABASE_ID` values: Notion Company OS integration, limited to operations. Do not use it for PHI unless Notion Enterprise, BAA, and HIPAA workspace configuration are complete.

## Compliance boundaries

- Do not send symptoms, diagnoses, therapist names, session details, notes, or client names to Stripe metadata.
- Do not put PHI in Daily room names, notification text, error reports, analytics, or logs.
- Do not sync legal names, phone numbers, emails, symptoms, diagnoses, intake answers, clinical notes, messages, AI conversations, assessments, or crisis details into Notion. The Notion integration is Company OS only: tasks, SOPs, marketing, finance, provider operations counts, and sync logs.
- AI is limited to intake guidance, skills coaching, and between-session support. It must not diagnose, replace therapy, make treatment decisions, or handle emergencies.
- Crisis language routes to emergency guidance and provider/admin review.
- The platform record MVP is not a full EHR replacement.
