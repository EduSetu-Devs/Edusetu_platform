const http = require('http');

const port = Number(process.env.TEST_PORT || 5001);
const password = 'Password123';

const request = (method, path, body, token) => new Promise((resolve, reject) => {
  const payload = body ? JSON.stringify(body) : null;
  const req = http.request({
    hostname: '127.0.0.1',
    port,
    path,
    method,
    headers: {
      ...(payload ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      let parsed = {};
      try { parsed = JSON.parse(data); } catch {}
      resolve({ status: res.statusCode, data: parsed });
    });
  });
  req.on('error', reject);
  if (payload) req.write(payload);
  req.end();
});

const assert = (condition, label) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`PASS: ${label}`);
};

(async () => {
  const stamp = Date.now();
  const register = (role, name, suffix, className, section) => request('POST', '/api/auth/register', {
    name,
    email: `${suffix}_${stamp}@edusetu.test`,
    password,
    role,
    className,
    section
  });

  const teacher = await register('teacher', 'Session Teacher', 'session_teacher', 'Session Class', 'A');
  const otherTeacher = await register('teacher', 'Other Session Teacher', 'other_session_teacher', 'Other Class', 'B');
  const student = await register('student', 'Session Student', 'session_student', 'Session Class', 'A');
  const otherStudent = await register('student', 'Other Session Student', 'other_session_student', 'Other Class', 'B');

  assert(teacher.status === 201 && otherTeacher.status === 201, 'teachers register');
  assert(student.status === 201 && otherStudent.status === 201, 'students register');

  const teacherToken = teacher.data.data.token;
  const otherTeacherToken = otherTeacher.data.data.token;
  const studentToken = student.data.data.token;
  const otherStudentToken = otherStudent.data.data.token;
  const studentId = student.data.data.user.studentProfile.id;

  const online = await request('POST', '/api/teacher/sessions', {
    studentId,
    title: 'Algebra Live',
    description: 'Linear equations',
    mode: 'ONLINE',
    scheduledDate: '2026-12-01',
    startTime: '10:00',
    endTime: '11:00'
  }, teacherToken);
  assert(online.status === 201, 'teacher creates online class');

  const offline = await request('POST', '/api/teacher/sessions', {
    studentId,
    title: 'Geometry Room',
    description: 'Triangles',
    mode: 'OFFLINE',
    scheduledDate: '2026-12-02',
    startTime: '12:00',
    endTime: '13:00',
    location: 'Room 204'
  }, teacherToken);
  assert(offline.status === 201, 'teacher creates offline class');

  const teacherList = await request('GET', '/api/teacher/sessions', null, teacherToken);
  const studentList = await request('GET', '/api/student/sessions', null, studentToken);
  assert(teacherList.status === 200 && teacherList.data.data.count === 2, 'teacher sees upcoming classes');
  assert(studentList.status === 200 && studentList.data.data.count === 2, 'student sees assigned classes');

  const hidden = await request('GET', `/api/student/sessions/${online.data.data.id}`, null, otherStudentToken);
  const crossTeacher = await request('GET', `/api/teacher/sessions/${online.data.data.id}`, null, otherTeacherToken);
  assert(hidden.status === 404, 'student cannot see another student class');
  assert(crossTeacher.status === 404, 'teacher cannot manage another teacher class');

  const started = await request('PATCH', `/api/teacher/sessions/${online.data.data.id}/start`, null, teacherToken);
  assert(started.status === 200 && started.data.data.status === 'LIVE', 'teacher starts online class');

  const joined = await request('POST', `/api/student/sessions/${online.data.data.id}/join`, null, studentToken);
  assert(joined.status === 200 && joined.data.data.videoAvailable === true, 'student joins a live online session with WebRTC transport');

  const cancelled = await request('PATCH', `/api/teacher/sessions/${offline.data.data.id}/cancel`, null, teacherToken);
  assert(cancelled.status === 200 && cancelled.data.data.status === 'CANCELLED', 'teacher cancels class');

  const notifications = await request('GET', '/api/notifications', null, studentToken);
  assert(notifications.status === 200 && notifications.data.data.notifications.length >= 3, 'student receives schedule, live, and cancellation notifications');

  console.log('Teaching session integration flow passed.');
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
