const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const { sequelize } = require('./src/config/db');

console.log('================================================================');
console.log('🌱 EduSetu Post-Reset Fresh State Verification');
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

async function verifyFreshState() {
  const timestamp = Date.now();
  const commonPassword = 'Password123';
  const adminSecret = process.env.ADMIN_VERIFICATION_PASSWORD || 'EduSetuAdminSecured2026!';

  try {
    // 1. Database Connection & Health
    const resHealth = await makeRequest({ hostname: '127.0.0.1', port: 5000, path: '/api/health', method: 'GET' });
    assert(resHealth.status === 200 && resHealth.data.data.database.status === 'connected', '1. Database connection works and API health is 200 OK');

    // 2. Tables still exist
    const [tables] = await sequelize.query('SHOW TABLES;');
    assert(tables.length >= 15, `2. Database tables preserved (${tables.length} tables found)`);

    // 3. User table is clean (or has only newly registered accounts)
    const [userCount] = await sequelize.query('SELECT COUNT(*) as cnt FROM users;');
    assert(userCount[0].cnt === 0, `3. User table is completely clean (0 old test users)`);

    // 4. Messages clean
    const [msgCount] = await sequelize.query('SELECT COUNT(*) as cnt FROM messages;');
    assert(msgCount[0].cnt === 0, '4. Messages table clean (0 old records)');

    // 5. Notifications clean
    const [notifCount] = await sequelize.query('SELECT COUNT(*) as cnt FROM notifications;');
    assert(notifCount[0].cnt === 0, '5. Notifications table clean (0 old records)');

    // 6. Attendance clean
    const [attCount] = await sequelize.query('SELECT COUNT(*) as cnt FROM attendances;');
    assert(attCount[0].cnt === 0, '6. Attendance table clean (0 old records)');

    // 7. Homework clean
    const [hwCount] = await sequelize.query('SELECT COUNT(*) as cnt FROM homeworks;');
    assert(hwCount[0].cnt === 0, '7. Homework table clean (0 old records)');

    // 8. Marks clean
    const [marksCount] = await sequelize.query('SELECT COUNT(*) as cnt FROM marks;');
    assert(marksCount[0].cnt === 0, '8. Marks table clean (0 old records)');

    // 9. Student Registration Works
    const stuEmail = `fresh_student_${timestamp}@edusetu.org`;
    const resStuReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Fresh Student', email: stuEmail, password: commonPassword, role: 'student' }
    );
    assert(resStuReg.status === 201 && resStuReg.data.data.user.role === 'student', '9. Fresh Student registration succeeds (HTTP 201)');
    const studentJwt = resStuReg.data.data.token;

    // 10. Teacher Registration Works
    const tchEmail = `fresh_teacher_${timestamp}@edusetu.org`;
    const resTchReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Fresh Teacher', email: tchEmail, password: commonPassword, role: 'teacher' }
    );
    assert(resTchReg.status === 201 && resTchReg.data.data.user.role === 'teacher', '10. Fresh Teacher registration succeeds (HTTP 201)');
    const teacherJwt = resTchReg.data.data.token;

    // 11. Parent Registration Works
    const parEmail = `fresh_parent_${timestamp}@edusetu.org`;
    const resParReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Fresh Parent', email: parEmail, password: commonPassword, role: 'parent' }
    );
    assert(resParReg.status === 201 && resParReg.data.data.user.role === 'parent', '11. Fresh Parent registration succeeds (HTTP 201)');
    const parentJwt = resParReg.data.data.token;

    // 12. Admin Verification Password verification
    const resVerify = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/verify', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { verificationPassword: adminSecret }
    );
    assert(resVerify.status === 200 && resVerify.data.data.verified === true, '12. Admin verification password check succeeds (HTTP 200)');
    const adminVerificationToken = resVerify.data.data.adminVerificationToken;

    // 13. Create Fresh Admin Account & Verify Admin Login
    const admEmail = `fresh_admin_${timestamp}@edusetu.org`;
    const resAdmReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Fresh Administrator', email: admEmail, password: commonPassword, role: 'admin' }
    );
    assert(resAdmReg.status === 201 && resAdmReg.data.data.user.role === 'admin', '13. Admin account provisioned successfully');

    // 14. Admin Login with Verification Token
    const resAdmLogin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: admEmail, password: commonPassword, adminVerificationToken }
    );
    assert(resAdmLogin.status === 200 && resAdmLogin.data.data.user.role === 'admin', '14. Admin login with verification token succeeds (HTTP 200)');
    const adminJwt = resAdmLogin.data.data.token;

    // 15. Admin RBAC Authorization
    const resAdminDash = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${adminJwt}` } }
    );
    assert(resAdminDash.status === 200 && resAdminDash.data.success === true, '15. Admin JWT has access to Admin APIs');

    // 16. Student blocked from Admin API
    const resStuOnAdmin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${studentJwt}` } }
    );
    assert(resStuOnAdmin.status === 403, '16. Student JWT blocked from Admin APIs (HTTP 403 Forbidden)');

    // 17. Teacher blocked from Admin API
    const resTchOnAdmin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${teacherJwt}` } }
    );
    assert(resTchOnAdmin.status === 403, '17. Teacher JWT blocked from Admin APIs (HTTP 403 Forbidden)');

    // 18. Parent blocked from Admin API
    const resParOnAdmin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${parentJwt}` } }
    );
    assert(resParOnAdmin.status === 403, '18. Parent JWT blocked from Admin APIs (HTTP 403 Forbidden)');

    // 19. Student Dashboard works
    const resStuDash = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/student/dashboard', method: 'GET', headers: { Authorization: `Bearer ${studentJwt}` } }
    );
    assert(resStuDash.status === 200, '19. Student dashboard functions normally');

    // 20. Teacher Dashboard works
    const resTchDash = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/teacher/dashboard', method: 'GET', headers: { Authorization: `Bearer ${teacherJwt}` } }
    );
    assert(resTchDash.status === 200, '20. Teacher dashboard functions normally');

    // 21. Parent Children endpoint works
    const resParChildren = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/parent/children', method: 'GET', headers: { Authorization: `Bearer ${parentJwt}` } }
    );
    assert(resParChildren.status === 200, '21. Parent children endpoint functions normally');

    console.log(`\n================================================================`);
    console.log(`🎉 Fresh State Verification Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`================================================================\n`);

    await sequelize.close();
  } catch (error) {
    console.error('Fatal Fresh State Verification error:', error);
    try { await sequelize.close(); } catch (e) {}
    process.exitCode = 1;
  }
}

verifyFreshState();
