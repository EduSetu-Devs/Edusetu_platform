const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const { User, TeacherProfile, sequelize } = require('./src/models');

console.log('====================================================');
console.log('👩‍🏫 Running EduSetu Step 5A Teacher Module Test Suite');
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

async function runTeacherTests() {
  const timestamp = Date.now();
  const teacherAEmail = `teacher_a_${timestamp}@edusetu.org`;
  const teacherBEmail = `teacher_b_${timestamp}@edusetu.org`;
  const studentEmail = `student_for_tch_${timestamp}@edusetu.org`;
  const parentEmail = `parent_for_tch_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  let teacherAToken = '';
  let teacherBToken = '';
  let studentToken = '';
  let parentToken = '';

  let teacherAId = null;

  try {
    // 1. Model Association Checks
    assert(typeof User.associations.teacherProfile !== 'undefined', '1. User hasOne TeacherProfile defined');
    assert(typeof TeacherProfile.associations.user !== 'undefined', '2. TeacherProfile belongsTo User defined');

    // 2. Register Teacher A with initial details
    const resA = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      {
        name: 'Prof. John Smith',
        email: teacherAEmail,
        password: commonPassword,
        role: 'teacher',
        department: 'Computer Science',
        designation: 'Assistant Professor',
        subjects: ['Data Structures', 'Database Systems'],
        className: 'Class 10',
        section: 'A',
        qualification: 'M.Tech CSE',
        experience: '5 Years'
      }
    );
    assert(resA.status === 201, '3. Teacher A registered successfully (HTTP 201 Created)');
    assert(resA.data.data.user.teacherProfile !== undefined, '4. TeacherProfile auto-generated on teacher registration');
    assert(resA.data.data.user.teacherProfile.teacherId.startsWith('TCH'), '5. Unique teacherId generated (starts with TCH)');
    teacherAToken = resA.data.data.token;
    teacherAId = resA.data.data.user.id;

    // 3. Register Teacher B
    const resB = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Dr. Sarah Connor', email: teacherBEmail, password: commonPassword, role: 'teacher' }
    );
    assert(resB.status === 201, '6. Teacher B registered successfully (HTTP 201 Created)');
    teacherBToken = resB.data.data.token;

    // 4. Register Student and Parent for RBAC verification
    const resS = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Student RBAC', email: studentEmail, password: commonPassword, role: 'student' }
    );
    studentToken = resS.data.data.token;

    const resP = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Parent RBAC', email: parentEmail, password: commonPassword, role: 'parent' }
    );
    parentToken = resP.data.data.token;

    // 5. Test Teacher A GET /api/teacher/profile
    const resGetProf = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resGetProf.status === 200, '7. Teacher A GET /api/teacher/profile (HTTP 200)');
    assert(resGetProf.data.data.name === 'Prof. John Smith', '8. Profile name matches');
    assert(resGetProf.data.data.department === 'Computer Science', '9. Profile department matches');
    assert(resGetProf.data.data.role === 'teacher', '10. Profile role is teacher');
    assert(resGetProf.data.data.password === undefined, '11. Password is NOT exposed in teacher profile');

    // 6. Test Teacher A PUT /api/teacher/profile
    const resUpdate = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/profile',
        method: 'PUT',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      {
        name: 'Dr. John Smith',
        department: 'AI & Data Science',
        designation: 'Associate Professor',
        subjects: ['Machine Learning', 'Computer Vision'],
        className: 'Class 12',
        section: 'B',
        qualification: 'Ph.D. in Computer Science',
        experience: '8 Years',
        phone: '+91 98765 43210',
        // attempt to illegally modify role or teacherId
        role: 'admin',
        teacherId: 'HACKED_ID'
      }
    );
    assert(resUpdate.status === 200, '12. Teacher A PUT /api/teacher/profile (HTTP 200)');
    assert(resUpdate.data.data.name === 'Dr. John Smith', '13. Updated name persisted');
    assert(resUpdate.data.data.department === 'AI & Data Science', '14. Updated department persisted');
    assert(resUpdate.data.data.designation === 'Associate Professor', '15. Updated designation persisted');
    assert(resUpdate.data.data.role === 'teacher', '16. Role cannot be changed via update (remains teacher)');
    assert(resUpdate.data.data.teacherId.startsWith('TCH'), '17. teacherId cannot be overwritten via update');

    // 7. Test Teacher A GET /api/teacher/dashboard
    const resDash = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resDash.status === 200, '18. Teacher A GET /api/teacher/dashboard (HTTP 200)');
    assert(resDash.data.data.teacher.name === 'Dr. John Smith', '19. Dashboard returns updated teacher name');
    assert(resDash.data.data.teacher.department === 'AI & Data Science', '20. Dashboard returns department');
    assert(Array.isArray(resDash.data.data.teacher.subjects), '21. Dashboard returns subjects array');

    // 8. Test Role Authorization (Students and Parents denied teacher endpoints)
    const resStudentAccessProfile = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(resStudentAccessProfile.status === 403, '22. Student denied access to /api/teacher/profile (HTTP 403 Forbidden)');

    const resParentAccessProfile = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    assert(resParentAccessProfile.status === 403, '23. Parent denied access to /api/teacher/profile (HTTP 403 Forbidden)');

    const resStudentAccessDashboard = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(resStudentAccessDashboard.status === 403, '24. Student denied access to /api/teacher/dashboard (HTTP 403 Forbidden)');

    const resParentAccessDashboard = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    assert(resParentAccessDashboard.status === 403, '25. Parent denied access to /api/teacher/dashboard (HTTP 403 Forbidden)');

    // 9. Test Authentication Token Guards
    const resNoToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/dashboard',
      method: 'GET'
    });
    assert(resNoToken.status === 401, '26. Missing JWT token returns HTTP 401 Unauthorized');

    const resBadToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/dashboard',
      method: 'GET',
      headers: { Authorization: 'Bearer fake.invalid.jwt' }
    });
    assert(resBadToken.status === 401, '27. Invalid JWT token returns HTTP 401 Unauthorized');

    // 10. Test Teacher Isolation (Teacher B does not see Teacher A's specific custom edits)
    const resProfB = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherBToken}` }
    });
    assert(resProfB.status === 200, '28. Teacher B GET /api/teacher/profile (HTTP 200)');
    assert(resProfB.data.data.name === 'Dr. Sarah Connor', '29. Teacher B profile maintains independent identity');

    console.log(`\n====================================================`);
    console.log(`🎉 Teacher Module Test Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`====================================================\n`);

  } catch (error) {
    console.error('Fatal Teacher Module test execution error:', error);
    process.exitCode = 1;
  }
}

runTeacherTests();
