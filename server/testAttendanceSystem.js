const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const { User, StudentProfile, Attendance, sequelize } = require('./src/models');

console.log('=======================================================');
console.log('📋 Running EduSetu Step 4B Attendance System Test Suite');
console.log('=======================================================\n');

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

async function runAttendanceTests() {
  const timestamp = Date.now();
  const studentAEmail = `student_att_a_${timestamp}@edusetu.org`;
  const studentBEmail = `student_att_b_${timestamp}@edusetu.org`;
  const teacherEmail = `teacher_att_${timestamp}@edusetu.org`;
  const parentEmail = `parent_att_${timestamp}@edusetu.org`;
  const adminEmail = `admin_att_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  let studentAToken = '';
  let studentBToken = '';
  let teacherToken = '';
  let parentToken = '';
  let adminToken = '';

  try {
    // 1. Verify Model Associations
    assert(typeof StudentProfile.associations.attendances !== 'undefined', '1. StudentProfile hasMany Attendances defined');
    assert(typeof Attendance.associations.studentProfile !== 'undefined', '2. Attendance belongsTo StudentProfile defined');
    assert(typeof Attendance.associations.marker !== 'undefined', '3. Attendance belongsTo User (marker) defined');

    // 2. Register Student A and Student B
    const resA = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Student A', email: studentAEmail, password: commonPassword, role: 'student', className: 'Class 10', section: 'A' }
    );
    assert(resA.status === 201, '4. Student A registered successfully');
    studentAToken = resA.data.data.token;
    const studentAProfileId = resA.data.data.user.studentProfile.id;

    const resB = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Student B', email: studentBEmail, password: commonPassword, role: 'student', className: 'Class 10', section: 'B' }
    );
    assert(resB.status === 201, '5. Student B registered successfully');
    studentBToken = resB.data.data.token;

    // Register Teacher, Parent, Admin
    const resT = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Teacher Att', email: teacherEmail, password: commonPassword, role: 'teacher' }
    );
    teacherToken = resT.data.data.token;

    const resP = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Parent Att', email: parentEmail, password: commonPassword, role: 'parent' }
    );
    parentToken = resP.data.data.token;

    const resAdm = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Admin Att', email: adminEmail, password: commonPassword, role: 'admin' }
    );
    adminToken = resAdm.data.data.token;

    // 3. Test Zero Attendance on fresh student
    const resZero = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/attendance/summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    assert(resZero.status === 200, '6. Student B GET /api/student/attendance/summary (HTTP 200)');
    assert(resZero.data.data.totalClasses === 0 && resZero.data.data.attendancePercentage === 0, '7. Zero classes returns attendancePercentage: 0');

    // 4. Seed Controlled Test Attendance Records for Student A (Controlled Test Script)
    const testRecords = [
      { studentProfileId: studentAProfileId, date: '2026-08-20', status: 'present', subject: 'Mathematics', remarks: 'Good participation' },
      { studentProfileId: studentAProfileId, date: '2026-08-20', status: 'present', subject: 'Physics', remarks: '' },
      { studentProfileId: studentAProfileId, date: '2026-08-21', status: 'absent', subject: 'Chemistry', remarks: 'Uninformed absence' },
      { studentProfileId: studentAProfileId, date: '2026-08-22', status: 'late', subject: 'Mathematics', remarks: 'Arrived 10 mins late' },
      { studentProfileId: studentAProfileId, date: '2026-08-23', status: 'leave', subject: 'English', remarks: 'Medical leave' },
      { studentProfileId: studentAProfileId, date: '2026-08-24', status: 'present', subject: 'Computer Science', remarks: 'Lab completed' }
    ];

    for (const record of testRecords) {
      await Attendance.create(record);
    }
    assert(true, '8. Seeded 6 controlled test attendance records for Student A');

    // 5. Verify Unique Constraint (Duplicate studentProfileId + date + subject)
    let duplicateCaught = false;
    try {
      await Attendance.create({
        studentProfileId: studentAProfileId,
        date: '2026-08-20',
        status: 'present',
        subject: 'Mathematics' // duplicate of record 1
      });
    } catch (e) {
      duplicateCaught = true;
    }
    assert(duplicateCaught, '9. Unique constraint prevents duplicate attendance on same date and subject');

    // 6. Test GET /api/student/attendance (All records sorted DESC by date)
    const resAtt = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/attendance',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resAtt.status === 200 && resAtt.data.success === true, '10. Student A GET /api/student/attendance (HTTP 200)');
    assert(resAtt.data.data.length === 6, '11. Retrieved all 6 attendance records');
    assert(resAtt.data.data[0].date >= resAtt.data.data[1].date, '12. Records are sorted by date descending');

    // 7. Test Subject Filter: GET /api/student/attendance?subject=Mathematics
    const resSub = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/attendance?subject=Mathematics',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resSub.status === 200, '13. Subject filter query succeeds (HTTP 200)');
    assert(resSub.data.data.length === 2, '14. Filtered exactly 2 Mathematics records');

    // 8. Test Date Range Filter: GET /api/student/attendance?startDate=2026-08-20&endDate=2026-08-22
    const resDate = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/attendance?startDate=2026-08-20&endDate=2026-08-22',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resDate.status === 200, '15. Date range filter query succeeds (HTTP 200)');
    assert(resDate.data.data.length === 4, '16. Filtered exactly 4 records within date range');

    // 9. Test Attendance Summary: GET /api/student/attendance/summary
    const resSum = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/attendance/summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resSum.status === 200 && resSum.data.success === true, '17. Student A GET /api/student/attendance/summary (HTTP 200)');
    assert(resSum.data.data.totalClasses === 6, '18. totalClasses = 6');
    assert(resSum.data.data.present === 3, '19. present = 3');
    assert(resSum.data.data.absent === 1, '20. absent = 1');
    assert(resSum.data.data.late === 1, '21. late = 1');
    assert(resSum.data.data.leave === 1, '22. leave = 1');
    assert(resSum.data.data.attendancePercentage === 50, '23. attendancePercentage calculated correctly (3/6 * 100 = 50%)');

    // 10. Test Date Validation (Invalid format & startDate > endDate)
    const resBadDate = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/attendance?startDate=2026-08-25&endDate=2026-08-20',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resBadDate.status === 400, '24. startDate after endDate rejected (HTTP 400 Bad Request)');

    const resInvalidDateStr = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/attendance?startDate=not-a-date',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resInvalidDateStr.status === 400, '25. Malformed date string rejected (HTTP 400 Bad Request)');

    // 11. Test User Isolation (Student B gets only Student B's records)
    const resAttB = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/attendance',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    assert(resAttB.data.data.length === 0, '26. Student B cannot see Student A records (User isolation verified)');

    // 12. Test Role Authorization (Teacher/Parent/Admin denied student attendance)
    const resTR = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/attendance',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    assert(resTR.status === 403, '27. Teacher denied on student attendance (HTTP 403 Forbidden)');

    const resPR = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/attendance',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    assert(resPR.status === 403, '28. Parent denied on student attendance (HTTP 403 Forbidden)');

    const resAR = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/attendance',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resAR.status === 403, '29. Admin denied on student attendance (HTTP 403 Forbidden)');

    // 13. Test Authentication (Missing / Invalid Token)
    const resNoToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/attendance',
      method: 'GET'
    });
    assert(resNoToken.status === 401, '30. Missing token returns HTTP 401 Unauthorized');

    const resBadToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/attendance',
      method: 'GET',
      headers: { Authorization: 'Bearer fake.invalid.jwt' }
    });
    assert(resBadToken.status === 401, '31. Invalid token returns HTTP 401 Unauthorized');

    console.log(`\n=======================================================`);
    console.log(`🎉 Attendance System Test Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`=======================================================\n`);

  } catch (error) {
    console.error('Fatal Attendance System test execution error:', error);
    process.exitCode = 1;
  }
}

runAttendanceTests();
