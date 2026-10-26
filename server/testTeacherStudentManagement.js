const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const { User, StudentProfile, TeacherProfile, Attendance, Marks, Homework, HomeworkSubmission, sequelize } = require('./src/models');

console.log('================================================================');
console.log('👨‍🏫 Running EduSetu Step 5B Teacher Student Management Test Suite');
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

async function runTeacherStudentTests() {
  const timestamp = Date.now();

  const class10Name = `Class 10_${timestamp}`;
  const class12Name = `Class 12_${timestamp}`;

  const teacherAEmail = `teacher_a_${timestamp}@edusetu.org`;
  const teacherBEmail = `teacher_b_${timestamp}@edusetu.org`;
  const teacherCEmail = `teacher_c_${timestamp}@edusetu.org`;
  const student1AEmail = `rahul_1a_${timestamp}@edusetu.org`;
  const student2AEmail = `ananya_2a_${timestamp}@edusetu.org`;
  const student3BEmail = `rohan_3b_${timestamp}@edusetu.org`;
  const student4CEmail = `vikram_4c_${timestamp}@edusetu.org`;
  const parentEmail = `parent_test_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  let teacherAToken = '';
  let teacherBToken = '';
  let teacherCToken = '';
  let student1AToken = '';
  let parentToken = '';

  let student1AProfile = null;
  let student2AProfile = null;
  let student3BProfile = null;
  let student4CProfile = null;
  let teacherAUser = null;

  try {
    // 1. Register Teachers
    // Teacher A: Class 10, Section A
    const resTA = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Prof. Alan Turing', email: teacherAEmail, password: commonPassword, role: 'teacher', className: class10Name, section: 'A' }
    );
    assert(resTA.status === 201, '1. Registered Teacher A (Class 10, Sec A)');
    teacherAToken = resTA.data.data.token;
    teacherAUser = resTA.data.data.user;

    // Teacher B: Class 10, Section B
    const resTB = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Prof. Ada Lovelace', email: teacherBEmail, password: commonPassword, role: 'teacher', className: class10Name, section: 'B' }
    );
    assert(resTB.status === 201, '2. Registered Teacher B (Class 10, Sec B)');
    teacherBToken = resTB.data.data.token;

    // Teacher C: Class 12, Section A
    const resTC = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Prof. Charles Babbage', email: teacherCEmail, password: commonPassword, role: 'teacher', className: class12Name, section: 'A' }
    );
    assert(resTC.status === 201, '3. Registered Teacher C (Class 12, Sec A)');
    teacherCToken = resTC.data.data.token;

    // 2. Register Students
    // Student 1A: Rahul Sharma (Class 10, Sec A)
    const resS1 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Rahul Sharma', email: student1AEmail, password: commonPassword, role: 'student', className: class10Name, section: 'A', rollNumber: '101' }
    );
    assert(resS1.status === 201, '4. Registered Student 1A (Rahul Sharma in Class 10-A)');
    student1AToken = resS1.data.data.token;
    student1AProfile = resS1.data.data.user.studentProfile;

    // Student 2A: Ananya Sen (Class 10, Sec A)
    const resS2 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Ananya Sen', email: student2AEmail, password: commonPassword, role: 'student', className: class10Name, section: 'A', rollNumber: '102' }
    );
    assert(resS2.status === 201, '5. Registered Student 2A (Ananya Sen in Class 10-A)');
    student2AProfile = resS2.data.data.user.studentProfile;

    // Student 3B: Rohan Gupta (Class 10, Sec B)
    const resS3 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Rohan Gupta', email: student3BEmail, password: commonPassword, role: 'student', className: class10Name, section: 'B', rollNumber: '103' }
    );
    assert(resS3.status === 201, '6. Registered Student 3B (Rohan Gupta in Class 10-B)');
    student3BProfile = resS3.data.data.user.studentProfile;

    // Student 4C: Vikram Rao (Class 12, Sec A)
    const resS4 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Vikram Rao', email: student4CEmail, password: commonPassword, role: 'student', className: class12Name, section: 'A', rollNumber: '104' }
    );
    assert(resS4.status === 201, '7. Registered Student 4C (Vikram Rao in Class 12-A)');
    student4CProfile = resS4.data.data.user.studentProfile;

    // Parent
    const resP = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Parent User', email: parentEmail, password: commonPassword, role: 'parent' }
    );
    parentToken = resP.data.data.token;

    // 3. Seed Controlled Academic Data for Student 1A
    // Attendance: 4 records (3 present, 1 absent = 75%)
    await Attendance.create({ studentProfileId: student1AProfile.id, date: '2026-08-01', status: 'present', subject: 'Mathematics', markedBy: teacherAUser.id });
    await Attendance.create({ studentProfileId: student1AProfile.id, date: '2026-08-02', status: 'present', subject: 'Mathematics', markedBy: teacherAUser.id });
    await Attendance.create({ studentProfileId: student1AProfile.id, date: '2026-08-03', status: 'absent', subject: 'Mathematics', markedBy: teacherAUser.id });
    await Attendance.create({ studentProfileId: student1AProfile.id, date: '2026-08-04', status: 'present', subject: 'Physics', markedBy: teacherAUser.id });

    // Marks: Math (85/100 = 85%, A), Science (45/50 = 90%, A+) -> Total: 130/150 = 86.67% (A)
    await Marks.create({ studentId: student1AProfile.id, subject: 'Mathematics', examType: 'mid_term', examName: 'Mid Term 1', maxMarks: 100, obtainedMarks: 85, markedBy: teacherAUser.id });
    await Marks.create({ studentId: student1AProfile.id, subject: 'Science', examType: 'unit_test', examName: 'Unit Test 1', maxMarks: 50, obtainedMarks: 45, markedBy: teacherAUser.id });

    // Homework: 2 homeworks for Class 10 (1 submitted, 1 pending)
    const hw1 = await Homework.create({
      title: 'Algebra Worksheet',
      description: 'Solve questions 1-10',
      subject: 'Mathematics',
      className: class10Name,
      section: 'A',
      assignedBy: teacherAUser.id,
      assignedDate: '2026-08-01',
      dueDate: '2026-08-10',
      status: 'active'
    });

    const hw2 = await Homework.create({
      title: 'Physics Lab Writeup',
      description: 'Write concave mirror experiment',
      subject: 'Physics',
      className: class10Name,
      section: 'A',
      assignedBy: teacherAUser.id,
      assignedDate: '2026-08-05',
      dueDate: '2026-08-15',
      status: 'active'
    });

    await HomeworkSubmission.create({
      homeworkId: hw1.id,
      studentId: student1AProfile.id,
      submissionText: 'Completed worksheet solutions',
      submittedAt: new Date(),
      status: 'submitted'
    });

    assert(true, '8. Seeded controlled academic data for Student 1A');

    // 4. Test Teacher A Listing Students: GET /api/teacher/students
    const resListA = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/students',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resListA.status === 200, '9. Teacher A GET /api/teacher/students (HTTP 200)');
    assert(resListA.data.data.count === 2, `10. Teacher A receives exactly 2 students in Class 10-A (got ${resListA.data.data.count})`);
    assert(resListA.data.data.students[0].password === undefined, '11. Passwords NOT returned in students list');

    // 5. Test Teacher B Listing Students: Section B only
    const resListB = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/students',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherBToken}` }
    });
    assert(resListB.status === 200, '12. Teacher B GET /api/teacher/students (HTTP 200)');
    assert(resListB.data.data.count === 1 && resListB.data.data.students[0].name === 'Rohan Gupta', '13. Teacher B receives only Section B student');

    // 6. Test Teacher C Listing Students: Class 12 only
    const resListC = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/students',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherCToken}` }
    });
    assert(resListC.status === 200, '14. Teacher C GET /api/teacher/students (HTTP 200)');
    assert(resListC.data.data.count === 1 && resListC.data.data.students[0].name === 'Vikram Rao', '15. Teacher C receives only Class 12 student');

    // 7. Test Student Search by Name
    const resSearchName = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/students?search=Rahul',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resSearchName.status === 200, '16. Search by name (?search=Rahul) succeeds (HTTP 200)');
    assert(resSearchName.data.data.count === 1 && resSearchName.data.data.students[0].name === 'Rahul Sharma', '17. Matches Rahul Sharma');

    // 8. Test Student Search by Email
    const resSearchEmail = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/students?search=ananya',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resSearchEmail.status === 200, '18. Search by email (?search=ananya) succeeds (HTTP 200)');
    assert(resSearchEmail.data.data.count === 1 && resSearchEmail.data.data.students[0].name === 'Ananya Sen', '19. Matches Ananya Sen');

    // 9. Test Search Boundary Security (Teacher A searching for Rohan who is in Section B)
    const resSearchCross = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/students?search=Rohan',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resSearchCross.data.data.count === 0, '20. Teacher A searching for Section B student returns 0 results (Security verified)');

    // 10. Test Student Details API: GET /api/teacher/students/:studentId
    const resDetailA = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/students/${student1AProfile.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resDetailA.status === 200, '21. Teacher A views Student 1A details (HTTP 200)');
    assert(resDetailA.data.data.name === 'Rahul Sharma', '22. Student details name matches');
    assert(resDetailA.data.data.rollNumber === '101', '23. Student rollNumber matches');

    // 11. Test Details Authorization Security (Teacher A attempting Student 3B in Section B)
    const resDeniedSec = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/students/${student3BProfile.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resDeniedSec.status === 403, '24. Teacher A denied on Section B student (HTTP 403 Forbidden)');

    // 12. Test Details Authorization Security (Teacher A attempting Student 4C in Class 12)
    const resDeniedClass = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/students/${student4CProfile.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resDeniedClass.status === 403, '25. Teacher A denied on Class 12 student (HTTP 403 Forbidden)');

    // 13. Test Student Attendance Summary API: GET /api/teacher/students/:studentId/attendance
    const resAttSumm = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/students/${student1AProfile.id}/attendance`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resAttSumm.status === 200, '26. Teacher A views Student 1A attendance summary (HTTP 200)');
    assert(resAttSumm.data.data.totalClasses === 4, '27. totalClasses = 4');
    assert(resAttSumm.data.data.present === 3, '28. present = 3');
    assert(resAttSumm.data.data.percentage === 75, '29. Attendance percentage = 75%');

    // 14. Test Student Marks Summary API: GET /api/teacher/students/:studentId/marks
    const resMarksSumm = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/students/${student1AProfile.id}/marks`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resMarksSumm.status === 200, '30. Teacher A views Student 1A marks summary (HTTP 200)');
    assert(resMarksSumm.data.data.totalExams === 2, '31. totalExams = 2');
    assert(resMarksSumm.data.data.totalMaxMarks === 150, '32. totalMaxMarks = 150');
    assert(resMarksSumm.data.data.totalObtainedMarks === 130, '33. totalObtainedMarks = 130');
    assert(resMarksSumm.data.data.overallPercentage === 86.67, '34. overallPercentage = 86.67%');
    assert(resMarksSumm.data.data.overallGrade === 'A', '35. overallGrade = A');

    // 15. Test Student Homework Summary API: GET /api/teacher/students/:studentId/homework
    const resHwSumm = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/students/${student1AProfile.id}/homework`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resHwSumm.status === 200, '36. Teacher A views Student 1A homework summary (HTTP 200)');
    assert(resHwSumm.data.data.totalAssignments === 2, '37. totalAssignments = 2');
    assert(resHwSumm.data.data.submitted === 1, '38. submitted = 1');
    assert(resHwSumm.data.data.pending === 1, '39. pending = 1');

    // 16. Test Summary Security (Teacher A attempting summaries on unauthorized Student 3B)
    const resDeniedAtt = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/students/${student3BProfile.id}/attendance`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resDeniedAtt.status === 403, '40. Teacher A denied on unauthorized student attendance summary (HTTP 403)');

    const resDeniedMarks = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/students/${student3BProfile.id}/marks`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resDeniedMarks.status === 403, '41. Teacher A denied on unauthorized student marks summary (HTTP 403)');

    const resDeniedHw = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/students/${student3BProfile.id}/homework`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resDeniedHw.status === 403, '42. Teacher A denied on unauthorized student homework summary (HTTP 403)');

    // 17. Test RBAC & Authentication Guards
    const resStudentAccess = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/students',
      method: 'GET',
      headers: { Authorization: `Bearer ${student1AToken}` }
    });
    assert(resStudentAccess.status === 403, '43. Student denied on /api/teacher/students (HTTP 403 Forbidden)');

    const resParentAccess = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/students',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    assert(resParentAccess.status === 403, '44. Parent denied on /api/teacher/students (HTTP 403 Forbidden)');

    const resNoToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/students',
      method: 'GET'
    });
    assert(resNoToken.status === 401, '45. Missing JWT returns HTTP 401 Unauthorized');

    const resBadToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/students',
      method: 'GET',
      headers: { Authorization: 'Bearer fake.invalid.token' }
    });
    assert(resBadToken.status === 401, '46. Invalid JWT returns HTTP 401 Unauthorized');

    console.log(`\n================================================================`);
    console.log(`🎉 Teacher Student Management Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`================================================================\n`);

  } catch (error) {
    console.error('Fatal Teacher Student Management test execution error:', error);
    process.exitCode = 1;
  }
}

runTeacherStudentTests();
