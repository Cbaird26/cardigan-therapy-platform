# Live Coordination

This is the operating lane for getting Cardigan live without compromising HIPAA.

## Source Of Truth

- Public marketing site: Cardigan pages and GitHub/static preview.
- Clinical booking, client portal, payments, and clinical messaging: SimplePractice.
- Local working dashboard: `http://127.0.0.1:3000/provider`.
- Operations workspace: Notion `Cardigan Incorporated OS`.
- Master inbox: `cbaird26@gmail.com`.

## Today Status

- Local Cardigan server is running on `http://127.0.0.1:3000`.
- Provider dashboard login works with the local provider passcode.
- The provider dashboard shows live local request, client, session, risk, and Notion OS panels.
- SimplePractice account email verification was found in `cbaird26@gmail.com` and opened.
- SimplePractice request URL is wired into local env and the GitHub Pages workflow:
  `https://christopher-michael-baird.clientsecure.me/request/prescreener-reason-for-care`
- Master Gmail command-center labels were applied for business, house/insurance, payments, practice admin, recent replies, and visible account identities.
- Ad campaign assets are ready in `docs/advertising-readiness.md`.

## SimplePractice Launch Path

SimplePractice should be the clinical system used for live booking now. Keep client names,
intake forms, symptoms, diagnoses, appointment details, payments tied to care, and secure
messages inside SimplePractice until Cardigan has the production AWS HIPAA stack live.

Setup sequence:

1. Finish SimplePractice onboarding and account verification.
2. Confirm practice name, timezone, phone, telehealth location, and public address visibility.
3. Turn on Client Portal.
4. Set and copy the SimplePractice Client Portal domain.
5. Turn on online appointment requests.
6. Create availability blocks for consults and enable online appointment requests on those blocks.
7. Confirm services bookable by new clients.
8. Keep `NEXT_PUBLIC_SIMPLEPRACTICE_BOOKING_URL` set to the SimplePractice request URL.
9. Rebuild and deploy the static public site so the main CTA is `Book secure consult`.

## Google Ads Launch Path

Use Google Search only at first. Ads can point to a public Cardigan landing page or to the
SimplePractice secure booking/client-portal link after the portal is configured.

Do not use:

- Remarketing.
- Uploaded client lists.
- Sensitive health-condition audiences.
- Tracking pixels on intake/authenticated/clinical pages.
- Ad copy that implies the searcher has a diagnosis or sensitive condition.

## HIPAA Boundary

Notion, Gmail labels, Google Ads, and public pages are operating systems only. Do not put PHI,
clinical notes, symptoms, diagnoses, message text, or intake answers into those systems.
