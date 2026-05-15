# Advertising Readiness

Advertising starts only after the real intake MVP passes testing, clinical/legal review, and production AWS deployment with `CARDIGAN_REQUIRE_DATABASE=true`.

## Allowed First Campaigns

- Public landing pages for Cardigan Incorporated, Florida telehealth availability, therapy support, EMDR availability, and family support.
- Google Business Profile, local SEO, and search ads pointed at public pages only.
- Generic conversion events such as `consult_request_started` and `consult_request_completed` without names, emails, concerns, diagnoses, session details, or provider notes.

## Not Allowed Before Legal Approval

- Tracking pixels, remarketing, or behavioral ad tags on `/start`, dashboards, messages, sessions, or any authenticated/intake route.
- Uploaded client lists, lookalike audiences from clients, sensitive-health audiences, or ad copy implying the viewer has a condition.
- PHI in ad platform URLs, UTM values, analytics payloads, webhook logs, email/SMS bodies, Stripe metadata, Daily room names, or error reports.

## Launch Checklist

- Confirm all intake, consent, audit, and role-access tests pass.
- Confirm production runs on AWS with Cognito, Aurora/RDS Postgres, KMS, CloudTrail/CloudWatch, and signed BAAs where PHI may flow.
- Confirm public provider data lists Christopher Michael Baird only until additional clinicians are credentialed and approved for publication.
- Confirm privacy-safe analytics run only on public pages and are disabled on PHI/intake/authenticated surfaces.
- Review every ad and landing page for non-diagnostic, non-personal-attribute language before spend starts.
