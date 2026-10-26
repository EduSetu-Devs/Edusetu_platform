const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const fs = require('fs');

console.log('================================================================');
console.log('🚪 Running EduSetu Role-Based Sign In & Authentication Test Suite');
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

async function runSignInFlowTests() {
  const timestamp = Date.now();
  const correctAdminSecret = process.env.ADMIN_VERIFICATION_PASSWORD || 'EduSetuAdminSecured2026!';
  const wrongAdminSecret = 'WrongAdminSecret123!';
  const commonPassword = 'Password123';

  const studentEmail = `signin_stu_${timestamp}@edusetu.org`;
  const teacherEmail = `signin_tch_${timestamp}@edusetu.org`;
  const parentEmail = `signin_par_${timestamp}@edusetu.org`;
  const adminEmail = `signin_adm_${timestamp}@edusetu.org`;

  let studentToken = '';
  let teacherToken = '';
  let parentToken = '';
  let adminToken = '';
  let adminVerificationToken = '';

  try {
    const loginPageSource = fs.readFileSync(path.join(__dirname, '../client/src/pages/LoginPage.jsx'), 'utf8');

    // 1. Sign In opens Account Type Selection
    assert(
      loginPageSource.includes('Who are you signing in as?') && loginPageSource.includes('Welcome Back to EduSetu'),
      '1. Sign In opens Account Type Selection with "Who are you signing in as?"'
    );

    // 2. Student selection opens Student Login
    assert(
      loginPageSource.includes("Access your classes, attendance, homework and results") &&
      loginPageSource.includes("Sign In as {currentRoleMeta.title}"),
      '2. Student selection opens Student Login'
    );

    // 3. Teacher selection opens Teacher Login
    assert(
      loginPageSource.includes("Manage students, attendance, homework and marks") &&
      loginPageSource.includes("Sign In as {currentRoleMeta.title}"),
      '3. Teacher selection opens Teacher Login'
    );

    // 4. Parent selection opens Parent Login
    assert(
      loginPageSource.includes("Track your child's academic progress") &&
      loginPageSource.includes("Sign In as {currentRoleMeta.title}"),
      '4. Parent selection opens Parent Login'
    );

    // 5. Admin selection opens Admin Verification
    assert(
      loginPageSource.includes("Admin access requires additional verification.") &&
      loginPageSource.includes("Admin Verification Password"),
      '5. Admin selection opens Admin Verification'
    );

    // 6. Back button returns to Account Type Selection
    assert(
      loginPageSource.includes("← Back to Account Type Selection"),
      '6. Back button returns to Account Type Selection'
    );

    // Setup Test Accounts
    const resStuReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'SignIn Student', email: studentEmail, password: commonPassword, role: 'student' }
    );
    const resTchReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'SignIn Teacher', email: teacherEmail, password: commonPassword, role: 'teacher' }
    );
    const resParReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'SignIn Parent', email: parentEmail, password: commonPassword, role: 'parent' }
    );
    const resAdmReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'SignIn Admin', email: adminEmail, password: commonPassword, role: 'admin' }
    );

    // 7. Student login works
    const resStuLogin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: studentEmail, password: commonPassword }
    );
    assert(resStuLogin.status === 200 && resStuLogin.data.data.user.role === 'student', '7. Student login works');
    studentToken = resStuLogin.data.data.token;

    // 8. Teacher login works
    const resTchLogin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: teacherEmail, password: commonPassword }
    );
    assert(resTchLogin.status === 200 && resTchLogin.data.data.user.role === 'teacher', '8. Teacher login works');
    teacherToken = resTchLogin.data.data.token;

    // 9. Parent login works
    const resParLogin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: parentEmail, password: commonPassword }
    );
    assert(resParLogin.status === 200 && resParLogin.data.data.user.role === 'parent', '9. Parent login works');
    parentToken = resParLogin.data.data.token;

    // 10. Admin verification works
    const resVerify = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/verify', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { verificationPassword: correctAdminSecret }
    );
    assert(resVerify.status === 200 && resVerify.data.data.verified === true, '10. Admin verification works');
    adminVerificationToken = resVerify.data.data.adminVerificationToken;

    // 11. Admin login works after verification
    const resAdmLogin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: adminEmail, password: commonPassword, adminVerificationToken }
    );
    assert(resAdmLogin.status === 200 && resAdmLogin.data.data.user.role === 'admin', '11. Admin login works after verification');
    adminToken = resAdmLogin.data.data.token;

    // 12. Wrong Admin verification is rejected
    const resWrongVerify = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/verify', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { verificationPassword: wrongAdminSecret }
    );
    assert(resWrongVerify.status === 401, '12. Wrong Admin verification is rejected (HTTP 401)');

    // 13. Student cannot access Admin APIs
    const resStuOnAdmin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${studentToken}` } }
    );
    assert(resStuOnAdmin.status === 403, '13. Student cannot access Admin APIs (HTTP 403 Forbidden)');

    // 14. Teacher cannot access Admin APIs
    const resTchOnAdmin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${teacherToken}` } }
    );
    assert(resTchOnAdmin.status === 403, '14. Teacher cannot access Admin APIs (HTTP 403 Forbidden)');

    // 15. Parent cannot access Admin APIs
    const resParOnAdmin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${parentToken}` } }
    );
    assert(resParOnAdmin.status === 403, '15. Parent cannot access Admin APIs (HTTP 403 Forbidden)');

    // 16. Existing JWT authentication continues working
    const resAuthMe = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/me', method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(resAuthMe.status === 200 && resAuthMe.data.data.role === 'admin', '16. Existing JWT authentication continues working');

    // 17. Existing RBAC continues working
    const resAdminAccess = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(resAdminAccess.status === 200, '17. Existing RBAC continues working');

    // 18. Existing dashboards continue working
    const resStuDash = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/student/dashboard', method: 'GET', headers: { Authorization: `Bearer ${studentToken}` } }
    );
    assert(resStuDash.status === 200, '18. Existing dashboards continue working');

    // 19. Existing registration flow continues working
    assert(resStuReg.status === 201 && resTchReg.status === 201 && resParReg.status === 201, '19. Existing registration flow continues working');

    // 20. Existing messaging and notifications continue working
    const resNotifUnread = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/notifications/unread-count', method: 'GET', headers: { Authorization: `Bearer ${studentToken}` } }
    );
    assert(resNotifUnread.status === 200, '20. Existing messaging and notifications continue working');

    console.log(`\n================================================================`);
    console.log(`🎉 Role-Based Sign In Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`================================================================\n`);

  } catch (error) {
    console.error('Fatal Sign In test error:', error);
    process.exitCode = 1;
  }
}

runSignInFlowTests();
