const http = require('http');

console.log('====================================================');
console.log('🧪 Running EduSetu Step 3 End-to-End API Test Suite');
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

async function runE2ETests() {
  const timestamp = Date.now();
  const studentEmail = `student_${timestamp}@edusetu.org`;
  const teacherEmail = `teacher_${timestamp}@edusetu.org`;
  const parentEmail = `parent_${timestamp}@edusetu.org`;
  const adminEmail = `admin_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  let studentToken = '';
  let teacherToken = '';
  let adminToken = '';

  try {
    // 1. Register a Student
    const res1 = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Aarav Student',
        email: studentEmail,
        password: commonPassword,
        role: 'student',
        phone: '9876543210'
      }
    );
    assert(res1.status === 201 && res1.data.success === true, '1. Register a Student (HTTP 201)');
    assert(res1.data.data.user.role === 'student', 'Student role is correctly assigned');
    assert(res1.data.data.user.password === undefined, 'Password is NOT exposed in registration response');
    studentToken = res1.data.data.token;

    // 2. Register a Teacher
    const res2 = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Priya Teacher',
        email: teacherEmail,
        password: commonPassword,
        role: 'teacher',
        phone: '9876543211'
      }
    );
    assert(res2.status === 201 && res2.data.success === true, '2. Register a Teacher (HTTP 201)');
    assert(res2.data.data.user.role === 'teacher', 'Teacher role is correctly assigned');
    teacherToken = res2.data.data.token;

    // 3. Register a Parent
    const res3 = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Ramesh Parent',
        email: parentEmail,
        password: commonPassword,
        role: 'parent',
        phone: '9876543212'
      }
    );
    assert(res3.status === 201 && res3.data.success === true, '3. Register a Parent (HTTP 201)');
    assert(res3.data.data.user.role === 'parent', 'Parent role is correctly assigned');

    // 4. Register an Admin
    const res4 = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Super Admin',
        email: adminEmail,
        password: commonPassword,
        role: 'admin',
        phone: '9876543213'
      }
    );
    assert(res4.status === 201 && res4.data.success === true, '4. Register an Admin (HTTP 201)');
    assert(res4.data.data.user.role === 'admin', 'Admin role is correctly assigned');
    adminToken = res4.data.data.token;

    // 5. Attempt registration with duplicate email
    const res5 = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Duplicate Student',
        email: studentEmail,
        password: commonPassword,
        role: 'student'
      }
    );
    assert(res5.status === 409 && res5.data.success === false, '5. Reject duplicate email registration (HTTP 409)');

    // 6. Attempt registration with invalid email
    const res6 = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Invalid Email User',
        email: 'invalid-email-format',
        password: commonPassword,
        role: 'student'
      }
    );
    assert(res6.status === 400 && res6.data.success === false, '6. Reject invalid email format (HTTP 400)');

    // 7. Attempt registration with password shorter than 8 chars
    const res7 = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Short Pass User',
        email: `shortpass_${timestamp}@edusetu.org`,
        password: 'short',
        role: 'student'
      }
    );
    assert(res7.status === 400 && res7.data.success === false, '7. Reject password < 8 characters (HTTP 400)');

    // 8. Attempt registration with invalid role
    const res8 = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Invalid Role User',
        email: `invalidrole_${timestamp}@edusetu.org`,
        password: commonPassword,
        role: 'superadmin'
      }
    );
    assert(res8.status === 400 && res8.data.success === false, '8. Reject invalid role (HTTP 400)');

    // 9. Login with correct credentials
    const res9 = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        email: studentEmail,
        password: commonPassword
      }
    );
    assert(res9.status === 200 && res9.data.success === true, '9. Login with correct credentials (HTTP 200)');
    assert(!!res9.data.data.token, 'Login returns signed JWT token');
    assert(res9.data.data.user.password === undefined, 'Password is NOT exposed in login response');

    // 10. Login with incorrect password
    const res10 = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        email: studentEmail,
        password: 'WrongPassword123'
      }
    );
    assert(res10.status === 401 && res10.data.success === false, '10. Reject incorrect password (HTTP 401)');
    assert(res10.data.message === 'Invalid email or password', 'Generic error message prevents user enumeration');

    // 11. Login with non-existent email
    const res11 = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        email: 'nonexistent_user@edusetu.org',
        password: commonPassword
      }
    );
    assert(res11.status === 401 && res11.data.success === false, '11. Reject non-existent email (HTTP 401)');
    assert(res11.data.message === 'Invalid email or password', 'Generic error message for non-existent user');

    // 12. Access /api/auth/me without JWT
    const res12 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET'
    });
    assert(res12.status === 401 && res12.data.success === false, '12. Access /api/auth/me without JWT rejected (HTTP 401)');

    // 13. Access /api/auth/me with valid JWT
    const res13 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(res13.status === 200 && res13.data.success === true, '13. Access /api/auth/me with valid JWT (HTTP 200)');
    assert(res13.data.data.email === studentEmail, 'Profile data matches authenticated user');
    assert(res13.data.data.password === undefined, 'Password is NOT exposed in /me response');

    // 14. Access /api/auth/me with invalid JWT
    const res14 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: 'Bearer invalid.token.payload' }
    });
    assert(res14.status === 401 && res14.data.success === false, '14. Access /api/auth/me with invalid JWT rejected (HTTP 401)');

    // 15. Role Authorization Middleware: Admin Access Admin Route
    const res15 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/test-role/admin',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res15.status === 200 && res15.data.success === true, '15. Admin authorized on admin route (HTTP 200)');

    // 16. Role Authorization Middleware: Student Access Admin Route
    const res16 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/test-role/admin',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(res16.status === 403 && res16.data.success === false, '16. Student denied on admin route (HTTP 403 Forbidden)');

    // 17. Role Authorization Middleware: Teacher Access Teacher Route
    const res17 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/test-role/teacher',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    assert(res17.status === 200 && res17.data.success === true, '17. Teacher authorized on teacher route (HTTP 200)');

    // 18. Role Authorization Middleware: Student Access Teacher Route
    const res18 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/test-role/teacher',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(res18.status === 403 && res18.data.success === false, '18. Student denied on teacher route (HTTP 403 Forbidden)');

    console.log(`\n====================================================`);
    console.log(`🎉 End-to-End API Test Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`====================================================\n`);

  } catch (error) {
    console.error('Fatal E2E test execution error:', error);
    process.exitCode = 1;
  }
}

runE2ETests();
