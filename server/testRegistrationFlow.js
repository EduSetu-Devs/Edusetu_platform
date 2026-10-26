const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');

console.log('================================================================');
console.log('🛡️ Running EduSetu Enhanced Registration Flow Test Suite');
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

async function runRegistrationFlowTests() {
  const timestamp = Date.now();
  const studentEmail = `reg_student_${timestamp}@edusetu.org`;
  const teacherEmail = `reg_teacher_${timestamp}@edusetu.org`;
  const parentEmail = `reg_parent_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  try {
    // 1. Student Registration Flow
    const resStudent = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Kavita Student', email: studentEmail, password: commonPassword, role: 'student', phone: '9876543210' }
    );
    assert(resStudent.status === 201, '1. Student registration returns HTTP 201 Created');
    assert(resStudent.data.data.user.role === 'student', '2. User role is assigned as student');
    assert(resStudent.data.data.user.studentProfile !== undefined, '3. StudentProfile auto-generated with unique studentId');
    assert(resStudent.data.data.user.password === undefined, '4. Password hash excluded from response');

    // 2. Teacher Registration Flow
    const resTeacher = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Prof. Rajesh Sharma', email: teacherEmail, password: commonPassword, role: 'teacher', phone: '9876543211' }
    );
    assert(resTeacher.status === 201, '5. Teacher registration returns HTTP 201 Created');
    assert(resTeacher.data.data.user.role === 'teacher', '6. User role is assigned as teacher');
    assert(resTeacher.data.data.user.teacherProfile !== undefined, '7. TeacherProfile auto-generated with unique teacherId');

    // 3. Parent Registration Flow
    const resParent = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Mrs. Sunita Sharma', email: parentEmail, password: commonPassword, role: 'parent', phone: '9876543212' }
    );
    assert(resParent.status === 201, '8. Parent registration returns HTTP 201 Created');
    assert(resParent.data.data.user.role === 'parent', '9. User role is assigned as parent');
    assert(resParent.data.data.user.parentProfile !== undefined, '10. ParentProfile auto-generated with unique parentId');

    // 4. Role Validation: Reject Invalid Role
    const resInvalidRole = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Invalid User', email: `invalid_${timestamp}@edusetu.org`, password: commonPassword, role: 'superadmin' }
    );
    assert(resInvalidRole.status === 400, '11. Invalid role rejected (HTTP 400 Bad Request)');
    assert(resInvalidRole.data.message.includes('Invalid role'), '12. Descriptive error message for invalid role');

    // 5. Validation: Missing / Short Name
    const resShortName = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'A', email: `shortname_${timestamp}@edusetu.org`, password: commonPassword, role: 'student' }
    );
    assert(resShortName.status === 400, '13. Short name rejected (HTTP 400 Bad Request)');

    // 6. Validation: Invalid Email Format
    const resBadEmail = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Valid Name', email: 'not-an-email', password: commonPassword, role: 'student' }
    );
    assert(resBadEmail.status === 400, '14. Malformed email address rejected (HTTP 400 Bad Request)');

    // 7. Validation: Short Password (<8 chars)
    const resShortPass = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Valid Name', email: `shortpass_${timestamp}@edusetu.org`, password: '12345', role: 'student' }
    );
    assert(resShortPass.status === 400, '15. Short password (< 8 chars) rejected (HTTP 400 Bad Request)');

    // 8. Duplicate Email Conflict
    const resDuplicate = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Duplicate User', email: studentEmail, password: commonPassword, role: 'student' }
    );
    assert(resDuplicate.status === 409, '16. Duplicate email address returns HTTP 409 Conflict');

    // 9. Login with Newly Registered User
    const resLogin = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: studentEmail, password: commonPassword }
    );
    assert(resLogin.status === 200, '17. Login with newly registered user succeeds (HTTP 200 OK)');
    assert(typeof resLogin.data.data.token === 'string', '18. JWT authentication token returned on login');
    assert(resLogin.data.data.user.role === 'student', '19. Logged-in user role is student');

    console.log(`\n================================================================`);
    console.log(`🎉 Registration Flow Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`================================================================\n`);

  } catch (error) {
    console.error('Fatal Registration test error:', error);
    process.exitCode = 1;
  }
}

runRegistrationFlowTests();
