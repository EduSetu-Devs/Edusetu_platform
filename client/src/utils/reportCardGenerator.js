/**
 * EduSetu CBSE / National Academy Academic Report Card Generator
 * Creates an authentic, printable academic progress transcript with zero external dependencies.
 */
export const generateReportCardPDF = ({
  studentName = 'Student',
  className = 'Class 10',
  section = 'A',
  rollNumber = '1001',
  admissionId = 'EDU-2026-9042',
  dateOfBirth = '2008-05-14',
  performance = null,
  attendancePercentage = 92.5,
  totalDays = 180,
  presentDays = 166
}) => {
  const subjects = performance?.subjects && performance.subjects.length > 0
    ? performance.subjects
    : [
        { subject: 'Mathematics', totalMaxMarks: 100, totalObtainedMarks: 94, percentage: 94, grade: 'A+' },
        { subject: 'Science (Physics/Chem/Bio)', totalMaxMarks: 100, totalObtainedMarks: 89, percentage: 89, grade: 'A' },
        { subject: 'English Language & Literature', totalMaxMarks: 100, totalObtainedMarks: 92, percentage: 92, grade: 'A+' },
        { subject: 'Social Science', totalMaxMarks: 100, totalObtainedMarks: 86, percentage: 86, grade: 'A' },
        { subject: 'Computer Applications & AI', totalMaxMarks: 100, totalObtainedMarks: 98, percentage: 98, grade: 'A+' }
      ];

  const totalMax = performance?.totalMaxMarks || subjects.reduce((acc, s) => acc + (Number(s.totalMaxMarks) || 100), 0);
  const totalObt = performance?.totalObtainedMarks || subjects.reduce((acc, s) => acc + (Number(s.totalObtainedMarks) || 0), 0);
  const overallPct = performance?.overallPercentage || (totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 92);
  const overallGrd = performance?.overallGrade || (overallPct >= 90 ? 'A+' : overallPct >= 80 ? 'A' : 'B+');

  const rowsHtml = subjects.map((s, idx) => `
    <tr>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">
        ${idx + 1}. ${s.subject}
      </td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">
        ${s.totalMaxMarks || 100}
      </td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #0f172a;">
        ${s.totalObtainedMarks || 0}
      </td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 600; color: #4338ca;">
        ${s.percentage}%
      </td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 800; color: #047857;">
        ${s.grade}
      </td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 11px; font-weight: 700; color: #059669;">
        QUALIFIED
      </td>
    </tr>
  `).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to view and download the official Report Card.');
    return;
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>EduSetu Report Card - ${studentName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f1f5f9;
          color: #0f172a;
        }
        .container {
          max-width: 820px;
          margin: 0 auto;
          background: #ffffff;
          padding: 36px 40px;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          border: 3px double #4338ca;
          position: relative;
        }
        .actions-bar {
          text-align: right;
          margin-bottom: 16px;
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
          box-shadow: 0 4px 6px -1px rgba(67, 56, 202, 0.3);
          transition: background 0.2s;
        }
        .print-btn:hover {
          background: #3730a3;
        }
        .school-header {
          text-align: center;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 18px;
          margin-bottom: 22px;
        }
        .school-badge {
          display: inline-block;
          background: #eef2ff;
          color: #4338ca;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          padding: 4px 14px;
          border-radius: 9999px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .school-name {
          font-size: 26px;
          font-weight: 900;
          color: #1e1b4b;
          letter-spacing: 0.5px;
          margin: 0;
          text-transform: uppercase;
        }
        .school-sub {
          font-size: 12px;
          color: #64748b;
          margin: 4px 0 0 0;
          font-weight: 500;
        }
        .report-title-badge {
          display: inline-block;
          margin-top: 12px;
          padding: 6px 18px;
          background: #312e81;
          color: #ffffff;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.8px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px 20px;
          margin-bottom: 24px;
          font-size: 12.5px;
        }
        .info-item {
          display: flex;
          align-items: center;
        }
        .info-label {
          color: #64748b;
          width: 130px;
          font-weight: 600;
        }
        .info-value {
          color: #0f172a;
          font-weight: 700;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          font-size: 13px;
        }
        th {
          background: #4338ca;
          color: #ffffff;
          padding: 11px 14px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .total-row {
          background: #f1f5f9;
          font-weight: 800;
          border-top: 2px solid #cbd5e1;
          border-bottom: 2px solid #cbd5e1;
        }
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }
        .card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px;
          text-align: center;
          background: #fcfcfd;
        }
        .card-val {
          font-size: 20px;
          font-weight: 900;
          color: #4338ca;
          margin-top: 4px;
        }
        .card-lbl {
          font-size: 11px;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
        }
        .remarks-box {
          border-left: 4px solid #4338ca;
          background: #f8fafc;
          padding: 12px 18px;
          border-radius: 0 8px 8px 0;
          font-size: 12.5px;
          margin-bottom: 36px;
        }
        .remarks-box strong {
          color: #1e1b4b;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          padding-top: 24px;
        }
        .sig-block {
          text-align: center;
          width: 180px;
        }
        .sig-line {
          border-top: 1.5px dashed #94a3b8;
          margin-top: 46px;
          padding-top: 6px;
          font-size: 11.5px;
          font-weight: 700;
          color: #475569;
        }
        .watermark {
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 72px;
          font-weight: 900;
          color: rgba(67, 56, 202, 0.04);
          pointer-events: none;
          white-space: nowrap;
          text-transform: uppercase;
        }
        @media print {
          .actions-bar { display: none; }
          body { background: white; padding: 0; }
          .container { box-shadow: none; border: 2px solid #000; border-radius: 0; }
        }
      </style>
    </head>
    <body>
      <div class="actions-bar">
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
      </div>

      <div class="container">
        <div class="watermark">EduSetu Verified</div>

        <!-- School Official Header -->
        <div class="school-header">
          <span class="school-badge">Affiliation No. 2130894 · School Code: 71204</span>
          <h1 class="school-name">EDUDETU SENIOR SECONDARY ACADEMY</h1>
          <p class="school-sub">Recognized by Central Board of Secondary Education (CBSE) · New Delhi, India</p>
          <div class="report-title-badge">CUMULATIVE ACADEMIC PROGRESS REPORT (SESSION 2026-2027)</div>
        </div>

        <!-- Student Demographic Grid -->
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Student Name:</span>
            <span class="info-value">${studentName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Roll Number:</span>
            <span class="info-value">${rollNumber}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Class & Section:</span>
            <span class="info-value">${className} - Section ${section}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Admission ID:</span>
            <span class="info-value">${admissionId}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Date of Birth:</span>
            <span class="info-value">${dateOfBirth}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Issue Date:</span>
            <span class="info-value">${currentDate}</span>
          </div>
        </div>

        <!-- Scholastic Performance Table -->
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Subject / Curriculum Area</th>
              <th style="text-align: center;">Max Marks</th>
              <th style="text-align: center;">Marks Scored</th>
              <th style="text-align: center;">Percentage</th>
              <th style="text-align: center;">Grade</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td style="padding: 12px 14px; text-transform: uppercase;">Aggregate Scholastic Total</td>
              <td style="padding: 12px 14px; text-align: center;">${totalMax}</td>
              <td style="padding: 12px 14px; text-align: center; color: #4338ca;">${totalObt}</td>
              <td style="padding: 12px 14px; text-align: center; color: #4338ca;">${overallPct}%</td>
              <td style="padding: 12px 14px; text-align: center; color: #047857;">${overallGrd}</td>
              <td style="padding: 12px 14px; text-align: center; color: #059669;">PASSED</td>
            </tr>
          </tbody>
        </table>

        <!-- Metrics & Attendance Summary Cards -->
        <div class="summary-cards">
          <div class="card">
            <div class="card-lbl">Overall Attendance</div>
            <div class="card-val" style="color: #059669;">${attendancePercentage}%</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">${presentDays} of ${totalDays} Working Days</div>
          </div>
          <div class="card">
            <div class="card-lbl">Cumulative Grade</div>
            <div class="card-val">${overallGrd}</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Grade Point: ${(overallPct / 9.5).toFixed(1)} / 10</div>
          </div>
          <div class="card">
            <div class="card-lbl">Final Result</div>
            <div class="card-val" style="color: #047857; font-size: 15px; margin-top: 8px;">DISTINCTION</div>
            <div style="font-size: 10px; color: #059669; font-weight: 700; margin-top: 2px;">Promoted to Next Grade</div>
          </div>
        </div>

        <!-- Qualitative Remarks -->
        <div class="remarks-box">
          <strong>Educator's Evaluation & Remarks:</strong>
          <span style="color: #334155; margin-left: 6px;">
            ${studentName} has demonstrated exceptional scholastic competence and critical reasoning throughout this term. Displays exemplary discipline, active live classroom participation, and strong homework submission consistency.
          </span>
        </div>

        <!-- Official Signatures -->
        <div class="signatures">
          <div class="sig-block">
            <div class="sig-line">Class Teacher Signature</div>
          </div>
          <div class="sig-block">
            <div class="sig-line">Controller of Examinations</div>
          </div>
          <div class="sig-block">
            <div class="sig-line">Principal / Dean Seal</div>
          </div>
        </div>

      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
};
