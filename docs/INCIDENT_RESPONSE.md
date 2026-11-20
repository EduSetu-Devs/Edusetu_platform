# Incident Response Runbook

## Severity levels

- **SEV-1**: confirmed data breach, unauthorized admin access, exposed student data, or full outage.
- **SEV-2**: partial outage, credential stuffing, AI safety failure affecting users, or payment disruption.
- **SEV-3**: degraded performance, single-school issue, or non-sensitive bug.

## First 30 minutes

1. Assign an incident commander and a scribe.
2. Open a private incident channel; do not discuss personal data there.
3. Contain: revoke sessions by rotating `JWT_SECRET`, disable affected accounts, block abusive IPs, or take the affected service offline.
4. Preserve evidence: snapshot logs, request IDs, database state, and relevant audit records. Do not delete data.
5. Determine whether personal data, minors' data, credentials, or payment data were involved.
6. Notify the system owner and, for SEV-1, legal counsel.

## Investigation

- Identify the entry point: stolen credential, CSRF, injection, misconfigured CORS, dependency compromise, upload abuse, or AI prompt leakage.
- Check `audit_logs`, authentication logs, reverse-proxy logs, email-provider logs, and AI provider usage.
- Establish the time window and affected accounts.
- Avoid making public statements until facts are verified.

## Remediation

- Patch the root cause, add a regression test, and deploy through the normal CI gate.
- Rotate every potentially exposed secret and invalidate sessions.
- Re-enable service in stages and monitor error rates, auth failures, and AI cost.
- Record the timeline and decisions in a post-incident report.

## Notification

Legal counsel decides whether breach notification is required under the DPDP Act, 2023, school contracts, or other applicable law. Notify affected schools and guardians with clear, non-technical language. Do not speculate about cause or scope.

## Post-incident

- Hold a blameless review within 5 business days.
- Add preventive controls and owners with due dates.
- Update this runbook and the launch checklist.
- Verify backups and restore procedures if data integrity was affected.
