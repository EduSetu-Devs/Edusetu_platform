/**
 * EduSetu Academic Progress Report Generator
 * Creates a printable academic progress transcript with zero external dependencies.
 * All academic values come from the caller; nothing is fabricated when data is missing.
 */

const escapeHtml = (str) =>
  String(str ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));

const displayValue = (value) => {
  if (value === null || value === undefined || value === '') return 'Not recorded';
  return escapeHtml(value);
};

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const sessionLabel = () => {
  const now = new Date();
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
};

export const generateReportCardPDF = ({
  studentName,
  className,
  section,
  rollNumber,
  admissionId,
  dateOfBirth,
  performance = null,
  attendancePercentage = null,
  totalDays = null,
  presentDays = null
}) => {
  const subjects = Array.isArray(performance?.subjects) ? performance.subjects.filter(Boolean) : [];

  const hasSubjectMarks = subjects.length > 0;
  const totalMax = performance?.totalMaxMarks != null
    ? toNumber(performance.totalMaxMarks)
    : (hasSubjectMarks ? subjects.reduce((acc, s) => acc + (toNumber(s.totalMaxMarks) ?? 0), 0) : null);
  const totalObt = performance?.totalObtainedMarks != null
    ? toNumber(performance.totalObtainedMarks)
    : (hasSubjectMarks ? subjects.reduce((acc, s) => acc + (toNumber(s.totalObtainedMarks) ?? 0), 0) : null);
  const overallPct = performance?.overallPercentage != null
    ? toNumber(performance.overallPercentage)
    : (totalMax && totalObt != null ? Math.round((totalObt / totalMax) * 100) : null);
  const overallGrd = performance?.overallGrade || null;

  const rowsHtml = hasSubjectMarks
    ? subjects.map((s, idx) => {
        const maxMarks = toNumber(s.totalMaxMarks);
        const obtainedMarks = toNumber(s.totalObtainedMarks);
        const percentage = s.percentage != null
          ? toNumber(s.percentage)
          : (maxMarks && obtainedMarks != null ? Math.round((obtainedMarks / maxMarks) * 100) : null);

        return `
    <tr>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">
        ${idx + 1}. ${escapeHtml(s.subject || 'Unnamed subject')}
      </td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">
        ${maxMarks ?? '—'}
      </td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #0f172a;">
        ${obtainedMarks ?? '—'}
      </td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 600; color: #4338ca;">
        ${percentage != null ? `${percentage}%` : '—'}
      </td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 800; color: #047857;">
        ${escapeHtml(s.grade || '—')}
      </td>
    </tr>
  `;
      }).join('')
    : `
    <tr>
      <td colspan="5" style="padding: 18px 14px; text-align: center; color: #64748b; font-style: italic;">
        No subject evaluations have been recorded for this student yet.
      </td>
    </tr>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to view and download the report card.');
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
      <title>EduSetu Report Card - ${escapeHtml(studentName || 'Student')}</title>
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
          min-height: 42px;
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
        <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
      </div>

      <div class="container">
        <div class="watermark">EduSetu Report</div>

        <div class="school-header">
          <span class="school-badge">EduSetu Academic Records</span>
          <h1 class="school-name">Academic Progress Report</h1>
          <p class="school-sub">Generated from school-verified records on ${escapeHtml(currentDate)}</p>
          <div class="report-title-badge">SESSION ${escapeHtml(sessionLabel())}</div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Student Name:</span>
            <span class="info-value">${displayValue(studentName)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Roll Number:</span>
            <span class="info-value">${displayValue(rollNumber)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Class & Section:</span>
            <span class="info-value">${displayValue(className)}${section ? ` - Section ${escapeHtml(section)}` : ''}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Admission ID:</span>
            <span class="info-value">${displayValue(admissionId)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Date of Birth:</span>
            <span class="info-value">${displayValue(dateOfBirth)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Issue Date:</span>
            <span class="info-value">${escapeHtml(currentDate)}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Subject / Curriculum Area</th>
              <th style="text-align: center;">Max Marks</th>
              <th style="text-align: center;">Marks Scored</th>
              <th style="text-align: center;">Percentage</th>
              <th style="text-align: center;">Grade</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            ${hasSubjectMarks ? `
            <tr class="total-row">
              <td style="padding: 12px 14px; text-transform: uppercase;">Aggregate Scholastic Total</td>
              <td style="padding: 12px 14px; text-align: center;">${totalMax ?? '—'}</td>
              <td style="padding: 12px 14px; text-align: center; color: #4338ca;">${totalObt ?? '—'}</td>
              <td style="padding: 12px 14px; text-align: center; color: #4338ca;">${overallPct != null ? `${overallPct}%` : '—'}</td>
              <td style="padding: 12px 14px; text-align: center; color: #047857;">${escapeHtml(overallGrd || '—')}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>

        <div class="summary-cards">
          <div class="card">
            <div class="card-lbl">Overall Attendance</div>
            <div class="card-val" style="color: #059669;">${attendancePercentage != null ? `${escapeHtml(attendancePercentage)}%` : 'Not recorded'}</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">
              ${presentDays != null && totalDays != null ? `${escapeHtml(presentDays)} of ${escapeHtml(totalDays)} Working Days` : 'Attendance summary unavailable'}
            </div>
          </div>
          <div class="card">
            <div class="card-lbl">Cumulative Grade</div>
            <div class="card-val">${escapeHtml(overallGrd || 'Not recorded')}</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Based on recorded subject evaluations</div>
          </div>
          <div class="card">
            <div class="card-lbl">Cumulative Percentage</div>
            <div class="card-val" style="color: #047857;">${overallPct != null ? `${overallPct}%` : 'Not recorded'}</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">This report reflects only recorded marks</div>
          </div>
        </div>

        <div class="remarks-box">
          <strong>Class Teacher Remarks:</strong>
          <span style="color: #334155; margin-left: 6px;">
            Remarks are issued by the school. Contact the class teacher for qualitative feedback.
          </span>
        </div>

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
