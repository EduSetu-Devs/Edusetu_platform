import React from 'react';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';

const LAST_UPDATED = '1 November 2026';

const Section = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-lg sm:text-xl font-black text-slate-900">{title}</h2>
    <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

const PrivacyPage = ({ onNavigateBack }) => {
  return (
    <div className="max-w-3xl mx-auto my-6 px-4 animate-fadeIn">
      <button
        type="button"
        onClick={onNavigateBack}
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 mb-5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <header className="space-y-3 border-b border-slate-100 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
          <p className="text-xs font-semibold text-slate-500">Last updated: {LAST_UPDATED}</p>
        </header>

        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 leading-relaxed">
          <strong>Launch notice:</strong> This is a working draft prepared for the EduSetu beta. It must be reviewed
          and finalized by qualified legal counsel, and the contact and retention details must be confirmed, before a
          public commercial launch.
        </div>

        <Section title="1. Scope">
          <p>
            This policy explains how EduSetu collects, uses, stores, shares, and protects personal data when you use
            our website, applications, and school communication services. It applies to students, parents, teachers,
            tutors, school staff, and administrators.
          </p>
        </Section>

        <Section title="2. Data we collect">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account data:</strong> name, email address, hashed password, phone number, role, and profile image.</li>
            <li><strong>Academic data:</strong> class, section, roll number, attendance, homework, submissions, marks, and teacher feedback.</li>
            <li><strong>Communication data:</strong> messages, notices, and support requests sent through the platform.</li>
            <li><strong>Tutoring data:</strong> tutor profiles, subjects, availability, reviews, bookings, and session records.</li>
            <li><strong>Technical data:</strong> IP address, browser type, device information, request logs, and security events.</li>
            <li><strong>AI feature data:</strong> prompts and content you submit to AI study or teaching tools, plus generated responses.</li>
          </ul>
        </Section>

        <Section title="3. Why we use data">
          <ul className="list-disc pl-5 space-y-2">
            <li>To create and secure accounts and authenticate users.</li>
            <li>To deliver classes, attendance, homework, marks, messaging, and notifications.</li>
            <li>To operate tutor discovery, reviews, bookings, and online classrooms.</li>
            <li>To provide AI-assisted study and teaching features and safety filtering.</li>
            <li>To detect abuse, prevent fraud, investigate security incidents, and comply with law.</li>
            <li>To understand usage and improve reliability, accessibility, and product quality.</li>
          </ul>
        </Section>

        <Section title="4. Legal bases">
          <p>
            Depending on the context, we process data because it is necessary to provide the service you requested,
            because you or your guardian consented, because we have a legitimate interest in operating a safe and
            secure platform, or because the law requires it. Where consent is the basis, you may withdraw it, but
            that may limit features that depend on the data.
          </p>
        </Section>

        <Section title="5. Children and student data">
          <p>
            EduSetu is used in educational settings and may process data about children. Students under 18 must use
            the platform with parent or guardian consent and school authorization. We minimize student data, restrict
            access to authorized school staff and linked guardians, and do not use student data for behavioural
            advertising. Schools are responsible for obtaining any additional consent required by their policies and
            applicable law.
          </p>
        </Section>

        <Section title="6. Sharing">
          <p>We may share data with:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Your school, teachers, and linked guardians as needed for education and administration.</li>
            <li>Tutors and users you choose to interact with through marketplace features.</li>
            <li>Service providers that host infrastructure, send email, or provide AI processing, under contractual safeguards.</li>
            <li>Authorities when required by law or when necessary to protect safety and legal rights.</li>
            <li>A successor entity in a merger, acquisition, or reorganization, subject to this policy.</li>
          </ul>
          <p>We do not sell personal data.</p>
        </Section>

        <Section title="7. International processing">
          <p>
            Some service providers may process data outside your state or country. Where required, we use contractual
            and organizational safeguards for cross-border transfers. AI features may send prompts to third-party
            model providers; avoid submitting sensitive personal data in AI prompts.
          </p>
        </Section>

        <Section title="8. Retention">
          <p>
            We retain account data while the account is active and for a reasonable period afterward to meet legal,
            security, and school-record obligations. Academic records may be retained according to school policy and
            applicable education regulations. Logs are retained for a limited security and troubleshooting period.
            When data is no longer needed, we delete or anonymize it.
          </p>
        </Section>

        <Section title="9. Security">
          <p>
            We use hashed passwords, HttpOnly session cookies, CSRF protection, access controls, rate limiting,
            encryption in transit in production, and audit logging. No system is perfectly secure. Report suspected
            vulnerabilities or incidents to <strong>security@edusetu.in</strong>.
          </p>
        </Section>

        <Section title="10. Your rights">
          <p>
            Subject to applicable law, you may request access, correction, deletion, or a portable copy of your
            personal data, and may object to or restrict certain processing. Parents and guardians may exercise
            rights on behalf of minor students. Contact <strong>privacy@edusetu.in</strong>; we may need to verify
            your identity. You may also complain to the relevant data protection authority.
          </p>
        </Section>

        <Section title="11. Cookies">
          <p>
            We use a strictly necessary HttpOnly session cookie for authentication and a readable CSRF cookie for
            request protection. We do not use advertising cookies. Clearing cookies logs you out.
          </p>
        </Section>

        <Section title="12. Changes and contact">
          <p>
            We may update this policy and will post the revised version with a new date. Material changes will be
            communicated through the platform or email where appropriate. Questions can be sent to
            <strong> privacy@edusetu.in</strong>.
          </p>
        </Section>

        <footer className="pt-6 border-t border-slate-100 flex items-start space-x-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            This policy should be read together with our Terms of Service and any school-specific privacy notice.
          </span>
        </footer>
      </article>
    </div>
  );
};

export default PrivacyPage;
