# Production Launch Checklist — EduSetu

This checklist separates work completed in the repository from actions that only the operator can perform. Do not open registration to real students until every **Blocker** item is complete.

## 1. Repository hardening — completed

- [x] Removed master-password and demo quick-login backdoors from the client.
- [x] Removed administrator and school self-registration; public roles are student, teacher, and parent.
- [x] Moved browser authentication to HttpOnly, SameSite session cookies.
- [x] Kept Bearer JWT support only for trusted API clients; browser storage no longer holds tokens.
- [x] Added double-submit CSRF protection for cookie-authenticated writes.
- [x] Added explicit CORS allow-list and production origin validation.
- [x] Removed hardcoded AI key fallback and seeded demo passwords in production.
- [x] Disabled direct (unverified) production registration; OTP registration is required.
- [x] Hashed OTPs with HMAC, added expiry, attempt limits, cooldown, and IP/e-mail rate limits.
- [x] Added consent evidence (`termsAcceptedAt`, `privacyAcceptedAt`) and Terms/Privacy pages.
- [x] Added self-service data export and account erasure endpoints.
- [x] Added daily per-user and global AI request caps plus provider timeout/token limits.
- [x] Removed health, database, and test metadata leakage from public endpoints.
- [x] Added request IDs, CSP, HSTS, no-store auth responses, and generic error handling.
- [x] Added CI: server tests, client lint/build, dependency audit, gitleaks, Trivy, dependency review.
- [x] Added Dependabot, Docker secret fail-fast, non-root containers, and a versioned migration.
- [x] Added this checklist, security policy, and compliance notes.

## 2. Blockers before real user data

### Secrets and accounts

- [ ] Rotate every credential currently in `server/.env`: TiDB password, AI API key, SMTP password, and any JWT/admin secret. Assume local secrets are compromised if the file was ever shared or committed.
- [ ] Generate new production values with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- [ ] Set `JWT_SECRET`, `OTP_HASH_SECRET`, and `ADMIN_VERIFICATION_PASSWORD` to distinct random values.
- [ ] Confirm the admin account has a unique password, MFA at the identity provider if available, and no shared inbox.
- [ ] Run `npm run rotate-demo-credentials` against the production database with `CONFIRM_DEMO_ROTATION=ROTATE`.
- [ ] Verify `client/dist` and any CDN cache no longer contain `EduSetu@123`, demo e-mails, or old bundles.

### Infrastructure

- [ ] Point a real domain at the deployment and enforce HTTPS with a valid certificate.
- [ ] Set `CLIENT_URL` and `CORS_ORIGIN` to the exact HTTPS origin; do not use wildcards.
- [ ] Set `AUTH_COOKIE_SECURE=true`; use `AUTH_COOKIE_SAMESITE=lax` for same-site deployments.
- [ ] Terminate TLS at the load balancer/reverse proxy and forward `X-Forwarded-Proto`.
- [ ] Restrict MySQL access to the application network; never expose port 3306 publicly.
- [ ] Mount persistent storage for `uploads/` and back it up with the database.
- [ ] Run `npm run check:prod` in the release environment before starting the server.
- [ ] Apply `server/migrations/20261101-production-hardening.sql` and confirm the `ai_usage_daily` table and consent columns exist.
- [ ] Configure automated daily database backups, test a restore, and record the recovery time.
- [ ] Set container memory/CPU limits and a restart policy.

### Email and OTP

- [ ] Configure a transactional email provider with SPF, DKIM, and DMARC for the sending domain.
- [ ] Verify OTP delivery to Gmail, Outlook, and a school domain; check spam placement.
- [ ] Set a monitored `EMAIL_FROM` and reply-to address.
- [ ] Confirm production responses never include `devOtp`.

### AI

- [ ] Set a provider key with a hard monthly spend limit and alert thresholds.
- [ ] Keep `AI_DAILY_USER_LIMIT` and `AI_DAILY_GLOBAL_LIMIT` conservative for the beta.
- [ ] Confirm AI features fail closed in production instead of returning mock answers.
- [ ] Add an AI disclosure near AI outputs and a link to the Terms/Privacy pages.
- [ ] Review the provider's data-retention and training-use settings; disable training on submitted data where possible.

### Legal and compliance

- [ ] Have qualified Indian counsel review the Terms and Privacy Policy drafts.
- [ ] Replace `support@`, `privacy@`, and `security@edusetu.in` with monitored inboxes.
- [ ] Confirm the lawful basis and notice for processing children's data under the DPDP Act, 2023 and applicable school rules.
- [ ] Obtain verifiable parent/guardian consent for minor students and record it.
- [ ] Sign data-processing agreements with hosting, email, AI, and observability vendors.
- [ ] Document retention periods for academic records, messages, AI logs, and backups.
- [ ] Publish a grievance-redressal contact and response timeline.
- [ ] Confirm whether a Data Protection Officer or local representative is required.

### Operations

- [ ] Configure uptime monitoring for `/api/health` and alerting to an on-call channel.
- [ ] Ship structured logs with request IDs to a retained, access-controlled log store.
- [ ] Add error tracking (for example Sentry) with PII scrubbing enabled.
- [ ] Define an incident-response owner and follow `docs/INCIDENT_RESPONSE.md`.
- [ ] Run a load test for login, dashboard, messaging, and AI endpoints at expected beta concurrency.
- [ ] Test account export, account deletion, OTP expiry, CSRF rejection, and rate limits in staging.
- [ ] Prepare a rollback plan for the application image and database migration.
- [ ] Seed only real school data; keep `SEED_INDIAN_TUTORS=false`.

## 3. Beta rollout

- [ ] Recruit 2–3 design-partner schools with a signed pilot agreement.
- [ ] Nominate a school administrator and a teacher champion for each pilot.
- [ ] Import only the minimum roster data needed; avoid Aadhaar, financial data, and medical notes.
- [ ] Run a 30-minute training session for teachers and a short orientation for parents.
- [ ] Provide a feedback channel and a published support window.
- [ ] Review incidents, AI safety logs, latency, and cost weekly during the pilot.
- [ ] Define exit criteria and a data-return/deletion process for schools that leave.

## 4. Commercial readiness

- [ ] Finalize pricing, billing, refunds, and GST treatment with an accountant.
- [ ] Add a payment provider only after PCI scope and webhook security are reviewed.
- [ ] Keep paid courses blocked (API returns HTTP 402) until a real payment gateway, server-side verification, and refund flow exist. There is no simulated checkout in the client.
- [ ] Prepare support macros, escalation paths, and service-level targets.
- [ ] Publish status, security, and privacy pages.
- [ ] Complete a penetration test or independent security review before paid public launch.
