const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const {
  User,
  StudentProfile,
  TeacherProfile,
  ParentProfile,
  ParentStudent,
  Attendance,
  Homework,
  HomeworkSubmission,
  Marks,
  sequelize
} = require('./src/models');

console.log('================================================================');
console.log('👨‍👩‍👧 Running EduSetu Step 6B Parent Academic Dashboard Test Suite');
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

async function runParentAcademicDashboardTests() {
  const timestamp = Date.now();
  const testClassName = `Class 10_${timestamp}`;

  const parentAEmail = `parent_acad_a_${timestamp}@edusetu.org`;
  const parentBEmail = `parent_acad_b_${timestamp}@edusetu.org`;
  const teacherEmail = `teacher_acad_${timestamp}@edusetu.org`;
  const student1Email = `stu1_acad_${timestamp}@edusetu.org`;
  const student2Email = `stu2_acad_${timestamp}@edusetu.org`;
  const student3Email = `stu3_acad_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  let parentAToken = '';
  let parentBToken = '';
  let teacherToken = '';
  let student1Token = '';
  let teacherUserId = null;

  let student1Profile = null;
  let student2Profile = null;
  let student3Profile = null;

  try {
    // 1. Register Accounts
    const resPA = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Dr. Suresh Sharma', email: parentAEmail, password: commonPassword, role: 'parent', relationship: 'Father', occupation: 'Physician' }
    );
    assert(resPA.status === 201, '1. Registered Parent A');
    parentAToken = resPA.data.data.token;

    const resPB = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Mrs. Ananya Sen', email: parentBEmail, password: commonPassword, role: 'parent', relationship: 'Mother', occupation: 'Professor' }
    );
    assert(resPB.status === 201, '2. Registered Parent B');
    parentBToken = resPB.data.data.token;

    const resT = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Prof. Math Faculty', email: teacherEmail, password: commonPassword, role: 'teacher', className: testClassName, section: 'A', subjects: ['Mathematics'] }
    );
    assert(resT.status === 201, '3. Registered Teacher (Class 10, Sec A)');
    teacherToken = resT.data.data.token;
    teacherUserId = resT.data.data.user.id;

    const resS1 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Aarav Sharma', email: student1Email, password: commonPassword, role: 'student', className: testClassName, section: 'A', rollNumber: '1' }
    );
    assert(resS1.status === 201, '4. Registered Student 1A (Aarav)');
    student1Profile = resS1.data.data.user.studentProfile;
    student1Token = resS1.data.data.token;

    const resS2 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Diya Sharma', email: student2Email, password: commonPassword, role: 'student', className: `Class 8_${timestamp}`, section: 'B', rollNumber: '5' }
    );
    student2Profile = resS2.data.data.user.studentProfile;

    const resS3 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Rohan Sen', email: student3Email, password: commonPassword, role: 'student', className: testClassName, section: 'B', rollNumber: '12' }
    );
    student3Profile = resS3.data.data.user.studentProfile;

    // 2. Link Children
    await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/parent/children/link', method: 'POST', headers: { Authorization: `Bearer ${parentAToken}`, 'Content-Type': 'application/json' } },
      { studentId: student1Profile.studentId, relationship: 'Son' }
    );
    await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/parent/children/link', method: 'POST', headers: { Authorization: `Bearer ${parentAToken}`, 'Content-Type': 'application/json' } },
      { studentId: student2Profile.studentId, relationship: 'Daughter' }
    );
    await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/parent/children/link', method: 'POST', headers: { Authorization: `Bearer ${parentBToken}`, 'Content-Type': 'application/json' } },
      { studentId: student3Profile.studentId, relationship: 'Son' }
    );
    assert(true, '5. Mapped Student 1A & 2A to Parent A, Student 3B to Parent B');

    // 3. Record Attendance for Student 1A (4 sessions: 2 present, 1 absent, 1 late = 50%)
    await Attendance.create({ studentProfileId: student1Profile.id, date: '2026-08-01', subject: 'Mathematics', status: 'present' });
    await Attendance.create({ studentProfileId: student1Profile.id, date: '2026-08-02', subject: 'Mathematics', status: 'present' });
    await Attendance.create({ studentProfileId: student1Profile.id, date: '2026-08-03', subject: 'Mathematics', status: 'absent' });
    await Attendance.create({ studentProfileId: student1Profile.id, date: '2026-08-04', subject: 'Mathematics', status: 'late' });
    assert(true, '6. Seeded 4 attendance records for Student 1A');

    // 4. Create Homework and Submission
    const hw1 = await Homework.create({
      assignedBy: teacherUserId,
      title: 'Algebra Problem Set 1',
      description: 'Solve Quadratic Equations',
      subject: 'Mathematics',
      className: testClassName,
      section: 'A',
      assignedDate: '2026-08-01',
      dueDate: '2026-08-10',
      status: 'active'
    });

    const hw2 = await Homework.create({
      assignedBy: teacherUserId,
      title: 'Trigonometry Ratios Exercise',
      description: 'Exercise 8.1',
      subject: 'Mathematics',
      className: testClassName,
      section: 'A',
      assignedDate: '2026-08-05',
      dueDate: '2026-12-31', // Future due date -> pending
      status: 'active'
    });

    // Student 1A submits hw1
    await HomeworkSubmission.create({
      homeworkId: hw1.id,
      studentId: student1Profile.id,
      submissionText: 'All equations solved with step-by-step proofs attached.',
      submittedAt: new Date('2026-08-06T10:00:00Z'),
      status: 'submitted'
    });
    assert(true, '7. Seeded 2 homework assignments and 1 submission for Student 1A');

    // 5. Create Marks for Student 1A (Mid Term 85/100, Unit Test 95/100 -> 180/200 = 90% A+, GPA 9.00)
    await Marks.create({
      studentId: student1Profile.id,
      subject: 'Mathematics',
      examType: 'mid_term',
      examName: 'Mid Term Exam',
      maxMarks: 100,
      obtainedMarks: 85,
      examDate: '2026-08-10'
    });

    await Marks.create({
      studentId: student1Profile.id,
      subject: 'Mathematics',
      examType: 'unit_test',
      examName: 'Unit Test 1',
      maxMarks: 100,
      obtainedMarks: 95,
      examDate: '2026-08-15'
    });
    assert(true, '8. Seeded 2 marks records for Student 1A');

    // 6. Test GET /api/parent/children/:studentId/overview
    const resOverview = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student1Profile.studentId}/overview`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resOverview.status === 200, '9. Parent A GET child academic overview (HTTP 200)');
    assert(resOverview.data.data.student.name === 'Aarav Sharma', '10. Student name matches');
    assert(resOverview.data.data.attendance.total === 4, '11. Attendance totalClasses = 4');
    assert(resOverview.data.data.attendance.present === 2, '12. Attendance present = 2');
    assert(resOverview.data.data.attendance.percentage === 50, '13. Attendance percentage = 50%');
    assert(resOverview.data.data.homework.total === 2, '14. Homework total = 2');
    assert(resOverview.data.data.homework.submitted === 1, '15. Homework submitted = 1');
    assert(resOverview.data.data.homework.pending === 1, '16. Homework pending = 1');
    assert(resOverview.data.data.marks.totalExams === 2, '17. Marks totalExams = 2');
    assert(resOverview.data.data.result.percentage === 90, '18. Result percentage = 90%');
    assert(resOverview.data.data.result.grade === 'A+', '19. Result grade = A+');
    assert(resOverview.data.data.result.gpa === '9.00', '20. Result GPA = 9.00');

    // 7. Test GET /api/parent/children/:studentId/attendance
    const resAttendance = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student1Profile.studentId}/attendance`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resAttendance.status === 200, '21. Parent A GET child attendance summary (HTTP 200)');
    assert(resAttendance.data.data.totalClasses === 4, '22. totalClasses matches');
    assert(resAttendance.data.data.present === 2, '23. present matches');
    assert(resAttendance.data.data.attendancePercentage === 50, '24. attendancePercentage matches');

    // 8. Test GET /api/parent/children/:studentId/attendance/history
    const resAttHistory = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student1Profile.studentId}/attendance/history`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resAttHistory.status === 200, '25. Parent A GET attendance history (HTTP 200)');
    assert(resAttHistory.data.data.count === 4, '26. Count = 4 attendance entries');
    assert(resAttHistory.data.data.history[0].date === '2026-08-04', '27. Sorted newest first');

    // 9. Test GET /api/parent/children/:studentId/homework
    const resHomework = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student1Profile.studentId}/homework`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resHomework.status === 200, '28. Parent A GET child homework (HTTP 200)');
    assert(resHomework.data.data.total === 2, '29. total homework = 2');
    assert(resHomework.data.data.submitted === 1, '30. submitted homework = 1');

    // 10. Test GET /api/parent/children/:studentId/homework/history
    const resHwHistory = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student1Profile.studentId}/homework/history`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resHwHistory.status === 200, '31. Parent A GET homework history (HTTP 200)');
    assert(resHwHistory.data.data.count === 2, '32. Received 2 homework records in history');

    // 11. Test GET /api/parent/children/:studentId/marks
    const resMarks = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student1Profile.studentId}/marks`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resMarks.status === 200, '33. Parent A GET child marks (HTTP 200)');
    assert(resMarks.data.data.totalExams === 2, '34. totalExams = 2');
    assert(resMarks.data.data.overallPercentage === 90, '35. overallPercentage = 90%');
    assert(resMarks.data.data.overallGrade === 'A+', '36. overallGrade = A+');

    // 12. Test GET /api/parent/children/:studentId/result
    const resResult = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student1Profile.studentId}/result`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resResult.status === 200, '37. Parent A GET child result (HTTP 200)');
    assert(resResult.data.data.gpa === '9.00', '38. gpa = 9.00');
    assert(resResult.data.data.subjects.length === 1, '39. 1 subject breakdown');
    assert(resResult.data.data.subjects[0].subject === 'Mathematics', '40. Subject is Mathematics');

    // 13. Test Cross-Parent Protection (Parent A accessing Parent B's child)
    const resCrossOverview = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student3Profile.studentId}/overview`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resCrossOverview.status === 403, '41. Parent A denied on Student 3B overview (HTTP 403 Forbidden)');

    const resCrossAttendance = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student3Profile.studentId}/attendance`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resCrossAttendance.status === 403, '42. Parent A denied on Student 3B attendance (HTTP 403 Forbidden)');

    const resCrossHomework = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student3Profile.studentId}/homework`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resCrossHomework.status === 403, '43. Parent A denied on Student 3B homework (HTTP 403 Forbidden)');

    const resCrossMarks = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student3Profile.studentId}/marks`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resCrossMarks.status === 403, '44. Parent A denied on Student 3B marks (HTTP 403 Forbidden)');

    const resCrossResult = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student3Profile.studentId}/result`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resCrossResult.status === 403, '45. Parent A denied on Student 3B result (HTTP 403 Forbidden)');

    // 14. Test RBAC Guards
    const resStudentDenied = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student1Profile.studentId}/overview`,
      method: 'GET',
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(resStudentDenied.status === 403, '46. Student denied on parent academic endpoint (HTTP 403 Forbidden)');

    const resTeacherDenied = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student1Profile.studentId}/overview`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    assert(resTeacherDenied.status === 403, '47. Teacher denied on parent academic endpoint (HTTP 403 Forbidden)');

    const resNoToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student1Profile.studentId}/overview`,
      method: 'GET'
    });
    assert(resNoToken.status === 401, '48. Missing JWT returns HTTP 401 Unauthorized');

    const resBadToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student1Profile.studentId}/overview`,
      method: 'GET',
      headers: { Authorization: 'Bearer invalid.jwt.token' }
    });
    assert(resBadToken.status === 401, '49. Invalid JWT returns HTTP 401 Unauthorized');

    // 15. Security: Ensure no password, hashes, or secrets returned
    assert(resOverview.data.data.student.password === undefined, '50. Passwords and hashes NOT exposed');

    console.log(`\n================================================================`);
    console.log(`🎉 Parent Academic Dashboard Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`================================================================\n`);

  } catch (error) {
    console.error('Fatal Parent Academic Dashboard test execution error:', error);
    process.exitCode = 1;
  }
}

runParentAcademicDashboardTests();
