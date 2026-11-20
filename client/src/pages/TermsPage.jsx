import React from 'react';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';

const LAST_UPDATED = '1 November 2026';

const Section = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-lg sm:text-xl font-black text-slate-900">{title}</h2>
    <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

const TermsPage = ({ onNavigateBack }) => {
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
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
          <p className="text-xs font-semibold text-slate-500">Last updated: {LAST_UPDATED}</p>
        </header>

        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 leading-relaxed">
          <strong>Launch notice:</strong> This is a working draft prepared for the EduSetu beta. It must be reviewed
          and finalized by qualified legal counsel before a public commercial launch.
        </div>

        <Section title="1. Who we are">
          <p>
            EduSetu ("EduSetu", "we", "us") provides a school communication and learning platform that connects
            students, teachers, parents, tutors, schools, and administrators. By creating an account or using the
            service, you agree to these Terms.
          </p>
        </Section>

        <Section title="2. Eligibility and accounts">
          <ul className="list-disc pl-5 space-y-2">
            <li>You must provide accurate registration information and keep it up to date.</li>
            <li>You are responsible for safeguarding your password and for activity under your account.</li>
            <li>Accounts are personal. Do not share credentials or impersonate another person.</li>
            <li>
              Users under 18 may use EduSetu only with the consent and supervision of a parent or legal guardian.
              Schools and guardians are responsible for obtaining any consent required by applicable law.
            </li>
            <li>We may suspend or terminate accounts that violate these Terms or applicable law.</li>
          </ul>
        </Section>

        <Section title="3. Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Harass, bully, threaten, or discriminate against any person.</li>
            <li>Upload malware, attempt to gain unauthorized access, or probe the security of the service.</li>
            <li>Post illegal, defamatory, sexually explicit, or infringing content.</li>
            <li>Use the service to send spam or to scrape data without permission.</li>
            <li>Submit false academic records, impersonate school staff, or misuse another user's data.</li>
          </ul>
        </Section>

        <Section title="4. Educational records and school responsibilities">
          <p>
            Schools and teachers are responsible for the accuracy and lawful use of attendance, homework, marks,
            notices, and other records they enter. EduSetu provides tools to store and share these records but does
            not independently verify them. Parents and students should raise discrepancies with the relevant school.
          </p>
        </Section>

        <Section title="5. AI-assisted features">
          <p>
            EduSetu includes AI-assisted study and teaching tools. AI output may be incomplete, inaccurate, or
            unsuitable for a particular purpose. It is not a substitute for professional educational, medical, legal,
            or mental-health advice. Always review AI output before relying on it. Automated safety filters are used,
            but they cannot guarantee that every harmful or incorrect response is prevented.
          </p>
        </Section>

        <Section title="6. Tutoring marketplace">
          <p>
            Tutor profiles, availability, pricing, and reviews are provided by tutors or generated from submitted
            information. EduSetu is not a party to any tutoring agreement between users unless expressly stated.
            Users must verify qualifications and agree on fees, scheduling, cancellation, and conduct directly.
          </p>
        </Section>

        <Section title="7. Content and intellectual property">
          <p>
            You retain ownership of content you submit. You grant EduSetu a limited licence to host, process, and
            display that content to operate and improve the service. The EduSetu name, logo, software, and design
            remain our property or that of our licensors.
          </p>
        </Section>

        <Section title="8. Service availability and changes">
          <p>
            We aim to keep EduSetu available but do not guarantee uninterrupted service. Features may change,
            be suspended, or be withdrawn. Planned maintenance and emergency fixes may cause downtime.
          </p>
        </Section>

        <Section title="9. Disclaimers and limitation of liability">
          <p>
            To the maximum extent permitted by law, the service is provided "as is" and "as available" without
            warranties of any kind. EduSetu is not liable for indirect, incidental, special, or consequential damages,
            loss of data, or loss of profits arising from use of the service. Nothing in these Terms limits rights
            that cannot be excluded under applicable law.
          </p>
        </Section>

        <Section title="10. Termination">
          <p>
            You may stop using EduSetu at any time and request deletion of your account. We may suspend access for
            security, legal, or policy reasons. Records required for school administration or legal obligations may
            be retained as described in our Privacy Policy.
          </p>
        </Section>

        <Section title="11. Governing law and disputes">
          <p>
            These Terms are governed by the laws of India. Disputes should first be raised with us in good faith.
            Subject to applicable consumer protections, courts in India will have jurisdiction.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions about these Terms can be sent to <strong>support@edusetu.in</strong>. Replace this address with
            the monitored support inbox before launch.
          </p>
        </Section>

        <footer className="pt-6 border-t border-slate-100 flex items-start space-x-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Read our Privacy Policy to understand how account, academic, and communication data is handled.
          </span>
        </footer>
      </article>
    </div>
  );
};

export default TermsPage;
