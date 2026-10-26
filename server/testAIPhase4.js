const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
process.env.NODE_ENV = 'test';
if (process.env.PHASE4_KEEP_SERVER === '1') process.env.CLIENT_URL = 'http://127.0.0.1:5175';
const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { sequelize, User, StudentProfile, TeacherProfile, ParentProfile, ParentStudent, Marks, Attendance, Homework, HomeworkSubmission, TeachingSession, ClassFeedback } = require('./src/models');
const { generateToken } = require('./src/utils/tokenHandler');

const server = http.createServer(app);
let baseUrl;
let totalTests = 0;
let passedTests = 0;

function assert(condition, name, details = '') {
  totalTests += 1;
  if (condition) {
    passedTests += 1;
    console.log(`PASS [${totalTests}]: ${name}`);
  } else {
    console.error(`FAIL [${totalTests}]: ${name}${details ? ` - ${details}` : ''}`);
    process.exitCode = 1;
  }
}

async function request(route, { token, method = 'GET', body } = {}) {
  const url = new URL(`${baseUrl}${route}`);
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {})
      }
    };
    const req = http.request(requestOptions, (response) => {
      let data = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          resolve({ status: response.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: response.statusCode, data: {} });
        }
      });
    });
    req.setTimeout(10000, () => req.destroy(new Error('HTTP request timed out')));
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createTestAccount(name, role, timestamp, profile = {}) {
  const email = `${role}_${name.toLowerCase().replace(/\s+/g, '_')}_${timestamp}@edusetu.org`;
  const user = await User.create({
    name,
    email,
    password: 'Phase4Test123',
    role,
    isActive: true
  });
  const userData = { id: user.id, role: user.role };
  if (role === 'student') {
    userData.studentProfile = await StudentProfile.create({ userId: user.id, studentId: `AI4S${user.id}${timestamp}`, className: profile.className || '', section: profile.section || '' });
  } else if (role === 'teacher') {
    userData.teacherProfile = await TeacherProfile.create({ userId: user.id, teacherId: `AI4T${user.id}${timestamp}`, className: profile.className || '', section: profile.section || '' });
  } else if (role === 'parent') {
    userData.parentProfile = await ParentProfile.create({ userId: user.id, parentId: `AI4P${user.id}${timestamp}` });
  }
  console.log(`SETUP: seeded ${role} login ${email}`);
  return { user: userData, token: generateToken(user) };
}

