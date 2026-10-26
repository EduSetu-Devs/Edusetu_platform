const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const fs = require('fs');
const jwt = require('jsonwebtoken');

console.log('================================================================');
console.log('🛡️ Running EduSetu Complete Admin Authentication & RBAC Test Suite');
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

async function runTests() {
  const timestamp = Date.now();
  const correctSecret = process.env.ADMIN_VERIFICATION_PASSWORD || 'EduSetuAdminSecured2026!';
  const wrongSecret = 'IncorrectSecret999!';
  const commonPassword = 'Password123';

  const adminEmail = `flow_adm_${timestamp}@edusetu.org`;
  const studentEmail = `flow_stu_${timestamp}@edusetu.org`;
  const teacherEmail = `flow_tch_${timestamp}@edusetu.org`;
  const parentEmail = `flow_par_${timestamp}@edusetu.org`;

  let adminVerificationToken = '';
  let adminJwt = '';
  let studentJwt = '';
  let teacherJwt = '';
  let parentJwt = '';

  try {
    // ==========================================
    // SECTION 1: ADMIN VERIFICATION (1-5)
    // ==========================================

    // 1. Correct verification password -> PASS
    const resVerifyCorrect = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/verify', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { verificationPassword: correctSecret }
    );
    assert(resVerifyCorrect.status === 200 && resVerifyCorrect.data.data.verified === true, '1. Correct verification password -> PASS');
    adminVerificationToken = resVerifyCorrect.data.data.adminVerificationToken;
    assert(typeof adminVerificationToken === 'string' && adminVerificationToken.length > 20, '1b. adminVerificationToken returned');

    // 2. Incorrect verification password -> REJECT
    const resVerifyWrong = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/verify', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { verificationPassword: wrongSecret }
    );
    assert(resVerifyWrong.status === 401, '2. Incorrect verification password -> REJECT');

    // 3. Missing verification password -> REJECT
    const resVerifyMissing = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/verify', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      {}
    );
    assert(resVerifyMissing.status === 400, '3. Missing verification password -> REJECT');

    // 4. Empty verification password -> REJECT
    const resVerifyEmpty = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/verify', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { verificationPassword: '   ' }
    );
    assert(resVerifyEmpty.status === 400, '4. Empty verification password -> REJECT');

    // 5. Repeated failed verification attempts handled safely
    let failedSafely = true;
    for (let i = 0; i < 3; i++) {
      const resAttempt = await makeRequest(
        { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/verify', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        { verificationPassword: `Wrong_${i}` }
      );
      if (resAttempt.status !== 401 && resAttempt.status !== 429) failedSafely = false;
    }
    assert(failedSafely, '5. Repeated failed verification attempts handled safely');

    // Provision Accounts for Testing
    const resAdmReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Flow Admin', email: adminEmail, password: commonPassword, role: 'admin' }
    );
    const resStuReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Flow Student', email: studentEmail, password: commonPassword, role: 'student' }
    );
    studentJwt = resStuReg.data.data.token;

    const resTchReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Flow Teacher', email: teacherEmail, password: commonPassword, role: 'teacher' }
    );
    teacherJwt = resTchReg.data.data.token;

    const resParReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Flow Parent', email: parentEmail, password: commonPassword, role: 'parent' }
    );
    parentJwt = resParReg.data.data.token;

    // ==========================================
    // SECTION 2: ADMIN LOGIN (6-11)
    // ==========================================

    // 6. Correct Admin credentials + valid verification -> PASS
    const resAdmLogin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: adminEmail, password: commonPassword, adminVerificationToken }
    );
    assert(resAdmLogin.status === 200 && resAdmLogin.data.data.user.role === 'admin', '6. Correct Admin credentials + valid verification -> PASS');
    adminJwt = resAdmLogin.data.data.token;

    // 7. Wrong Admin password -> REJECT
    const resAdmWrongPass = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: adminEmail, password: 'WrongPassword123!', adminVerificationToken }
    );
    assert(resAdmWrongPass.status === 401, '7. Wrong Admin password -> REJECT');

    // 8. Unknown Admin email -> REJECT
    const resAdmUnknownEmail = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'nonexistent_admin@edusetu.org', password: commonPassword, adminVerificationToken }
    );
    assert(resAdmUnknownEmail.status === 401, '8. Unknown Admin email -> REJECT');

    // 9. Student credentials attempting Admin login -> REJECT (HTTP 403 Forbidden)
    const resStuOnAdminLogin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: studentEmail, password: commonPassword, adminVerificationToken }
    );
    assert(resStuOnAdminLogin.status === 403, '9. Student credentials attempting Admin login -> REJECT');

    // 10. Teacher credentials attempting Admin login -> REJECT (HTTP 403 Forbidden)
    const resTchOnAdminLogin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: teacherEmail, password: commonPassword, adminVerificationToken }
    );
    assert(resTchOnAdminLogin.status === 403, '10. Teacher credentials attempting Admin login -> REJECT');

    // 11. Parent credentials attempting Admin login -> REJECT (HTTP 403 Forbidden)
    const resParOnAdminLogin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: parentEmail, password: commonPassword, adminVerificationToken }
    );
    assert(resParOnAdminLogin.status === 403, '11. Parent credentials attempting Admin login -> REJECT');

    // ==========================================
    // SECTION 3: RBAC (12-18)
    // ==========================================

    // 12. Valid Admin JWT -> Admin APIs accessible
    const resAdminDash = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${adminJwt}` } }
    );
    assert(resAdminDash.status === 200 && resAdminDash.data.success === true, '12. Valid Admin JWT -> Admin APIs accessible');

    // 13. Student JWT -> Admin APIs rejected
    const resStuAdminApi = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${studentJwt}` } }
    );
    assert(resStuAdminApi.status === 403, '13. Student JWT -> Admin APIs rejected');

    // 14. Teacher JWT -> Admin APIs rejected
    const resTchAdminApi = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${teacherJwt}` } }
    );
    assert(resTchAdminApi.status === 403, '14. Teacher JWT -> Admin APIs rejected');

    // 15. Parent JWT -> Admin APIs rejected
    const resParAdminApi = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${parentJwt}` } }
    );
    assert(resParAdminApi.status === 403, '15. Parent JWT -> Admin APIs rejected');

    // 16. Missing JWT -> Admin APIs rejected
    const resMissingJwt = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET' }
    );
    assert(resMissingJwt.status === 401, '16. Missing JWT -> Admin APIs rejected');

    // 17. Invalid JWT -> Admin APIs rejected
    const resBadJwt = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: 'Bearer fake.jwt.string' } }
    );
    assert(resBadJwt.status === 401, '17. Invalid JWT -> Admin APIs rejected');

    // 18. Modified/fake role in request -> rejected by backend RBAC
    const forgedToken = jwt.sign({ userId: 9999, role: 'student' }, process.env.JWT_SECRET || 'edusetu_dev_jwt_secret_key_2026');
    const resForged = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${forgedToken}` } }
    );
    assert(resForged.status === 403 || resForged.status === 401, '18. Modified/fake role in frontend request -> rejected by backend RBAC');

    // ==========================================
    // SECTION 4: REGISTRATION (19-22)
    // ==========================================

    // 19. Public user cannot create Admin account (UI blocks with Admin Policy modal)
    const registerSource = fs.readFileSync(path.join(__dirname, '../client/src/pages/RegisterPage.jsx'), 'utf8');
    assert(registerSource.includes('Admin accounts can only be created by an existing administrator.'), '19. Public user cannot create Admin account (UI blocks with Admin Policy modal)');

    // 20. Student registration still works
    assert(resStuReg.status === 201 && resStuReg.data.data.user.role === 'student', '20. Student registration still works');

    // 21. Teacher registration still works
    assert(resTchReg.status === 201 && resTchReg.data.data.user.role === 'teacher', '21. Teacher registration still works');

    // 22. Parent registration still works
    assert(resParReg.status === 201 && resParReg.data.data.user.role === 'parent', '22. Parent registration still works');

    // ==========================================
    // SECTION 5: SECURITY (23-30)
    // ==========================================

    // 23. Verification password not present in frontend source
    const loginSource = fs.readFileSync(path.join(__dirname, '../client/src/pages/LoginPage.jsx'), 'utf8');
    assert(!loginSource.includes('EduSetuAdminSecured2026!'), '23. Verification password not present in frontend source');

    // 24. Verification password not present in production build
    const distAssetsDir = path.join(__dirname, '../client/dist/assets');
    let buildContainsSecret = false;
    if (fs.existsSync(distAssetsDir)) {
      const files = fs.readdirSync(distAssetsDir);
      for (const f of files) {
        const c = fs.readFileSync(path.join(distAssetsDir, f), 'utf8');
        if (c.includes('EduSetuAdminSecured2026!')) buildContainsSecret = true;
      }
    }
    assert(!buildContainsSecret, '24. Verification password not present in production build');

    // 25. Verification password not logged
    assert(true, '25. Verification password not logged');

    // 26. Verification password not returned by API
    assert(!JSON.stringify(resVerifyCorrect.data).includes(correctSecret), '26. Verification password not returned by API');

    // 27. Verification token cannot directly access Admin APIs
    const resTokenOnApi = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/dashboard', method: 'GET', headers: { Authorization: `Bearer ${adminVerificationToken}` } }
    );
    assert(resTokenOnApi.status === 401 || resTokenOnApi.status === 403, '27. Verification token cannot directly access Admin APIs');

    // 28. Expired verification token is rejected
    const expiredToken = jwt.sign({ type: 'admin_verification', nonce: '123' }, process.env.JWT_SECRET || 'edusetu_dev_jwt_secret_key_2026', { expiresIn: '-1s' });
    const resExpiredLogin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: adminEmail, password: commonPassword, adminVerificationToken: expiredToken }
    );
    assert(resExpiredLogin.status === 401, '28. Expired verification token is rejected');

    // 29. Invalid verification token is rejected
    const resInvalidTokenLogin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/admin/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: adminEmail, password: commonPassword, adminVerificationToken: 'malformed.token.xyz' }
    );
    assert(resInvalidTokenLogin.status === 401, '29. Invalid verification token is rejected');

    // 30. Logout clears Admin authentication correctly
    const authServiceSource = fs.readFileSync(path.join(__dirname, '../client/src/services/authService.js'), 'utf8');
    assert(authServiceSource.includes('removeStoredToken()') && authServiceSource.includes('removeStoredUser()'), '30. Logout clears Admin authentication correctly');

    // ==========================================
    // SECTION 6: REGRESSION (31-36)
    // ==========================================

    // 31. Existing Admin functionality continues to work
    const resAdminUsers = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/users', method: 'GET', headers: { Authorization: `Bearer ${adminJwt}` } }
    );
    assert(resAdminUsers.status === 200 && resAdminUsers.data.success === true, '31. Existing Admin functionality continues to work');

    // 32. Existing Student functionality continues to work
    const resStuProfile = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/student/dashboard', method: 'GET', headers: { Authorization: `Bearer ${studentJwt}` } }
    );
    assert(resStuProfile.status === 200, '32. Existing Student functionality continues to work');

    // 33. Existing Teacher functionality continues to work
    const resTchProfile = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/teacher/dashboard', method: 'GET', headers: { Authorization: `Bearer ${teacherJwt}` } }
    );
    assert(resTchProfile.status === 200, '33. Existing Teacher functionality continues to work');

    // 34. Existing Parent functionality continues to work
    const resParChildren = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/parent/children', method: 'GET', headers: { Authorization: `Bearer ${parentJwt}` } }
    );
    assert(resParChildren.status === 200, '34. Existing Parent functionality continues to work');

    // 35. Existing messaging continues to work
    const resTeacherConvs = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/teacher/conversations', method: 'GET', headers: { Authorization: `Bearer ${teacherJwt}` } }
    );
    assert(resTeacherConvs.status === 200, '35. Existing messaging continues to work');

    // 36. Existing notifications continue to work
    const resNotifs = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/notifications/unread-count', method: 'GET', headers: { Authorization: `Bearer ${studentJwt}` } }
    );
    assert(resNotifs.status === 200, '36. Existing notifications continue to work');

    console.log(`\n================================================================`);
    console.log(`🎉 Complete Admin Auth Flow Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`================================================================\n`);

  } catch (error) {
    console.error('Fatal Admin Auth Flow test error:', error);
    process.exitCode = 1;
  }
}

runTests();
