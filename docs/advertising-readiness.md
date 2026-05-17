# Advertising Readiness

Advertising has two separate launch tracks.

Track 1 can start as soon as the destination is a public Cardigan page or a reviewed
SimplePractice booking/client-portal link. This track must not collect therapy intake
answers inside GitHub Pages, localhost, Notion, Google Ads, or analytics.

Track 2, ads that point into the Cardigan-owned clinical intake flow, starts only after
the real intake MVP passes testing, clinical/legal review, and production AWS deployment
with `CARDIGAN_REQUIRE_DATABASE=true`.

## Allowed First Campaigns

- Public landing pages for Cardigan Incorporated, Florida telehealth availability, therapy support, EMDR availability, and family support.
- Google Business Profile, local SEO, and search ads pointed at public pages only.
- Public landing pages that send booking to a SimplePractice secure booking/client portal link after the account is configured.
- Generic conversion events such as `consult_request_started` and `consult_request_completed` without names, emails, concerns, diagnoses, session details, or provider notes.
- Generic starter-deposit payments through Stripe Payment Links, with no symptoms, diagnoses, notes, or clinical details in Stripe fields.

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

## HIPAA-Safe Starter Campaign

Use search intent and geography only. Do not use remarketing, uploaded customer lists,
lookalike audiences, health-condition audiences, or ad copy that implies the viewer has a
diagnosis or sensitive condition.

Initial campaign structure:

- Campaign: `Cardigan Florida Telehealth`
- Geography: Florida only
- Landing page: public marketing page first, then SimplePractice secure booking or AWS Cardigan intake after production approval
- Conversion: `consult_request_completed`, counted only after stripping names, emails, phone
  numbers, concerns, diagnoses, session details, and message text
- Exclusions: no tracking pixels on `/start`, `/provider`, `/client`, `/messages`, `/session`,
  or any route that can contain intake or account data

Safe ad copy examples:

- `Cardigan Incorporated | Florida Telehealth Therapy`
- `Virtual Therapy Support In Florida`
- `Work With Christopher Michael Baird`
- `Private Online Therapy Requests`

## Today Launch Pack

Use this only with a public Cardigan landing page or a SimplePractice secure booking link.
Do not send traffic into localhost, GitHub Pages forms that collect clinical details, Notion,
or any form that stores PHI outside an approved system.

Campaign:

- Name: `Cardigan FL Telehealth - Search - Public`
- Network: Google Search only
- Location: Florida, United States
- Language: English
- Destination: `https://christopher-michael-baird.clientsecure.me/request/prescreener-reason-for-care` or a public Cardigan landing page that links there
- Daily starter budget: choose a controlled test budget before publishing
- Bidding: maximize clicks or manual CPC until conversion tracking is reviewed
- Tracking: no remarketing, no customer lists, no sensitive audience segments, no intake-page pixels

Ad group 1: `Florida Telehealth Therapy`

- `florida telehealth therapist`
- `online therapy florida`
- `virtual therapy florida`
- `licensed mental health counselor florida`
- `emdr therapist florida online`

Ad group 2: `Christopher Baird Therapy`

- `christopher baird therapist`
- `christopher michael baird counseling`
- `cardigan incorporated therapy`
- `cardigan therapy florida`

Responsive search ad assets:

- Headlines:
  - `Cardigan Incorporated`
  - `Florida Telehealth Therapy`
  - `Work With Christopher Baird`
  - `Private Online Consult Requests`
  - `Online Therapy Support In Florida`
  - `Secure Booking Available`
- Descriptions:
  - `Request a private telehealth consult with Cardigan Incorporated. Florida availability with Christopher Michael Baird.`
  - `A calm, secure way to request online therapy support in Florida. Booking uses reviewed clinical workflows.`
  - `Start with a public overview, then use secure booking for clinical information. No sensitive details in ad tracking.`

Negative keywords:

- `free`
- `jobs`
- `salary`
- `school`
- `internship`
- `reddit`
- `pdf`
- `definition`

Avoid copy like:

- `Struggling with anxiety?`
- `Trauma therapy for your symptoms`
- `ADHD treatment near you`
- `We know you need therapy`

References checked May 17, 2026:

- Google Ads healthcare and medicines policy: https://support.google.com/adspolicy/answer/176031
- Google Ads personalized advertising restrictions: https://support.google.com/adspolicy/answer/143465
- HHS online tracking guidance: https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/hipaa-online-tracking/
