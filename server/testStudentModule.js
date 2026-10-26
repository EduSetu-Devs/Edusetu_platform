const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const { User, StudentProfile } = require('./src/models');

console.log('====================================================');
console.log('🎓 Running EduSetu Step 4A Student Module Test Suite');
console.log('====================================================\n');

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

async function runStudentTests() {
  const timestamp = Date.now();
  const studentEmail = `student_mod_${timestamp}@edusetu.org`;
  const teacherEmail = `teacher_mod_${timestamp}@edusetu.org`;
  const parentEmail = `parent_mod_${timestamp}@edusetu.org`;
  const adminEmail = `admin_mod_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  let studentToken = '';
  let teacherToken = '';
  let parentToken = '';
  let adminToken = '';

  try {
    // 1. Model Association Verification
    assert(typeof User.associations.studentProfile !== 'undefined', '1. User hasOne StudentProfile association defined');
    assert(typeof StudentProfile.associations.user !== 'undefined', '2. StudentProfile belongsTo User association defined');

    // 2. Register Student & Auto-create StudentProfile
    const resReg = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Rohan Verma',
        email: studentEmail,
        password: commonPassword,
        role: 'student',
        phone: '9876543210',
        className: 'Class 10',
        section: 'A',
        rollNumber: '24'
      }
    );

    assert(resReg.status === 201 && resReg.data.success === true, '3. Register student user (HTTP 201)');
    assert(!!resReg.data.data.user.studentProfile, '4. StudentProfile is created and returned with registration');
    assert(resReg.data.data.user.studentProfile.studentId.startsWith('STU'), '5. Unique studentId is generated');
    studentToken = resReg.data.data.token;

    // 3. Register Teacher, Parent, Admin for RBAC testing
    const resT = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Teacher Test', email: teacherEmail, password: commonPassword, role: 'teacher' }
    );
    teacherToken = resT.data.data.token;

    const resP = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Parent Test', email: parentEmail, password: commonPassword, role: 'parent' }
    );
    parentToken = resP.data.data.token;

    const resA = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Admin Test', email: adminEmail, password: commonPassword, role: 'admin' }
    );
    adminToken = resA.data.data.token;

    // 4. Student GET Profile
    const resProf = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    assert(resProf.status === 200 && resProf.data.success === true, '6. Student GET /api/student/profile (HTTP 200)');
    assert(resProf.data.data.email === studentEmail, '7. Profile email matches authenticated student');
    assert(resProf.data.data.className === 'Class 10', '8. Profile className is retrieved accurately');
    assert(resProf.data.data.password === undefined, '9. Password is NOT returned in profile');

    // 5. Student PUT Profile Update
    const resUpdate = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/student/profile',
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${studentToken}`,
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'Rohan Sharma',
        className: 'B.Tech CSE',
        section: 'B',
        rollNumber: '108',
        gender: 'Male',
        address: 'New Delhi, India',
        phone: '9998887776'
      }
    );

    assert(resUpdate.status === 200 && resUpdate.data.success === true, '10. Student PUT /api/student/profile (HTTP 200)');
    assert(resUpdate.data.data.name === 'Rohan Sharma', '11. Updated name is reflected in response');
    assert(resUpdate.data.data.className === 'B.Tech CSE', '12. Updated className is saved');
    assert(resUpdate.data.data.address === 'New Delhi, India', '13. Updated address is saved');

    // 6. Student GET Dashboard
    const resDash = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    assert(resDash.status === 200 && resDash.data.success === true, '14. Student GET /api/student/dashboard (HTTP 200)');
    assert(resDash.data.data.student.name === 'Rohan Sharma', '15. Dashboard student name is populated');
    assert(!!resDash.data.data.modules, '16. Dashboard placeholder modules present');

    // 7. Role Authorization Checks on Student Endpoints
    // Teacher access student profile -> 403
    const resTR = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    assert(resTR.status === 403, '17. Teacher denied on student profile (HTTP 403 Forbidden)');

    // Parent access student profile -> 403
    const resPR = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    assert(resPR.status === 403, '18. Parent denied on student profile (HTTP 403 Forbidden)');

    // Admin access student profile -> 403
    const resAR = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resAR.status === 403, '19. Admin denied on student profile (HTTP 403 Forbidden)');

    // Missing token -> 401
    const resNoToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/profile',
      method: 'GET'
    });
    assert(resNoToken.status === 401, '20. Request with no token denied (HTTP 401 Unauthorized)');

    // Invalid token -> 401
    const resBadToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/profile',
      method: 'GET',
      headers: { Authorization: 'Bearer fake.invalid.jwt' }
    });
    assert(resBadToken.status === 401, '21. Request with invalid token denied (HTTP 401 Unauthorized)');

    console.log(`\n====================================================`);
    console.log(`🎉 Student Module Test Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`====================================================\n`);

  } catch (error) {
    console.error('Fatal Student Module test execution error:', error);
    process.exitCode = 1;
  }
}

runStudentTests();
