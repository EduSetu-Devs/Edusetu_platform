require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const path = require('path');
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const { connectDB } = require('./src/config/db');
const { User, StudentProfile, TeacherProfile, Homework, HomeworkSubmission, SubmissionAttachment, sequelize } = require('./src/models');
const { SUBMISSION_UPLOAD_DIR } = require('./src/middleware/submissionUpload');
const app = require('./src/app');

const TEST_PORT = 5005;
let serverInstance = null;
const password = 'TeacherReview@2026';
const timestamp = Date.now();

const teacherAEmail = `teacher_a_${timestamp}@edusetu.test`;
const teacherBEmail = `teacher_b_${timestamp}@edusetu.test`;
const student1Email = `student_1_${timestamp}@edusetu.test`;
const student2Email = `student_2_${timestamp}@edusetu.test`;

let teacherAUser, teacherBUser, student1User, student2User;
let teacherAProfile, teacherBProfile, student1Profile, student2Profile;
let teacherAToken, teacherBToken, student1Token, student2Token;

const homeworkIds = [];
const attachmentIds = [];
let passed = 0;
let total = 0;

const check = (condition, name) => {
  total += 1;
  if (condition) {
    console.log(`  ✅ PASS [${total}]: ${name}`);
    passed += 1;
  } else {
    console.error(`  ❌ FAIL [${total}]: ${name}`);
    throw new Error(`Assertion failed: ${name}`);
  }
};

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const postBody = postData ? JSON.stringify(postData) : null;
    const headers = { ...(options.headers || {}) };
    if (postBody) {
      headers['Content-Length'] = Buffer.byteLength(postBody);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        ...options,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, data });
          }
        });
      }
    );

    req.on('error', (e) => {
      console.error('[makeRequest error]:', e);
      reject(e);
    });

    if (postBody) {
      req.write(postBody);
    }
    req.end();
  });
};

const jsonRequest = (urlPath, method, body, token) => {
  return makeRequest(
    {
      path: `/api${urlPath}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    },
    body
  );
};

const makeMultipartRequest = (urlPath, token, fields = {}, files = []) => {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const chunks = [];

    for (const [key, value] of Object.entries(fields)) {
      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`));
    }

    for (const file of files) {
      const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="attachments"; filename="${file.name}"\r\nContent-Type: ${file.type}\r\n\r\n`;
      chunks.push(Buffer.from(fileHeader));
      chunks.push(Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content));
      chunks.push(Buffer.from('\r\n'));
    }

    chunks.push(Buffer.from(`--${boundary}--\r\n`));
    const body = Buffer.concat(chunks);

    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: `/api${urlPath}`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', (e) => {
      console.error('[makeMultipartRequest error]:', e);
      reject(e);
    });

    req.write(body);
    req.end();
  });
};

const startTestServer = async () => {
  await connectDB();
  return new Promise((resolve, reject) => {
    serverInstance = app.listen(TEST_PORT, '127.0.0.1', () => {
      console.log(`[Test Server] EduSetu test backend listening on http://127.0.0.1:${TEST_PORT}\n`);
      resolve();
    });
    serverInstance.on('error', reject);
  });
};

