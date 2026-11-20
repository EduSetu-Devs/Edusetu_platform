# Legal and Compliance Notes (India)

These notes are engineering guidance, not legal advice. Qualified counsel must review the Terms, Privacy Policy, school agreements, and data flows before launch.

## Applicable frameworks to assess

- **Digital Personal Data Protection Act, 2023 (DPDP Act)** and its rules as notified.
- **Information Technology Act, 2000** and intermediary/cyber-security rules where applicable.
- **Juvenile Justice and child-protection obligations** relevant to platforms used by minors.
- **School and education-department policies** applicable to student records.
- **Consumer protection and payment rules** once paid plans are introduced.

## Data inventory

| Data | Purpose | Sensitivity | Retention owner |
| --- | --- | --- | --- |
| Name, e-mail, phone, role | Account and communication | Personal | Operator |
| Student class, section, roll number | School administration | Personal, minor | School |
| Attendance, homework, marks, feedback | Education delivery | Academic record | School |
| Messages and notices | Parent-teacher communication | Personal | Operator/school |
| Tutor profile, reviews, bookings | Marketplace | Personal | Operator |
| AI prompts and responses | Study assistance and safety | May contain personal data | Operator |
| Logs, IP, request IDs | Security and reliability | Personal/technical | Operator |
| Consent timestamps | Compliance evidence | Personal | Operator |

Do not collect Aadhaar numbers, financial account data, medical records, or biometric data unless a documented legal need and safeguard exist.

## Consent and minors

- Registration requires affirmative acceptance of Terms and Privacy.
- A parent or guardian must consent for users under 18; schools must have a mechanism to verify this.
- Consent must be free, specific, informed, and withdrawable.
- Do not bundle consent to optional marketing with account creation.
- Record the policy version, timestamp, account, and method of consent.

## Data-principal rights

The application provides:

- **Access/portability**: `GET /api/account/export`
- **Erasure**: `DELETE /api/account` with password and typed confirmation

Operators must also support correction, grievance redressal, and consent withdrawal through a monitored channel. Some academic records may need to be retained for legal or school obligations; document the basis and retention period.

## Vendor processing

Before launch, execute data-processing terms with:

- cloud/database hosting,
- transactional e-mail,
- AI model provider,
- error tracking and logging,
- backup and storage providers.

Confirm cross-border transfer safeguards, sub-processors, breach-notification duties, retention, and training-use restrictions.

## Security and breach response

Maintain reasonable technical and organizational safeguards, access controls, audit trails, encryption in transit, backups, and an incident-response plan. Follow `docs/INCIDENT_RESPONSE.md`.

## Content and marketplace

- Publish tutor verification limits and a review/reporting process.
- Prohibit abusive, discriminatory, or unsafe conduct.
- Define refunds, cancellation, and dispute handling before taking payments.
- Do not present AI output as professional advice.

## Launch gate

- [ ] Counsel-approved Terms and Privacy with a version identifier.
- [ ] Monitored privacy and grievance inboxes.
- [ ] Parental-consent mechanism documented for each pilot school.
- [ ] Vendor DPAs signed.
- [ ] Retention schedule approved.
- [ ] Breach-notification decision tree approved.
