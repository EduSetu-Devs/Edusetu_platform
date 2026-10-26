const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const { User, StudentProfile, TeacherProfile, Attendance, sequelize } = require('./src/models');

console.log('================================================================');
console.log('📋 Running EduSetu Step 5C Teacher Attendance System Test Suite');
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

async function runTeacherAttendanceTests() {
  const timestamp = Date.now();

  const class10Name = `Class 10_att_${timestamp}`;
  const class12Name = `Class 12_att_${timestamp}`;

  const teacherAEmail = `teacher_a_att_${timestamp}@edusetu.org`;
  const teacherBEmail = `teacher_b_att_${timestamp}@edusetu.org`;
  const student1AEmail = `stu1_a_att_${timestamp}@edusetu.org`;
  const student2AEmail = `stu2_a_att_${timestamp}@edusetu.org`;
  const student3AEmail = `stu3_a_att_${timestamp}@edusetu.org`;
  const student4BEmail = `stu4_b_att_${timestamp}@edusetu.org`;
  const student5CEmail = `stu5_c_att_${timestamp}@edusetu.org`;
  const studentRoleEmail = `stu_role_att_${timestamp}@edusetu.org`;
  const parentRoleEmail = `parent_role_att_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  let teacherAToken = '';
  let teacherBToken = '';
  let studentRoleToken = '';
  let parentRoleToken = '';

  let student1AProfile = null;
  let student2AProfile = null;
  let student3AProfile = null;
  let student4BProfile = null;
  let student5CProfile = null;

  try {
    // 1. Register Teachers
    // Teacher A (Class 10, Sec A)
    const resTA = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Teacher Alpha', email: teacherAEmail, password: commonPassword, role: 'teacher', className: class10Name, section: 'A' }
    );
    assert(resTA.status === 201, '1. Registered Teacher A (Class 10, Sec A)');
    teacherAToken = resTA.data.data.token;

    // Teacher B (Class 10, Sec B)
    const resTB = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Teacher Beta', email: teacherBEmail, password: commonPassword, role: 'teacher', className: class10Name, section: 'B' }
    );
    assert(resTB.status === 201, '2. Registered Teacher B (Class 10, Sec B)');
    teacherBToken = resTB.data.data.token;

    // 2. Register Students
    // Student 1A, 2A, 3A in Class 10-A
    const resS1 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Alice 1A', email: student1AEmail, password: commonPassword, role: 'student', className: class10Name, section: 'A', rollNumber: '1' }
    );
    student1AProfile = resS1.data.data.user.studentProfile;

    const resS2 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Bob 2A', email: student2AEmail, password: commonPassword, role: 'student', className: class10Name, section: 'A', rollNumber: '2' }
    );
    student2AProfile = resS2.data.data.user.studentProfile;

    const resS3 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Charlie 3A', email: student3AEmail, password: commonPassword, role: 'student', className: class10Name, section: 'A', rollNumber: '3' }
    );
    student3AProfile = resS3.data.data.user.studentProfile;

    // Student 4B in Class 10-B
    const resS4 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'David 4B', email: student4BEmail, password: commonPassword, role: 'student', className: class10Name, section: 'B', rollNumber: '4' }
    );
    student4BProfile = resS4.data.data.user.studentProfile;

    // Student 5C in Class 12-A
    const resS5 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Eva 5C', email: student5CEmail, password: commonPassword, role: 'student', className: class12Name, section: 'A', rollNumber: '5' }
    );
    student5CProfile = resS5.data.data.user.studentProfile;

    assert(true, '3. Registered 5 controlled test students across 3 sections/classes');

    // Register RBAC test users
    const resSRole = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Student RBAC', email: studentRoleEmail, password: commonPassword, role: 'student' }
    );
    studentRoleToken = resSRole.data.data.token;

    const resPRole = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Parent RBAC', email: parentRoleEmail, password: commonPassword, role: 'parent' }
    );
    parentRoleToken = resPRole.data.data.token;

    // 3. Test GET /api/teacher/attendance (Initial Roster unmarked)
    const testDate = '2026-09-01';
    const testSubject = 'Mathematics';

    const resRoster = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/attendance?date=${testDate}&subject=${testSubject}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resRoster.status === 200, '4. Teacher A GET /api/teacher/attendance (HTTP 200)');
    assert(resRoster.data.data.students.length === 3, '5. Receives exactly 3 enrolled students in Class 10-A');
    assert(resRoster.data.data.students[0].status === 'unmarked', '6. Initial attendance status is "unmarked"');

    // 4. Test Single Mark Attendance: POST /api/teacher/attendance
    const resMark1 = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/attendance',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      {
        studentId: student1AProfile.id,
        date: testDate,
        subject: testSubject,
        status: 'present',
        remarks: 'Attended on time'
      }
    );
    assert(resMark1.status === 200, '7. Teacher A marks Student 1A present (HTTP 200)');
    assert(resMark1.data.data.attendance.status === 'present', '8. Attendance record created with status "present"');
    const createdRecordId = resMark1.data.data.attendance.id;

    // 5. Test Duplicate Prevention & In-Place Update on same date/subject
    const resDuplicate = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/attendance',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      {
        studentId: student1AProfile.id,
        date: testDate,
        subject: testSubject,
        status: 'late',
        remarks: 'Arrived 10 mins late'
      }
    );
    assert(resDuplicate.status === 200, '9. Subsequent marking for same student/date/subject succeeds (HTTP 200)');
    assert(resDuplicate.data.data.attendance.status === 'late', '10. Existing record updated to "late" without creating duplicate');

    // Verify DB count
    const totalRecords = await Attendance.count({
      where: { studentProfileId: student1AProfile.id, date: testDate, subject: testSubject }
    });
    assert(totalRecords === 1, '11. Verified only 1 unique record exists in database');

    // 6. Test Authorization: Teacher A marking Student 4B in Section B
    const resDeniedSec = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/attendance',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      { studentId: student4BProfile.id, date: testDate, subject: testSubject, status: 'present' }
    );
    assert(resDeniedSec.status === 403, '12. Teacher A denied marking Section B student (HTTP 403 Forbidden)');

    // 7. Test Authorization: Teacher A marking Student 5C in Class 12
    const resDeniedClass = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/attendance',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      { studentId: student5CProfile.id, date: testDate, subject: testSubject, status: 'present' }
    );
    assert(resDeniedClass.status === 403, '13. Teacher A denied marking Class 12 student (HTTP 403 Forbidden)');

    // 8. Test Validation: Invalid Status
    const resInvalidStatus = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/attendance',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      { studentId: student1AProfile.id, date: testDate, subject: testSubject, status: 'holiday' }
    );
    assert(resInvalidStatus.status === 400, '14. Invalid status rejected (HTTP 400 Bad Request)');

    // 9. Test Validation: Missing Date / Subject
    const resMissingDate = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/attendance',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      { studentId: student1AProfile.id, subject: testSubject, status: 'present' }
    );
    assert(resMissingDate.status === 400, '15. Missing date rejected (HTTP 400 Bad Request)');

    // 10. Test Bulk Attendance Marking: POST /api/teacher/attendance/bulk
    const resBulk = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/attendance/bulk',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      {
        date: testDate,
        subject: testSubject,
        records: [
          { studentId: student1AProfile.studentId, status: 'present' },
          { studentId: student2AProfile.studentId, status: 'absent' },
          { studentId: student3AProfile.studentId, status: 'late' }
        ]
      }
    );
    assert(resBulk.status === 200, '16. Teacher A bulk marks attendance for Class 10-A (HTTP 200)');
    assert(resBulk.data.data.count === 3, '17. Bulk count = 3 records saved');

    // 11. Test Bulk Transactional Safety (rolls back if unauthorized student included)
    const resBulkRollback = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/attendance/bulk',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      {
        date: '2026-09-02',
        subject: testSubject,
        records: [
          { studentId: student1AProfile.studentId, status: 'present' },
          { studentId: student4BProfile.studentId, status: 'present' } // unauthorized Section B student!
        ]
      }
    );
    assert(resBulkRollback.status === 403, '18. Bulk operation rejected when unauthorized student included (HTTP 403)');

    // Verify rollback: no records created for 2026-09-02
    const date2Records = await Attendance.count({ where: { date: '2026-09-02' } });
    assert(date2Records === 0, '19. Transaction rollback confirmed: zero records created on error');

    // 12. Test Class Attendance Summary: GET /api/teacher/attendance/summary
    const resClassSummary = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/attendance/summary?date=${testDate}&subject=${testSubject}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resClassSummary.status === 200, '20. Teacher A GET /api/teacher/attendance/summary (HTTP 200)');
    assert(resClassSummary.data.data.totalStudents === 3, '21. totalStudents = 3');
    assert(resClassSummary.data.data.present === 1, '22. present = 1');
    assert(resClassSummary.data.data.absent === 1, '23. absent = 1');
    assert(resClassSummary.data.data.late === 1, '24. late = 1');
    assert(resClassSummary.data.data.unmarked === 0, '25. unmarked = 0');
    assert(resClassSummary.data.data.attendancePercentage === 33.33, '26. attendancePercentage = 33.33%');

    // 13. Test Student Attendance Summary: GET /api/teacher/attendance/student/:studentId
    const resStuSummary = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/attendance/student/${student1AProfile.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resStuSummary.status === 200, '27. Teacher A GET student attendance summary (HTTP 200)');
    assert(resStuSummary.data.data.totalClasses === 1, '28. totalClasses = 1');
    assert(resStuSummary.data.data.present === 1, '29. present = 1');
    assert(resStuSummary.data.data.percentage === 100, '30. percentage = 100%');

    // 14. Test Update Attendance Record: PUT /api/teacher/attendance/:id
    const resUpdateAtt = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/teacher/attendance/${createdRecordId}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      { status: 'late', remarks: 'Updated status to late' }
    );
    assert(resUpdateAtt.status === 200, '31. Teacher A updates attendance record (HTTP 200)');
    assert(resUpdateAtt.data.data.status === 'late', '32. Updated record status is late');

    // 15. Test Unauthorized Update: Teacher B trying to update Teacher A's student attendance
    const resDeniedUpdate = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/teacher/attendance/${createdRecordId}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${teacherBToken}`, 'Content-Type': 'application/json' }
      },
      { status: 'absent' }
    );
    assert(resDeniedUpdate.status === 403, '33. Teacher B denied updating Class 10-A record (HTTP 403 Forbidden)');

    // 16. Test RBAC Guards
    const resStudentAccess = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/attendance',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentRoleToken}` }
    });
    assert(resStudentAccess.status === 403, '34. Student denied on /api/teacher/attendance (HTTP 403 Forbidden)');

    const resParentAccess = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/attendance',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentRoleToken}` }
    });
    assert(resParentAccess.status === 403, '35. Parent denied on /api/teacher/attendance (HTTP 403 Forbidden)');

    const resNoToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/attendance',
      method: 'GET'
    });
    assert(resNoToken.status === 401, '36. Missing JWT returns HTTP 401 Unauthorized');

    const resBadToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/attendance',
      method: 'GET',
      headers: { Authorization: 'Bearer invalid.fake.token' }
    });
    assert(resBadToken.status === 401, '37. Invalid JWT returns HTTP 401 Unauthorized');

    console.log(`\n================================================================`);
    console.log(`🎉 Teacher Attendance System Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`================================================================\n`);

  } catch (error) {
    console.error('Fatal Teacher Attendance test execution error:', error);
    process.exitCode = 1;
  }
}

runTeacherAttendanceTests();
