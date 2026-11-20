# Security Policy

## Reporting a vulnerability

Do not open a public GitHub issue for security vulnerabilities.

Send a private report to **security@edusetu.in** with:

- a description of the issue and affected endpoint or screen,
- reproduction steps or a proof of concept,
- the potential impact,
- your contact details and whether you want credit.

We aim to acknowledge reports within 3 business days and provide a remediation timeline after triage. Please allow reasonable time for a fix before public disclosure. Replace the placeholder inbox with a monitored address before launch.

## Supported versions

Only the current production deployment and the `main` branch receive security fixes.

## Security controls in this repository

| Area | Control |
| --- | --- |
| Authentication | HttpOnly, SameSite session cookies; optional Bearer JWT for trusted API clients |
| CSRF | Double-submit cookie with timing-safe comparison |
| Passwords | bcrypt hashing, dummy comparison to reduce user enumeration |
| OTP | HMAC-SHA256 hashing, 10-minute expiry, attempt limits, e-mail cooldown, IP rate limits |
| Authorization | Role middleware plus per-resource ownership checks |
| Transport | HSTS in production, secure cookies, CSP, frame denial, no-sniff |
| Input | 1 MB JSON limit, upload type/size validation, Sequelize parameterization |
| CORS | Explicit allow-list; production fails without a configured origin |
| Secrets | Production startup validation; no default JWT/admin secrets |
| AI | Input/output guardrails, timeouts, token caps, daily quotas, no silent production mock fallback |
| Privacy | Consent timestamps, data export, account erasure, data-minimized public health endpoints |
| Supply chain | CI audit, gitleaks, Trivy, dependency review, Dependabot |

## Out of scope for automated tests

The repository cannot verify legal compliance, vendor contracts, domain/DNS configuration, TLS termination, backup restoration, or production secret rotation. These are tracked in `docs/PRODUCTION_LAUNCH_CHECKLIST.md`.

## Known limitations

- Runtime Sequelize schema synchronization still exists for development convenience. Production should apply versioned SQL migrations and use the migration as the source of truth.
- Account erasure removes database rows through cascading foreign keys; orphaned uploaded files require an operator retention/cleanup job.
- AI quotas are database-backed per instance-day but use a read-then-increment pattern; a small overrun is possible under extreme concurrency.
- The legal documents are drafts and require review by qualified counsel.
