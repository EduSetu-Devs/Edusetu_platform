require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { User, StudentProfile, TeacherProfile, Homework, SubmissionAttachment, sequelize } = require('./src/models');
const { SUBMISSION_UPLOAD_DIR } = require('./src/middleware/submissionUpload');

const API = 'http://127.0.0.1:5000/api';
const password = 'AttachmentTest@1300';
const timestamp = Date.now();
const studentEmail = `attachment_student_${timestamp}@edusetu.test`;
const teacherEmail = `attachment_teacher_${timestamp}@edusetu.test`;
let studentUser;
let teacherUser;
let homework;
const homeworkIds = [];
let attachmentIds = [];
let passed = 0;
let total = 0;

const check = (condition, name) => {
  total += 1;
  assert(condition, name);
  passed += 1;
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API}${path}`, options);
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  return { status: response.status, data };
};

const jsonRequest = (path, method, body, token) => request(path, {
  method,
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  },
  body: JSON.stringify(body)
});

const multipartSubmission = async (homeworkId, token, files, submissionText = '') => {
  const form = new FormData();
  if (submissionText) form.append('submissionText', submissionText);
  files.forEach((file) => form.append('attachments', new Blob([file.content], { type: file.type }), file.name));
  return request(`/student/homework/${homeworkId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
};

const run = async () => {
  try {
    await sequelize.authenticate();

    const studentRegistration = await jsonRequest('/auth/register', 'POST', {
      name: 'Attachment Test Student', email: studentEmail, password, role: 'student'
    });
    const teacherRegistration = await jsonRequest('/auth/register', 'POST', {
      name: 'Attachment Test Teacher', email: teacherEmail, password, role: 'teacher'
    });
    check(studentRegistration.status === 201 && teacherRegistration.status === 201, 'Temporary Student and Teacher accounts register');

    const studentToken = studentRegistration.data.data.token;
    const teacherToken = teacherRegistration.data.data.token;
    studentUser = await User.findOne({ where: { email: studentEmail } });
    teacherUser = await User.findOne({ where: { email: teacherEmail } });
    const studentProfile = await StudentProfile.findOne({ where: { userId: studentUser.id } });
    const teacherProfile = await TeacherProfile.findOne({ where: { userId: teacherUser.id } });
    await studentProfile.update({ className: 'Class 10', section: 'A' });
    await teacherProfile.update({ className: 'Class 10', section: 'A' });
    homework = await Homework.create({
      title: 'Attachment Integration Test',
      description: 'Temporary assignment for attachment integration coverage',
      subject: 'Testing',
      className: 'Class 10',
      section: 'A',
      assignedBy: teacherUser.id,
      assignedDate: new Date().toISOString().slice(0, 10),
      dueDate: '2099-12-31',
      status: 'active'
    });
    homeworkIds.push(homework.id);

    const textOnly = await jsonRequest(`/student/homework/${homework.id}/submit`, 'POST', {
      submissionText: 'Text-only submission'
    }, studentToken);
    check(textOnly.status === 201 && textOnly.data.data.attachments.length === 0, 'Student submits without attachment');

    const secondHomework = await Homework.create({ ...homework.toJSON(), id: undefined, createdAt: undefined, updatedAt: undefined });
    homeworkIds.push(secondHomework.id);
    const pdf = await multipartSubmission(secondHomework.id, studentToken, [
      { name: 'answer.pdf', type: 'application/pdf', content: '%PDF-test' }
    ], 'PDF submission');
    check(pdf.status === 201 && pdf.data.data.attachments.length === 1, 'Student submits one PDF');
    attachmentIds = pdf.data.data.attachments.map((attachment) => attachment.id);

    const thirdHomework = await Homework.create({ ...homework.toJSON(), id: undefined, createdAt: undefined, updatedAt: undefined });
    homeworkIds.push(thirdHomework.id);
    const images = await multipartSubmission(thirdHomework.id, studentToken, [
      { name: 'diagram.jpg', type: 'image/jpeg', content: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) },
      { name: 'diagram.jpeg', type: 'image/jpeg', content: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) },
      { name: 'diagram.png', type: 'image/png', content: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
      { name: 'diagram.webp', type: 'image/webp', content: Buffer.from('RIFF0000WEBP') }
    ]);
    check(images.status === 201 && images.data.data.attachments.length === 4, 'Student submits multiple allowed images');
    attachmentIds.push(...images.data.data.attachments.map((attachment) => attachment.id));

    const invalidHomework = await Homework.create({ ...homework.toJSON(), id: undefined, createdAt: undefined, updatedAt: undefined });
    homeworkIds.push(invalidHomework.id);
    const invalid = await multipartSubmission(invalidHomework.id, studentToken, [
      { name: 'script.exe', type: 'application/octet-stream', content: 'not allowed' }
    ]);
    check(invalid.status === 400, 'Invalid file type is rejected');

    const tooLargeHomework = await Homework.create({ ...homework.toJSON(), id: undefined, createdAt: undefined, updatedAt: undefined });
    homeworkIds.push(tooLargeHomework.id);
    const tooLarge = await multipartSubmission(tooLargeHomework.id, studentToken, [
      { name: 'large.pdf', type: 'application/pdf', content: Buffer.alloc(10 * 1024 * 1024 + 1) }
    ]);
    check(tooLarge.status === 413, 'File larger than 10 MB is rejected');

    const unauthenticated = await multipartSubmission(homework.id, null, [
      { name: 'unauthenticated.pdf', type: 'application/pdf', content: '%PDF-test' }
    ]);
    check(unauthenticated.status === 401, 'Unauthenticated upload is rejected');

    const studentDetails = await request(`/student/homework/${secondHomework.id}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const downloadUrl = studentDetails.data.data.submission.attachments[0].downloadUrl.replace(API, '');
    const studentDownload = await request(downloadUrl, { headers: { Authorization: `Bearer ${studentToken}` } });
    check(studentDownload.status === 200, 'Student can access their own attachment');

    const teacherDetails = await request(`/teacher/homework/${secondHomework.id}/submissions/${studentProfile.id}`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    check(teacherDetails.status === 200 && teacherDetails.data.data.submission.attachments.length === 1, 'Authorized teacher can view submission attachments');
    const teacherDownload = await request(downloadUrl, { headers: { Authorization: `Bearer ${teacherToken}` } });
    check(teacherDownload.status === 200, 'Authorized teacher can download submission attachment');

    const otherStudentRegistration = await jsonRequest('/auth/register', 'POST', {
      name: 'Other Attachment Student', email: `attachment_other_${timestamp}@edusetu.test`, password, role: 'student'
    });
    const otherStudentToken = otherStudentRegistration.data.data.token;
    const denied = await request(downloadUrl, { headers: { Authorization: `Bearer ${otherStudentToken}` } });
    check(denied.status === 403, 'Another student cannot access the attachment');

    console.log(`Attachment test summary: ${passed}/${total} passed`);
  } finally {
    const attachments = attachmentIds.length ? await SubmissionAttachment.findAll({ where: { id: attachmentIds } }) : [];
    attachments.forEach((attachment) => fs.unlink(path.join(SUBMISSION_UPLOAD_DIR, attachment.storageKey), () => {}));
    if (studentUser) await User.destroy({ where: { email: studentEmail } });
    if (teacherUser) await User.destroy({ where: { email: teacherEmail } });
    await User.destroy({ where: { email: `attachment_other_${timestamp}@edusetu.test` } });
    await Homework.destroy({ where: { id: homeworkIds } });
    await sequelize.close();
  }
};

run().catch((error) => {
  console.error(`Attachment test failed: ${error.message}`);
  process.exitCode = 1;
});