const run = async () => {
  try {
    console.log('================================================================');
    console.log('🔍 Running EduSetu Teacher Assignment Submission Review Test Suite');
    console.log('================================================================\n');

    await startTestServer();

    // 1. Register test accounts
    console.log('1. Account Registration & Role Assignment:');
    const regTeacherA = await jsonRequest('/auth/register', 'POST', {
      name: 'Teacher Alpha', email: teacherAEmail, password, role: 'teacher'
    });
    const regTeacherB = await jsonRequest('/auth/register', 'POST', {
      name: 'Teacher Beta', email: teacherBEmail, password, role: 'teacher'
    });
    const regStudent1 = await jsonRequest('/auth/register', 'POST', {
      name: 'Student One', email: student1Email, password, role: 'student'
    });
    const regStudent2 = await jsonRequest('/auth/register', 'POST', {
      name: 'Student Two', email: student2Email, password, role: 'student'
    });

    check(regTeacherA.status === 201 && regTeacherB.status === 201, 'Teachers Alpha and Beta register successfully (HTTP 201)');
    check(regStudent1.status === 201 && regStudent2.status === 201, 'Students One and Two register successfully (HTTP 201)');

    teacherAToken = regTeacherA.data.data.token;
    teacherBToken = regTeacherB.data.data.token;
    student1Token = regStudent1.data.data.token;
    student2Token = regStudent2.data.data.token;

    teacherAUser = await User.findOne({ where: { email: teacherAEmail } });
    teacherBUser = await User.findOne({ where: { email: teacherBEmail } });
    student1User = await User.findOne({ where: { email: student1Email } });
    student2User = await User.findOne({ where: { email: student2Email } });

    teacherAProfile = await TeacherProfile.findOne({ where: { userId: teacherAUser.id } });
    teacherBProfile = await TeacherProfile.findOne({ where: { userId: teacherBUser.id } });
    student1Profile = await StudentProfile.findOne({ where: { userId: student1User.id } });
    student2Profile = await StudentProfile.findOne({ where: { userId: student2User.id } });

    // Configure class allocations
    await teacherAProfile.update({ className: 'Class 10', section: 'A' });
    await teacherBProfile.update({ className: 'Class 9', section: 'B' });
    await student1Profile.update({ className: 'Class 10', section: 'A', rollNumber: '101' });
    await student2Profile.update({ className: 'Class 10', section: 'A', rollNumber: '102' });

    // 2. Teacher Alpha creates an assignment for Class 10 / Section A
    console.log('\n2. Assignment Creation & Submissions:');
    const hw1 = await Homework.create({
      title: 'Mathematics Problem Set 1',
      description: 'Solve problems 1 through 10 in chapter 4',
      subject: 'Mathematics',
      className: 'Class 10',
      section: 'A',
      assignedBy: teacherAUser.id,
      assignedDate: new Date().toISOString().slice(0, 10),
      dueDate: '2099-12-31',
      status: 'active'
    });
    homeworkIds.push(hw1.id);

    // 3. Student 1 submits assignment with text answer + 1 PDF attachment + 1 PNG image attachment
    const sub1Res = await makeMultipartRequest(`/student/homework/${hw1.id}/submit`, student1Token, {
      submissionText: 'Here is my complete solution with the graph attached.'
    }, [
      { name: 'solutions.pdf', type: 'application/pdf', content: '%PDF-1.4 test math solutions' },
      { name: 'graph.png', type: 'image/png', content: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) }
    ]);
    check(sub1Res.status === 201 && sub1Res.data.data.attachments.length === 2, 'Student 1 submits assignment with comments and 2 attachments (PDF + PNG)');
    const s1Attachments = sub1Res.data.data.attachments;
    s1Attachments.forEach((att) => attachmentIds.push(att.id));

    // 4. Student 2 submits assignment with text only (no attachments)
    const sub2Res = await jsonRequest(`/student/homework/${hw1.id}/submit`, 'POST', {
      submissionText: 'Completed online via textbook answers.'
    }, student2Token);
    check(sub2Res.status === 201 && sub2Res.data.data.attachments.length === 0, 'Student 2 submits assignment without attachments');

    // 5. Teacher A views all submissions for assignment (via /teacher/homework/:id/submissions)
    console.log('\n3. Teacher Submissions Review View:');
    const hwSubmissionsRes = await makeRequest({
      path: `/api/teacher/homework/${hw1.id}/submissions`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    check(hwSubmissionsRes.status === 200, 'Teacher A gets homework submissions with HTTP 200');

    const subData = hwSubmissionsRes.data.data;
    check(subData.stats.totalStudents >= 2, 'Submission stats reflects enrolled students count (>= 2)');
    check(subData.stats.submitted >= 2, 'Submission stats counts submitted students (>= 2)');
    check(Array.isArray(subData.students) && subData.students.length >= 2, 'Teacher receives students roster list');
    check(Array.isArray(subData.submissions) && subData.submissions.length >= 2, 'Teacher receives submissions list');

    // Verify Student 1 submission entry
    const student1Entry = subData.students.find((s) => s.studentProfileId === student1Profile.id);
    check(student1Entry !== undefined, 'Student 1 is present in teacher review roster');
    check(student1Entry.name === 'Student One', 'Student 1 name is correctly rendered');
    check(student1Entry.rollNumber === '101', 'Student 1 roll number is correctly rendered');
    check(student1Entry.comment.includes('Here is my complete solution'), 'Student 1 comment/answer is displayed');
    check(student1Entry.submittedAt !== null, 'Student 1 submission timestamp is present');
    check(student1Entry.attachmentCount === 2, 'Student 1 attachment count equals 2');
    check(student1Entry.attachments.length === 2, 'Student 1 attachments array contains 2 items');

    const pdfAtt = student1Entry.attachments.find((a) => a.originalFilename === 'solutions.pdf');
    const pngAtt = student1Entry.attachments.find((a) => a.originalFilename === 'graph.png');
    check(pdfAtt && pdfAtt.mimeType === 'application/pdf', 'PDF attachment metadata includes correct mimeType (application/pdf)');
    check(pdfAtt && typeof pdfAtt.viewUrl === 'string' && typeof pdfAtt.downloadUrl === 'string', 'PDF attachment includes viewUrl and downloadUrl');
    check(pngAtt && pngAtt.mimeType === 'image/png', 'Image attachment metadata includes correct mimeType (image/png)');

    // Verify Student 2 submission entry (no attachments)
    const student2Entry = subData.students.find((s) => s.studentProfileId === student2Profile.id);
    check(student2Entry !== undefined, 'Student 2 is present in teacher review roster');
    check(student2Entry.comment.includes('Completed online'), 'Student 2 comment is displayed');
    check(student2Entry.attachments.length === 0, 'Student 2 has clean empty attachments list');

    // 6. Test alias route /teacher/assignments/:id/submissions
    console.log('\n4. Alias Routes & Single Submission Details:');
    const aliasSubmissionsRes = await makeRequest({
      path: `/api/teacher/assignments/${hw1.id}/submissions`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    check(aliasSubmissionsRes.status === 200 && aliasSubmissionsRes.data.data.stats.submitted >= 2, 'Teacher can access alias route /teacher/assignments/:id/submissions');

    // 7. Test single student submission details endpoint
    const s1DetailsRes = await makeRequest({
      path: `/api/teacher/homework/${hw1.id}/submissions/${student1Profile.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    check(s1DetailsRes.status === 200, 'Teacher A gets specific student submission details with HTTP 200');
    check(s1DetailsRes.data.data.submission.attachments.length === 2, 'Single student submission endpoint returns all attachments');
    check(s1DetailsRes.data.data.student.name === 'Student One', 'Single student submission endpoint returns student profile');

    // 8. Test alias single student submission route
    const aliasDetailsRes = await makeRequest({
      path: `/api/teacher/assignments/${hw1.id}/submissions/${student1Profile.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    check(aliasDetailsRes.status === 200, 'Teacher A can access alias single submission route /teacher/assignments/:id/submissions/:studentId');

    // 9. Test Attachment Inline View & Download endpoints
    console.log('\n5. Attachment Inline Viewing & Downloading:');
    const pdfPath = `/submission-attachments/${pdfAtt.id}`;
    const pngPath = `/submission-attachments/${pngAtt.id}`;

    // 9a. PDF inline view with Bearer header
    const pdfInlineHeader = await makeRequest({
      path: `/api${pdfPath}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    check(pdfInlineHeader.status === 200, 'Teacher can view PDF attachment inline with Bearer token');
    check(pdfInlineHeader.headers['content-type'] === 'application/pdf', 'PDF inline view sets Content-Type: application/pdf');
    check((pdfInlineHeader.headers['content-disposition'] || '').includes('inline'), 'PDF inline view sets Content-Disposition: inline');

    // 9b. PDF inline view with Query token (?token=...)
    const pdfInlineQuery = await makeRequest({
      path: `/api${pdfPath}?token=${encodeURIComponent(teacherAToken)}`,
      method: 'GET'
    });
    check(pdfInlineQuery.status === 200, 'Teacher can view PDF attachment using query token in new tab/iframe');
    check(pdfInlineQuery.headers['content-type'] === 'application/pdf', 'PDF query token view sets Content-Type: application/pdf');

    // 9c. PDF download endpoint
    const pdfDownloadHeader = await makeRequest({
      path: `/api${pdfPath}?download=1`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    check(pdfDownloadHeader.status === 200, 'Teacher can download PDF attachment with Bearer token');
    check((pdfDownloadHeader.headers['content-disposition'] || '').includes('attachment'), 'PDF download endpoint sets Content-Disposition: attachment');

    // 9d. Image inline preview & download
    const pngInlineRes = await makeRequest({
      path: `/api${pngPath}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    check(pngInlineRes.status === 200, 'Teacher can preview image attachment inline');
    check(pngInlineRes.headers['content-type'] === 'image/png', 'Image inline preview sets Content-Type: image/png');
    check((pngInlineRes.headers['content-disposition'] || '').includes('inline'), 'Image inline preview sets Content-Disposition: inline');

    const pngDownloadRes = await makeRequest({
      path: `/api${pngPath}?download=1`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    check(pngDownloadRes.status === 200, 'Teacher can download image attachment');
    check((pngDownloadRes.headers['content-disposition'] || '').includes('attachment'), 'Image download endpoint sets Content-Disposition: attachment');

    // 10. Test assignment with zero submissions (clean empty state)
    console.log('\n6. Empty State & Overdue/Late Submission Handling:');
    const emptyHw = await Homework.create({
      title: 'Empty Assignment Test',
      description: 'Zero submissions assignment',
      subject: 'Physics',
      className: 'Class 10',
      section: 'A',
      assignedBy: teacherAUser.id,
      assignedDate: new Date().toISOString().slice(0, 10),
      dueDate: '2099-12-31',
      status: 'active'
    });
    homeworkIds.push(emptyHw.id);

    const emptySubmissionsRes = await makeRequest({
      path: `/api/teacher/homework/${emptyHw.id}/submissions`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    check(emptySubmissionsRes.status === 200, 'Empty assignment returns HTTP 200');
    check(emptySubmissionsRes.data.data.stats.submitted === 0, 'Empty assignment has 0 submitted count');
    check(emptySubmissionsRes.data.data.submissions.length === 0, 'Empty assignment returns empty submissions array');
    check(emptySubmissionsRes.data.data.students.every((s) => s.status === 'pending' && s.attachments.length === 0), 'All students show pending with empty attachments');

    // 11. Test late submission status
    const pastHw = await Homework.create({
      title: 'Past Due Homework',
      description: 'Overdue assignment',
      subject: 'English',
      className: 'Class 10',
      section: 'A',
      assignedBy: teacherAUser.id,
      assignedDate: '2020-01-01',
      dueDate: '2020-01-02',
      status: 'active'
    });
    homeworkIds.push(pastHw.id);

    const lateSubRes = await jsonRequest(`/student/homework/${pastHw.id}/submit`, 'POST', {
      submissionText: 'Late essay submission.'
    }, student1Token);
    check(lateSubRes.status === 201 && (lateSubRes.data.data.submission?.status || lateSubRes.data.data.status) === 'late', 'Submission after due date receives status late');

    const teacherLateCheck = await makeRequest({
      path: `/api/teacher/homework/${pastHw.id}/submissions`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    check(teacherLateCheck.status === 200 && teacherLateCheck.data.data.stats.late >= 1, 'Teacher view reflects late submission metrics');

    // 12. Security & RBAC: Cross-teacher isolation
    console.log('\n7. Strict Security, RBAC & Cross-Tenant Authorization:');
    const teacherBCrossHw = await makeRequest({
      path: `/api/teacher/homework/${hw1.id}/submissions`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherBToken}` }
    });
    check(teacherBCrossHw.status === 403, 'Teacher B is denied (HTTP 403) from viewing Teacher A homework submissions');

    const teacherBCrossSingle = await makeRequest({
      path: `/api/teacher/homework/${hw1.id}/submissions/${student1Profile.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherBToken}` }
    });
    check(teacherBCrossSingle.status === 403, 'Teacher B is denied (HTTP 403) from viewing single submission of Teacher A homework');

    const teacherBCrossAtt = await makeRequest({
      path: `/api${pdfPath}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherBToken}` }
    });
    check(teacherBCrossAtt.status === 403, 'Teacher B is denied (HTTP 403) from accessing submission attachment of Teacher A assignment');

    // 13. Security & RBAC: Student role restriction from Teacher submission endpoints
    const studentAccessTeacherEndpoint = await makeRequest({
      path: `/api/teacher/homework/${hw1.id}/submissions`,
      method: 'GET',
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    check(studentAccessTeacherEndpoint.status === 403, 'Student is denied (HTTP 403) from accessing teacher submission review endpoint');

    const studentAccessSingleEndpoint = await makeRequest({
      path: `/api/teacher/homework/${hw1.id}/submissions/${student1Profile.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    check(studentAccessSingleEndpoint.status === 403, 'Student is denied (HTTP 403) from accessing teacher single submission endpoint');

    // 14. Security: Unauthenticated access rejection
    const unauthenticatedSubmissions = await makeRequest({
      path: `/api/teacher/homework/${hw1.id}/submissions`,
      method: 'GET'
    });
    check(unauthenticatedSubmissions.status === 401, 'Unauthenticated request to submissions list is rejected with HTTP 401');

    const unauthenticatedAttachment = await makeRequest({
      path: `/api${pdfPath}`,
      method: 'GET'
    });
    check(unauthenticatedAttachment.status === 401, 'Unauthenticated request to attachment view/download is rejected with HTTP 401');

    // 15. Security: Cross-student attachment protection
    const student2CrossAtt = await makeRequest({
      path: `/api${pdfPath}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${student2Token}` }
    });
    check(student2CrossAtt.status === 403, 'Student 2 is denied (HTTP 403) from downloading Student 1 submission attachment');

    console.log(`\n================================================================`);
    console.log(`🎉 Teacher Submission Review Tests: ${passed}/${total} checks passed!`);
    console.log(`================================================================\n`);

  } finally {
    // Cleanup physical files
    if (attachmentIds.length > 0) {
      const attachments = await SubmissionAttachment.findAll({ where: { id: attachmentIds } });
      attachments.forEach((att) => {
        const filePath = path.join(SUBMISSION_UPLOAD_DIR, att.storageKey);
        fs.unlink(filePath, () => {});
      });
    }

    // Cleanup database test records
    if (student1User) await User.destroy({ where: { id: student1User.id } });
    if (student2User) await User.destroy({ where: { id: student2User.id } });
    if (teacherAUser) await User.destroy({ where: { id: teacherAUser.id } });
    if (teacherBUser) await User.destroy({ where: { id: teacherBUser.id } });
    if (homeworkIds.length > 0) await Homework.destroy({ where: { id: homeworkIds } });

    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    await sequelize.close();
  }
};

run().catch((err) => {
  console.error(`Teacher Submission Review test failed: ${err.message}`);
  process.exitCode = 1;
});
