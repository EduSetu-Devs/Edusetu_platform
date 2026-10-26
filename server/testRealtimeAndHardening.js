const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const ioClient = require('socket.io-client');
const {
  User,
  StudentProfile,
  TeacherProfile,
  ParentProfile,
  ParentStudent,
  Attendance,
  Homework,
  Marks,
  Conversation,
  Message,
  Notification
} = require('./src/models');

console.log('================================================================');
console.log('⚡ Running EduSetu Step 9 Real-Time & Hardening Test Suite');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, name, details = '') {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS [${totalTests}]: ${name}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL [${totalTests}]: ${name} ${details}`);
    process.exitCode = 1;
  }
}

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

function connectTestSocket(token, expectSuccess = true) {
  return new Promise((resolve) => {
    const socket = ioClient('http://127.0.0.1:5000', {
      auth: token ? { token: `Bearer ${token}` } : {},
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 5000
    });

    socket.on('connect', () => {
      resolve({ socket, success: true });
    });

    socket.on('connect_error', (err) => {
      resolve({ socket, success: false, error: err.message });
    });
  });
}

async function runRealtimeTests() {
  const timestamp = Date.now();
  const teacherEmail = `teacher_rt_${timestamp}@edusetu.org`;
  const parent1Email = `parent1_rt_${timestamp}@edusetu.org`;
  const parent2Email = `parent2_rt_${timestamp}@edusetu.org`;
  const student1Email = `student1_rt_${timestamp}@edusetu.org`;
  const student2Email = `student2_rt_${timestamp}@edusetu.org`;
  const adminEmail = `admin_rt_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  let teacherToken = '';
  let parent1Token = '';
  let parent2Token = '';
  let student1Token = '';
  let adminToken = '';

  let teacherUser = null;
  let parent1User = null;
  let parent2User = null;
  let student1User = null;
  let student2User = null;

  let teacherProfile = null;
  let parent1Profile = null;
  let parent2Profile = null;
  let student1Profile = null;
  let student2Profile = null;

  let conversationId = null;

  let teacherSocket = null;
  let parent1Socket = null;
  let parent2Socket = null;

  try {
    // 1. Register Accounts
    const resT = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Dr. Sarah Connor', email: teacherEmail, password: commonPassword, role: 'teacher', className: `Grade 10-RT_${timestamp}`, section: 'A', subjects: ['Mathematics'] }
    );
    assert(resT.status === 201, '1. Registered Teacher');
    teacherToken = resT.data.data.token;
    teacherUser = resT.data.data.user;
    teacherProfile = teacherUser.teacherProfile;

    const resP1 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Mr. John Connor', email: parent1Email, password: commonPassword, role: 'parent', relationship: 'Father' }
    );
    assert(resP1.status === 201, '2. Registered Parent 1');
    parent1Token = resP1.data.data.token;
    parent1User = resP1.data.data.user;
    parent1Profile = parent1User.parentProfile;

    const resP2 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Mrs. Unrelated Parent', email: parent2Email, password: commonPassword, role: 'parent', relationship: 'Mother' }
    );
    assert(resP2.status === 201, '3. Registered Parent 2 (Unrelated)');
    parent2Token = resP2.data.data.token;
    parent2User = resP2.data.data.user;
    parent2Profile = parent2User.parentProfile;

    const resS1 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Timmy Connor', email: student1Email, password: commonPassword, role: 'student', className: `Grade 10-RT_${timestamp}`, section: 'A', rollNumber: '10' }
    );
    assert(resS1.status === 201, '4. Registered Student 1 (Child A)');
    student1Token = resS1.data.data.token;
    student1User = resS1.data.data.user;
    student1Profile = student1User.studentProfile;

    const resS2 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Lucy Connor', email: student2Email, password: commonPassword, role: 'student', className: `Grade 10-RT_${timestamp}`, section: 'A', rollNumber: '11' }
    );
    assert(resS2.status === 201, '5. Registered Student 2 (Child B)');
    student2User = resS2.data.data.user;
    student2Profile = student2User.studentProfile;

    const resAdmin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Admin Master', email: adminEmail, password: commonPassword, role: 'admin', designation: 'Superintendent' }
    );
    assert(resAdmin.status === 201, '6. Registered Administrator');
    adminToken = resAdmin.data.data.token;

    // Link Parent 1 to Student 1 and Student 2
    await ParentStudent.bulkCreate([
      { parentProfileId: parent1Profile.id, studentProfileId: student1Profile.id, relationship: 'Son' },
      { parentProfileId: parent1Profile.id, studentProfileId: student2Profile.id, relationship: 'Daughter' }
    ]);
    assert(true, '7. Linked Student 1 and Student 2 to Parent 1');

    // 2. WebSocket JWT Authentication Tests
    const connNoToken = await connectTestSocket(null);
    assert(!connNoToken.success, '8. Missing JWT rejected by Socket.IO middleware');
    if (connNoToken.socket) connNoToken.socket.disconnect();

    const connBadToken = await connectTestSocket('invalid.jwt.token');
    assert(!connBadToken.success, '9. Invalid JWT rejected by Socket.IO middleware');
    if (connBadToken.socket) connBadToken.socket.disconnect();

    const connTeacher = await connectTestSocket(teacherToken);
    assert(connTeacher.success, '10. Teacher authenticated successfully over Socket.IO');
    teacherSocket = connTeacher.socket;

    const connParent1 = await connectTestSocket(parent1Token);
    assert(connParent1.success, '11. Parent 1 authenticated successfully over Socket.IO');
    parent1Socket = connParent1.socket;

    const connParent2 = await connectTestSocket(parent2Token);
    assert(connParent2.success, '12. Parent 2 authenticated successfully over Socket.IO');
    parent2Socket = connParent2.socket;

    // 3. Real-Time Messaging & Scoped Delivery
    // Teacher creates conversation for Student 1
    const resConv = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/teacher/conversations', method: 'POST', headers: { Authorization: `Bearer ${teacherToken}`, 'Content-Type': 'application/json' } },
      { studentId: student1Profile.studentId, parentId: parent1Profile.parentId }
    );
    assert(resConv.status === 201, '13. Created Teacher <-> Parent conversation for Child A');
    conversationId = resConv.data.data.id;

    // Setup message listener on Parent 1 and Parent 2
    let parent1ReceivedMessage = null;
    let parent2ReceivedMessage = null;

    parent1Socket.on('message:new', (msg) => {
      parent1ReceivedMessage = msg;
    });

    parent2Socket.on('message:new', (msg) => {
      parent2ReceivedMessage = msg;
    });

    // Teacher sends message via REST API
    const resMsg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/teacher/conversations/${conversationId}/messages`, method: 'POST', headers: { Authorization: `Bearer ${teacherToken}`, 'Content-Type': 'application/json' } },
      { message: 'Hello Mr. Connor, Timmy did great in Calculus today!' }
    );
    assert(resMsg.status === 201, '14. Teacher sent message via REST API (HTTP 201)');

    // Wait 500ms for event propagation
    await new Promise((r) => setTimeout(r, 500));

    assert(parent1ReceivedMessage !== null, '15. Parent 1 received real-time message:new event');
    assert(parent1ReceivedMessage && parent1ReceivedMessage.conversationId === conversationId, '16. Message payload contains correct conversationId');
    assert(parent1ReceivedMessage && parent1ReceivedMessage.message.includes('Timmy did great'), '17. Message text delivered accurately');
    assert(parent2ReceivedMessage === null, '18. Unrelated Parent 2 did NOT receive the message (Isolation PASS)');

    // 4. Real-Time Notifications Delivery
    let parent1ReceivedNotification = null;
    parent1Socket.on('notification:new', (notif) => {
      parent1ReceivedNotification = notif;
    });

    // Teacher publishes Homework
    await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/teacher/homework', method: 'POST', headers: { Authorization: `Bearer ${teacherToken}`, 'Content-Type': 'application/json' } },
      { title: 'Calculus Real-Time Set', description: 'Complete questions 1 to 5', subject: 'Mathematics', dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] }
    );

    // Wait 500ms for event propagation
    await new Promise((r) => setTimeout(r, 500));

    assert(parent1ReceivedNotification !== null, '19. Parent 1 received real-time notification:new on Homework published');
    assert(parent1ReceivedNotification && parent1ReceivedNotification.type === 'HOMEWORK', '20. Notification type is HOMEWORK');

    // 5. Offline Message & Notification Persistence
    // Disconnect Parent 1 socket to simulate offline state
    parent1Socket.disconnect();

    // Teacher sends another message while Parent 1 is offline
    await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/teacher/conversations/${conversationId}/messages`, method: 'POST', headers: { Authorization: `Bearer ${teacherToken}`, 'Content-Type': 'application/json' } },
      { message: 'Offline test message: Timmy is selected for Math Olympiad!' }
    );

    // Parent 1 reconnects and fetches stored messages via REST
    const resFetchStored = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/conversations/${conversationId}/messages`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parent1Token}` }
    });
    assert(resFetchStored.status === 200, '21. Parent reconnected and retrieved messages (HTTP 200)');
    const lastMsg = resFetchStored.data.data.messages[resFetchStored.data.data.messages.length - 1];
    assert(lastMsg && lastMsg.message.includes('Math Olympiad'), '22. Offline message preserved in DB without loss');

    // 6. Admin Analytics Improvements
    const resAdminDash = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resAdminDash.status === 200, '23. Admin GET /api/admin/dashboard (HTTP 200)');
    assert(resAdminDash.data.data.analytics !== undefined, '24. Analytics object returned in response');
    assert(typeof resAdminDash.data.data.analytics.attendance?.overallRate === 'number', '25. attendance overallRate computed');
    assert(typeof resAdminDash.data.data.analytics.homework?.completionRate === 'number', '26. homework completionRate computed');
    assert(typeof resAdminDash.data.data.analytics.marks?.gradeDistribution === 'object', '27. gradeDistribution computed');

    // 7. Security Hardening & Headers Checks
    const resHealth = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    assert(resHealth.status === 200, '28. GET /api/health (HTTP 200)');
    assert(resHealth.headers['x-content-type-options'] === 'nosniff', '29. Helmet x-content-type-options header present');
    assert(resHealth.headers['x-frame-options'] === 'SAMEORIGIN', '30. Helmet x-frame-options header present');

    // Clean up sockets
    if (teacherSocket) teacherSocket.disconnect();
    if (parent2Socket) parent2Socket.disconnect();

    console.log(`\n================================================================`);
    console.log(`🎉 Step 9 Real-Time & Hardening Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`================================================================\n`);

  } catch (error) {
    console.error('Fatal Real-time test execution error:', error);
    process.exitCode = 1;
  }
}

runRealtimeTests();
