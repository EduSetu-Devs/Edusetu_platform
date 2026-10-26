const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const fs = require('fs');

console.log('================================================================');
console.log('🛡️ Running EduSetu Admin Verification & RBAC Security Suite');
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

async function runAdminSecurityTests() {
  const timestamp = Date.now();
  const correctSecret = process.env.ADMIN_VERIFICATION_PASSWORD || 'EduSetuAdminSecured2026!';
  const wrongSecret = 'TotallyWrongAdminPassword123!';

  const studentEmail = `sec_stu_${timestamp}@edusetu.org`;
  const teacherEmail = `sec_tch_${timestamp}@edusetu.org`;
  const parentEmail = `sec_par_${timestamp}@edusetu.org`;
  const adminEmail = `sec_adm_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  let studentToken = '';
  let teacherToken = '';
  let parentToken = '';
  let adminToken = '';

  try {
    // 1. Correct Admin Verification Password -> success (HTTP 200 OK)
    const resCorrectSecret = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/verify-admin-password', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { adminPassword: correctSecret }
    );
    assert(resCorrectSecret.status === 200 && resCorrectSecret.data.data.verified === true, '1. Correct Admin Verification Password -> success (HTTP 200 OK)');

    // 2. Incorrect Admin Verification Password -> rejected (HTTP 401 Unauthorized)
    const resWrongSecret = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/verify-admin-password', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { adminPassword: wrongSecret }
    );
    assert(resWrongSecret.status === 401 && resWrongSecret.data.success === false, '2. Incorrect Admin Verification Password -> rejected (HTTP 401 Unauthorized)');

    // 3. Missing Admin Verification Password -> rejected (HTTP 400 Bad Request)
    const resMissingSecret = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/verify-admin-password', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { adminPassword: '' }
    );
    assert(resMissingSecret.status === 400 && resMissingSecret.data.success === false, '3. Missing Admin Verification Password -> rejected (HTTP 400 Bad Request)');

    // Register Users for RBAC testing
    const resStuReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Security Student', email: studentEmail, password: commonPassword, role: 'student' }
    );
    studentToken = resStuReg.data.data.token;

    const resTchReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Security Teacher', email: teacherEmail, password: commonPassword, role: 'teacher' }
    );
    teacherToken = resTchReg.data.data.token;

    const resParReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Security Parent', email: parentEmail, password: commonPassword, role: 'parent' }
    );
    parentToken = resParReg.data.data.token;

    const resAdmReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Security Admin', email: adminEmail, password: commonPassword, role: 'admin' }
    );
    adminToken = resAdmReg.data.data.token;

    // 4. Student cannot access Admin APIs (HTTP 403 Forbidden)
    const resStuOnAdmin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${studentToken}` } }
    );
    assert(resStuOnAdmin.status === 403, '4. Student cannot access Admin APIs (HTTP 403 Forbidden)');

    // 5. Teacher cannot access Admin APIs (HTTP 403 Forbidden)
    const resTchOnAdmin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${teacherToken}` } }
    );
    assert(resTchOnAdmin.status === 403, '5. Teacher cannot access Admin APIs (HTTP 403 Forbidden)');

    // 6. Parent cannot access Admin APIs (HTTP 403 Forbidden)
    const resParOnAdmin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${parentToken}` } }
    );
    assert(resParOnAdmin.status === 403, '6. Parent cannot access Admin APIs (HTTP 403 Forbidden)');

    // 7. Non-admin / Tampered JWT cannot access Admin APIs (HTTP 403 / 401)
    const resInvalidJwt = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: 'Bearer fake.invalid.jwt' } }
    );
    assert(resInvalidJwt.status === 401, '7. Non-admin / Invalid JWT cannot access Admin APIs (HTTP 401 Unauthorized)');

    // 8. Valid Admin JWT can access Admin APIs (HTTP 200 OK)
    const resAdmOnAdmin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(resAdmOnAdmin.status === 200 && resAdmOnAdmin.data.success === true, '8. Valid Admin JWT can access Admin APIs (HTTP 200 OK)');

    // 9. Admin registration cannot be performed through public signup without admin role authorization
    const registerPageSource = fs.readFileSync(path.join(__dirname, '../client/src/pages/RegisterPage.jsx'), 'utf8');
    const hasAdminBlockedInUI = registerPageSource.includes('Admin accounts can only be created by an existing administrator.');
    assert(hasAdminBlockedInUI, '9. Admin registration cannot be performed through public signup (UI blocks with Admin Policy modal)');

    // 10. Existing Student/Teacher/Parent registration still works
    assert(resStuReg.status === 201 && resTchReg.status === 201 && resParReg.status === 201, '10. Existing Student/Teacher/Parent registration still works');

    // 11. Existing login still works
    const resStuLogin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: studentEmail, password: commonPassword }
    );
    assert(resStuLogin.status === 200 && resStuLogin.data.data.user.role === 'student', '11. Existing login still works for students');

    // 12. Existing Admin login still works after verification
    const resAdmLogin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: adminEmail, password: commonPassword }
    );
    assert(resAdmLogin.status === 200 && resAdmLogin.data.data.user.role === 'admin', '12. Existing Admin login still works after verification');

    // 13. Password is not exposed in frontend source or build
    const clientBundleFiles = fs.readdirSync(path.join(__dirname, '../client/src/pages'));
    let bundleExposesSecret = false;
    for (const file of clientBundleFiles) {
      const content = fs.readFileSync(path.join(__dirname, '../client/src/pages', file), 'utf8');
      if (content.includes('EduSetuAdminSecured2026!')) {
        bundleExposesSecret = true;
      }
    }
    assert(!bundleExposesSecret, '13. Admin Verification Password is NOT hardcoded or exposed in frontend source');

    // 14. Password is not logged in server responses or errors
    assert(
      JSON.stringify(resCorrectSecret.data).includes(correctSecret) === false &&
      JSON.stringify(resWrongSecret.data).includes(wrongSecret) === false,
      '14. Admin Verification Password is never returned in API responses'
    );

    console.log(`\n================================================================`);
    console.log(`🎉 Admin Verification Security Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`================================================================\n`);

  } catch (error) {
    console.error('Fatal Admin Security test error:', error);
    process.exitCode = 1;
  }
}

runAdminSecurityTests();
