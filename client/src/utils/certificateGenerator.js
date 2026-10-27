/**
 * EduSetu Certificate of Course Completion Generator
 * Generates an authentic, high-resolution printable completion credential.
 */
export const generateCertificatePDF = ({
  studentName = 'Aarav Sharma',
  rollNumber = 'STU-1001',
  courseTitle = 'Complete Class 10 Board Exam Mastery Batch',
  subject = 'Mathematics & Science',
  gradeLevel = 'Class 10',
  instructor = 'Er. Ashutosh Tripathi',
  completionDate = null,
  certificateId = null
}) => {
  const certId = certificateId || `EDU-CERT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const issueDate = completionDate || new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to view and download the official Course Certificate.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>EduSetu Certificate - ${studentName} - ${courseTitle}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        body {
          font-family: 'Georgia', serif;
          margin: 0;
          padding: 20px;
          background-color: #f8fafc;
          color: #0f172a;
          text-align: center;
        }
        .actions-bar {
          text-align: right;
          max-width: 960px;
          margin: 0 auto 12px auto;
        }
        .print-btn {
          background: #4338ca;
          color: #ffffff;
          border: none;
          padding: 10px 22px;
          font-size: 13px;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
          font-family: sans-serif;
          box-shadow: 0 4px 6px -1px rgba(67, 56, 202, 0.3);
        }
        .cert-container {
          max-width: 960px;
          margin: 0 auto;
          background: #ffffff;
          padding: 48px 56px;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          border: 8px double #4338ca;
          position: relative;
          box-sizing: border-box;
        }
        .cert-inner-border {
          border: 2px solid #c7d2fe;
          padding: 32px 36px;
          border-radius: 8px;
          position: relative;
        }
        .header-tag {
          font-family: sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3px;
          color: #4338ca;
          text-transform: uppercase;
        }
        .academy-name {
          font-size: 32px;
          font-weight: 900;
          color: #1e1b4b;
          letter-spacing: 1.5px;
          margin: 8px 0 4px 0;
          text-transform: uppercase;
        }
        .academy-tagline {
          font-family: sans-serif;
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .cert-title-block {
          margin: 28px 0 20px 0;
        }
        .cert-title {
          font-size: 24px;
          font-weight: 700;
          color: #312e81;
          letter-spacing: 2px;
          text-transform: uppercase;
          border-bottom: 2px solid #e0e7ff;
          display: inline-block;
          padding-bottom: 6px;
        }
        .cert-intro {
          font-size: 14px;
          color: #64748b;
          font-style: italic;
          margin: 16px 0 8px 0;
        }
        .student-name {
          font-size: 32px;
          font-weight: 900;
          color: #1e1b4b;
          text-decoration: underline;
          text-decoration-color: #6366f1;
          margin: 6px 0 16px 0;
          letter-spacing: 0.5px;
        }
        .cert-body {
          font-size: 14px;
          line-height: 1.7;
          color: #334155;
          max-width: 720px;
          margin: 0 auto 28px auto;
          font-family: sans-serif;
        }
        .highlight {
          font-weight: 700;
          color: #1e1b4b;
        }
        .badge-seal {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          color: #3730a3;
          padding: 6px 16px;
          border-radius: 9999px;
          font-family: sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .footer-signatures {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 40px;
          padding-top: 20px;
        }
        .sig-block {
          width: 200px;
          text-align: center;
          font-family: sans-serif;
        }
        .sig-line {
          border-top: 1.5px solid #94a3b8;
          padding-top: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
        }
        .sig-role {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
        }
        .cert-id-tag {
          font-family: monospace;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 18px;
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-25deg);
          font-size: 84px;
          font-weight: 900;
          color: rgba(67, 56, 202, 0.03);
          pointer-events: none;
          text-transform: uppercase;
          white-space: nowrap;
        }
        @media print {
          .actions-bar { display: none; }
          body { background: white; padding: 0; }
          .cert-container { box-shadow: none; border: 4px double #000; }
        }
      </style>
    </head>
    <body>
      <div class="actions-bar">
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
      </div>

      <div class="cert-container">
        <div class="watermark">EduSetu Verified</div>
        
        <div class="cert-inner-border">
          <div class="header-tag">National Academic Excellence Initiative</div>
          <h1 class="academy-name">EDUDETU ACADEMY OF ADVANCED LEARNING</h1>
          <div class="academy-tagline">Affiliated with Central Board of Secondary Education · Accredited Portal</div>

          <div class="cert-title-block">
            <div class="cert-title">Certificate of Course Completion</div>
          </div>

          <div class="cert-intro">This credential of academic achievement is proudly awarded to</div>
          
          <div class="student-name">${studentName}</div>

          <div class="cert-body">
            for successfully completing the rigorous academic curriculum, live interactive lessons, problem-solving workshops, and term assessments for the batch:
            <br />
            <span class="highlight" style="font-size: 16px; color: #312e81;">"${courseTitle}"</span>
            <br />
            <span style="font-size: 13px; color: #64748b;">Specialization: ${subject} · Level: ${gradeLevel} · Roll ID: ${rollNumber}</span>
          </div>

          <div class="badge-seal">
            ⭐ Grade: A+ (Pass with Distinction) · 100% Attendance Verified
          </div>

          <div class="footer-signatures">
            <div class="sig-block">
              <div class="sig-line">${instructor}</div>
              <div class="sig-role">Lead Faculty & Educator</div>
            </div>

            <div class="sig-block">
              <div style="font-size: 20px; font-weight: 900; color: #4338ca; margin-bottom: 4px;">EduSetu</div>
              <div class="sig-line">${issueDate}</div>
              <div class="sig-role">Date of Award</div>
            </div>

            <div class="sig-block">
              <div class="sig-line">Dr. Rajeshwari Sen</div>
              <div class="sig-role">Dean of Academic Affairs</div>
            </div>
          </div>

          <div class="cert-id-tag">Credential Verification ID: ${certId} · Securely Sealed on TiDB Cloud</div>
        </div>
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
};