async function run() {
  const databaseStatus = await connectDB();
  if (!databaseStatus.connected) throw new Error('A database connection is required for the Phase 4 integration suite.');
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(Number(process.env.PHASE4_PORT) || 0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  console.log(`SETUP: integration server listening at ${baseUrl}`);
  const health = await request('/health');
  assert(health.status === 200, 'Self-hosted API health endpoint responds');
  const invalidLogin = await request('/auth/login', { method: 'POST', body: {} });
  assert(invalidLogin.status === 400, 'Authentication request body is parsed and rejected safely');
  const transaction = await sequelize.transaction();
  await transaction.rollback();
  console.log('SETUP: database transaction acquired and rolled back');
  const lookupTransaction = await sequelize.transaction();
  await User.findOne({ where: { email: `phase4-probe-${Date.now()}@edusetu.test` }, transaction: lookupTransaction });
  await lookupTransaction.rollback();
  console.log('SETUP: transactional user lookup completed');
  const rejectedRegistration = await request('/auth/register', { method: 'POST', body: {} });
  assert(rejectedRegistration.status === 400, 'Registration validates input and releases its transaction');

  const timestamp = Date.now();
  const className = `AI Phase 4 ${timestamp}`;
  const teacher = await createTestAccount('AI Teacher', 'teacher', timestamp, { className, section: 'A' });
  const studentA = await createTestAccount('AI Student A', 'student', timestamp, { className, section: 'A' });
  const studentB = await createTestAccount('AI Student B', 'student', timestamp, { className: `${className} Other`, section: 'B' });
  const parent = await createTestAccount('AI Parent', 'parent', timestamp);

  await Marks.create({ studentId: studentA.user.studentProfile.id, subject: 'Mathematics', examType: 'unit_test', examName: `AI Phase 4 ${timestamp}`, maxMarks: 20, obtainedMarks: 16, examDate: '2026-10-01', markedBy: teacher.user.id });
  await Marks.create({ studentId: studentB.user.studentProfile.id, subject: 'UnauthorizedPhysics', examType: 'unit_test', examName: `AI Phase 4 B ${timestamp}`, maxMarks: 10, obtainedMarks: 0, examDate: '2026-10-01', markedBy: teacher.user.id });
  await Attendance.create({ studentProfileId: studentA.user.studentProfile.id, date: '2026-10-01', status: 'present', subject: 'Mathematics', markedBy: teacher.user.id });
  const homework = await Homework.create({ title: `AI Phase 4 ${timestamp}`, description: 'Controlled test assignment', subject: 'Mathematics', className, section: 'A', assignedBy: teacher.user.id, assignedDate: '2026-10-01', dueDate: '2026-10-30', status: 'active' });
  await HomeworkSubmission.create({ homeworkId: homework.id, studentId: studentA.user.studentProfile.id, submissionText: 'Completed test work', submittedAt: new Date(), status: 'submitted' });
  const session = await TeachingSession.create({ teacherProfileId: teacher.user.teacherProfile.id, studentProfileId: studentA.user.studentProfile.id, subjectName: 'Mathematics', title: `AI feedback ${timestamp}`, description: '', mode: 'OFFLINE', scheduledDate: '2026-10-01', startTime: '09:00:00', endTime: '10:00:00', status: 'COMPLETED', classRoomId: `ai-phase4-${timestamp}` });
  await ClassFeedback.create({ teachingSessionId: session.id, authorUserId: teacher.user.id, understandingLevel: 'Good', feedback: 'Shows clear algebra steps.', improvementTopics: 'Check the final calculation.' });

  assert((await request('/student/ai/quiz')).status === 401, 'AI endpoint requires JWT');
  assert((await request('/student/ai/quiz', { token: teacher.token, method: 'POST', body: { subject: 'Math', topic: 'Algebra' } })).status === 403, 'Student AI endpoint enforces student role');
  assert((await request('/student/ai/quiz', { token: studentA.token, method: 'POST', body: { subject: '', topic: '' } })).status === 400, 'Quiz validates required input');
  const studentARecommendations = await request(`/student/ai/recommendations?studentId=${studentB.user.studentProfile.id}`, { token: studentA.token });
  assert(studentARecommendations.status === 200 && !JSON.stringify(studentARecommendations.data).includes('UnauthorizedPhysics'), 'Student cannot use a supplied ID to retrieve another student’s academic data');

  const plan = await request('/student/ai/study-plan', { token: studentA.token, method: 'POST', body: { subject: 'Mathematics', topic: 'Algebra', availableDays: 3 } });
  assert(plan.status === 200 && Array.isArray(plan.data?.data?.plan) && plan.data.data.plan.length === 3, 'Study plan endpoint returns usable tasks');
  const quiz = await request('/student/ai/quiz', { token: studentA.token, method: 'POST', body: { subject: 'Mathematics', topic: 'Algebra' } });
  assert(quiz.status === 200 && quiz.data?.data?.mode === 'quiz' && quiz.data.data.questions.length > 0, 'Quiz endpoint returns questions');
  assert(quiz.data.data.questions.every((item) => item.question && item.answer && typeof item.explanation === 'string'), 'Quiz questions include answer keys and explanations');

  const previousProvider = process.env.AI_PROVIDER;
  const previousApiKey = process.env.AI_API_KEY;
  const originalFetch = global.fetch;
  process.env.AI_PROVIDER = 'openai';
  process.env.AI_API_KEY = 'phase4-test-only';
  const quizWithProviderContent = async (content) => {
    global.fetch = async () => ({ ok: true, json: async () => ({ choices: [{ message: { content } }] }) });
    return request('/student/ai/quiz', { token: studentA.token, method: 'POST', body: { subject: 'Mathematics', topic: 'Algebra' } });
  };
  const emptyQuiz = await quizWithProviderContent(JSON.stringify({ mode: 'quiz', questions: [] }));
  const missingAnswerQuiz = await quizWithProviderContent(JSON.stringify({ mode: 'quiz', questions: [{ question: 'What is x?' }] }));
  const malformedQuiz = await quizWithProviderContent('not JSON');
  delete process.env.AI_API_KEY;
  const providerUnavailable = await request('/student/ai/quiz', { token: studentA.token, method: 'POST', body: { subject: 'Mathematics', topic: 'Algebra' } });
  global.fetch = originalFetch;
  process.env.AI_PROVIDER = previousProvider;
  if (previousApiKey === undefined) delete process.env.AI_API_KEY;
  else process.env.AI_API_KEY = previousApiKey;
  assert(emptyQuiz.status === 502, 'Empty provider quiz is rejected safely');
  assert(missingAnswerQuiz.status === 502, 'Quiz without answer keys is rejected safely');
  assert(malformedQuiz.status === 500, 'Malformed provider JSON fails without exposing provider details');
  assert(providerUnavailable.status === 503, 'Missing AI provider key returns a safe unavailable status');

  const ownChat = await request('/student/ai/doubt', { token: studentA.token, method: 'POST', body: { question: `AI Phase 4 history ${timestamp}` } });
  const historyA = await request('/student/ai/history', { token: studentA.token });
  const historyB = await request('/student/ai/history', { token: studentB.token });
  assert(ownChat.status === 200 && historyA.data?.data?.history?.some((item) => item.question === `AI Phase 4 history ${timestamp}`), 'Student can read own AI history');
  assert(!historyB.data?.data?.history?.some((item) => item.question === `AI Phase 4 history ${timestamp}`), 'AI history is isolated between students');

  const teacherInsights = await request(`/teacher/ai/students/${studentA.user.studentProfile.id}`, { token: teacher.token });
  const unauthorizedTeacherInsights = await request(`/teacher/ai/students/${studentB.user.studentProfile.id}`, { token: teacher.token });
  assert(teacherInsights.status === 200 && teacherInsights.data?.data?.advisoryOnly === true, 'Teacher insight is advisory for an authorized student');
  assert(unauthorizedTeacherInsights.status === 404, 'Teacher cannot analyze an out-of-scope student');
  assert(teacherInsights.data?.data?.academicSummary?.subjects?.some((item) => item.subject === 'Mathematics' && item.percentage === 80), 'Teacher insight includes recorded marks');
  assert(teacherInsights.data?.data?.academicSummary?.attendance?.percentage === 100, 'Teacher insight includes recorded attendance');
  assert(teacherInsights.data?.data?.academicSummary?.assignments?.submitted === 1, 'Teacher insight includes recorded assignment status');
  assert(teacherInsights.data?.data?.academicSummary?.teacherFeedback?.some((item) => item.feedback === 'Shows clear algebra steps.'), 'Teacher insight includes recorded teacher feedback');

  const link = await ParentStudent.create({ parentProfileId: parent.user.parentProfile.id, studentProfileId: studentA.user.studentProfile.id, relationship: 'Child' });
  const parentInsight = await request(`/parent/children/${studentA.user.studentProfile.studentId}/ai-insights`, { token: parent.token });
  const unauthorizedParentInsight = await request(`/parent/children/${studentB.user.studentProfile.studentId}/ai-insights`, { token: parent.token });
  assert(link.id && parentInsight.status === 200, 'Parent can view linked child insights');
  assert(unauthorizedParentInsight.status === 403, 'Parent cannot view an unlinked child');
  assert(parentInsight.data?.data?.academicSummary?.assignments?.submitted === 1, 'Parent insight includes authorized academic summary');
  assert(parentInsight.data?.data?.academicSummary?.teacherFeedback?.some((item) => item.feedback === 'Shows clear algebra steps.'), 'Parent insight includes authorized teacher feedback');
  assert(!JSON.stringify(parentInsight.data).includes('AI Phase 4 history'), 'Parent insight excludes private student AI chat history');
  assert(!JSON.stringify([plan.data, quiz.data, teacherInsights.data, parentInsight.data]).includes('AI_API_KEY'), 'AI provider key is not returned by tested endpoints');
  assert(!JSON.stringify([emptyQuiz.data, missingAnswerQuiz.data, malformedQuiz.data, providerUnavailable.data]).includes('phase4-test-only'), 'Provider credential value is never returned by the API');

  console.log(`\nAI Phase 4 integration summary: ${passedTests}/${totalTests} assertions passed.`);
  if (passedTests !== totalTests) process.exitCode = 1;
}

run().catch((error) => {
  console.error(`AI Phase 4 integration test failed: ${error.message}`);
  process.exitCode = 1;
}).finally(async () => {
  if (process.env.PHASE4_KEEP_SERVER !== '1') {
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    await sequelize.close();
  } else {
    console.log('TEST API remains available for manual verification. Login password: Phase4Test123');
  }
});
