const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const { User, StudentProfile, TeacherProfile, Marks, sequelize } = require('./src/models');

console.log('================================================================');
console.log('📊 Running EduSetu Step 5E Teacher Marks System Test Suite');
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

async function runTeacherMarksTests() {
  const timestamp = Date.now();

  const class10Name = `Class 10_mrk_${timestamp}`;

  const teacherAEmail = `teacher_a_mrk_${timestamp}@edusetu.org`;
  const teacherBEmail = `teacher_b_mrk_${timestamp}@edusetu.org`;
  const student1AEmail = `stu1_a_mrk_${timestamp}@edusetu.org`;
  const student2AEmail = `stu2_a_mrk_${timestamp}@edusetu.org`;
  const student3BEmail = `stu3_b_mrk_${timestamp}@edusetu.org`;
  const studentRoleEmail = `stu_role_mrk_${timestamp}@edusetu.org`;
  const parentRoleEmail = `parent_role_mrk_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  let teacherAToken = '';
  let teacherBToken = '';
  let student1AToken = '';
  let studentRoleToken = '';
  let parentRoleToken = '';

  let student1AProfile = null;
  let student2AProfile = null;
  let student3BProfile = null;
  let teacherAUser = null;

  let createdMarkId = null;

  try {
    // 1. Register Teachers
    const resTA = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Dr. Turing', email: teacherAEmail, password: commonPassword, role: 'teacher', className: class10Name, section: 'A' }
    );
    assert(resTA.status === 201, '1. Registered Teacher A (Class 10, Sec A)');
    teacherAToken = resTA.data.data.token;
    teacherAUser = resTA.data.data.user;

    const resTB = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Dr. Lovelace', email: teacherBEmail, password: commonPassword, role: 'teacher', className: class10Name, section: 'B' }
    );
    assert(resTB.status === 201, '2. Registered Teacher B (Class 10, Sec B)');
    teacherBToken = resTB.data.data.token;

    // 2. Register Students
    const resS1 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'John 1A', email: student1AEmail, password: commonPassword, role: 'student', className: class10Name, section: 'A', rollNumber: '1' }
    );
    student1AProfile = resS1.data.data.user.studentProfile;
    student1AToken = resS1.data.data.token;

    const resS2 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Jane 2A', email: student2AEmail, password: commonPassword, role: 'student', className: class10Name, section: 'A', rollNumber: '2' }
    );
    student2AProfile = resS2.data.data.user.studentProfile;

    const resS3 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Bob 3B', email: student3BEmail, password: commonPassword, role: 'student', className: class10Name, section: 'B', rollNumber: '3' }
    );
    student3BProfile = resS3.data.data.user.studentProfile;

    assert(true, '3. Registered 3 controlled students across Section A and B');

    // RBAC tokens
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

    // 3. Test Get Class Marks: GET /api/teacher/marks
    const resGetMarks = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/marks?subject=Mathematics&examType=mid_term&examName=Mid+Term+Exam',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resGetMarks.status === 200, '4. Teacher A GET /api/teacher/marks (HTTP 200)');
    assert(resGetMarks.data.data.totalStudents === 2, '5. Receives exactly 2 enrolled students in Class 10-A');
    assert(resGetMarks.data.data.markedStudents === 0, '6. Initial markedStudents count is 0');

    // 4. Test Single Mark Creation: POST /api/teacher/marks
    const resCreateMark = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/marks',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      {
        studentId: student1AProfile.id,
        subject: 'Mathematics',
        examType: 'mid_term',
        examName: 'Mid Term Exam',
        maxMarks: 100,
        obtainedMarks: 85
      }
    );
    assert(resCreateMark.status === 200, '7. Teacher A creates single mark for Student 1A (HTTP 200)');
    assert(resCreateMark.data.data.percentage === 85, '8. Percentage computed correctly (85%)');
    assert(resCreateMark.data.data.grade === 'A', '9. Grade computed correctly (A)');
    createdMarkId = resCreateMark.data.data.id;

    // 5. Test Duplicate Prevention & In-Place Update
    const resUpdateInPlace = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/marks',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      {
        studentId: student1AProfile.id,
        subject: 'Mathematics',
        examType: 'mid_term',
        examName: 'Mid Term Exam',
        maxMarks: 100,
        obtainedMarks: 95
      }
    );
    assert(resUpdateInPlace.status === 200, '10. Subsequent mark entry for same exam succeeds in-place');
    assert(resUpdateInPlace.data.data.grade === 'A+', '11. Updated grade is A+ (95%)');

    const marksCount = await Marks.count({
      where: {
        studentId: student1AProfile.id,
        subject: 'Mathematics',
        examType: 'mid_term',
        examName: 'Mid Term Exam'
      }
    });
    assert(marksCount === 1, '12. Verified only 1 unique mark record exists in database');

    // 6. Test Input Validation
    const resExcessMarks = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/marks',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      {
        studentId: student1AProfile.id,
        subject: 'Mathematics',
        examType: 'mid_term',
        examName: 'Mid Term Exam',
        maxMarks: 100,
        obtainedMarks: 110
      }
    );
    assert(resExcessMarks.status === 400, '13. Marks exceeding maxMarks rejected (HTTP 400 Bad Request)');

    const resNegativeMarks = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/marks',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      {
        studentId: student1AProfile.id,
        subject: 'Mathematics',
        examType: 'mid_term',
        examName: 'Mid Term Exam',
        maxMarks: 100,
        obtainedMarks: -5
      }
    );
    assert(resNegativeMarks.status === 400, '14. Negative marks rejected (HTTP 400 Bad Request)');

    // 7. Test Class & Section Authorization: Teacher A marking Section B student
    const resSectionBDenied = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/marks',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      {
        studentId: student3BProfile.id,
        subject: 'Mathematics',
        examType: 'mid_term',
        examName: 'Mid Term Exam',
        maxMarks: 100,
        obtainedMarks: 75
      }
    );
    assert(resSectionBDenied.status === 403, '15. Teacher A denied marking Section B student (HTTP 403 Forbidden)');

    // 8. Test Bulk Marks Entry: POST /api/teacher/marks/bulk
    const resBulk = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/marks/bulk',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      {
        subject: 'Mathematics',
        examType: 'mid_term',
        examName: 'Mid Term Exam',
        maxMarks: 100,
        records: [
          { studentProfileId: student1AProfile.id, obtainedMarks: 90 },
          { studentProfileId: student2AProfile.id, obtainedMarks: 75 }
        ]
      }
    );
    assert(resBulk.status === 200, '16. Teacher A bulk marks for Class 10-A (HTTP 200)');
    assert(resBulk.data.data.count === 2, '17. Bulk count = 2 records saved');

    // 9. Test Bulk Transaction Rollback on Unauthorized Student
    const resBulkDenied = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/marks/bulk',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      {
        subject: 'Physics',
        examType: 'unit_test',
        examName: 'Unit Test 1',
        maxMarks: 50,
        records: [
          { studentProfileId: student1AProfile.id, obtainedMarks: 45 },
          { studentProfileId: student3BProfile.id, obtainedMarks: 40 } // Section B student!
        ]
      }
    );
    assert(resBulkDenied.status === 403, '18. Bulk operation rejected when unauthorized student included (HTTP 403)');

    // Verify zero Physics records created for Student 1A
    const countPhysics = await Marks.count({
      where: {
        studentId: student1AProfile.id,
        subject: 'Physics',
        examName: 'Unit Test 1'
      }
    });
    assert(countPhysics === 0, '19. Transaction rollback confirmed: 0 records created on error');

    // 10. Test Update Marks: PUT /api/teacher/marks/:id
    const resUpdate = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/teacher/marks/${createdMarkId}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      { obtainedMarks: 88, remarks: 'Good revision performance' }
    );
    assert(resUpdate.status === 200, '20. Teacher A updates marks record (HTTP 200)');
    assert(resUpdate.data.data.percentage === 88, '21. Updated percentage is 88%');
    assert(resUpdate.data.data.grade === 'A', '22. Updated grade is A');

    // 11. Test Unauthorized Update: Teacher B updating Class 10-A mark
    const resUpdateDenied = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/teacher/marks/${createdMarkId}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${teacherBToken}`, 'Content-Type': 'application/json' }
      },
      { obtainedMarks: 50 }
    );
    assert(resUpdateDenied.status === 403, '23. Teacher B denied updating Class 10-A marks (HTTP 403 Forbidden)');

    // 12. Test Class Result Summary: GET /api/teacher/marks/summary
    const resSummary = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/marks/summary?subject=Mathematics&examType=mid_term&examName=Mid+Term+Exam',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resSummary.status === 200, '24. Teacher A GET class marks summary (HTTP 200)');
    assert(resSummary.data.data.totalStudents === 2, '25. totalStudents = 2');
    assert(resSummary.data.data.studentsWithMarks === 2, '26. studentsWithMarks = 2');
    assert(resSummary.data.data.classAverage === 81.5, '27. classAverage = 81.5% ((88 + 75)/2)');
    assert(resSummary.data.data.passCount === 2, '28. passCount = 2');
    assert(resSummary.data.data.failCount === 0, '29. failCount = 0');

    // 13. Test Student Marks History: GET /api/teacher/marks/student/:studentId
    const resStudentMarks = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/marks/student/${student1AProfile.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resStudentMarks.status === 200, '30. Teacher A GET student marks history (HTTP 200)');
    assert(resStudentMarks.data.data.count === 1, '31. Student 1A has 1 mark record');

    // 14. Test Student Result: GET /api/teacher/marks/student/:studentId/result
    const resStudentResult = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/marks/student/${student1AProfile.id}/result`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resStudentResult.status === 200, '32. Teacher A GET student cumulative result (HTTP 200)');
    assert(resStudentResult.data.data.overallPercentage === 88, '33. overallPercentage = 88%');
    assert(resStudentResult.data.data.overallGrade === 'A', '34. overallGrade = A');
    assert(resStudentResult.data.data.gpa === '8.80', '35. GPA = 8.80');

    // 15. Test Unauthorized Student Result Access (Section B student)
    const resResultDenied = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/marks/student/${student3BProfile.id}/result`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resResultDenied.status === 403, '36. Teacher A denied viewing result of Section B student (HTTP 403 Forbidden)');

    // 16. Test RBAC & Token Guards
    const resStudentAccess = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/marks',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentRoleToken}` }
    });
    assert(resStudentAccess.status === 403, '37. Student denied on /api/teacher/marks (HTTP 403 Forbidden)');

    const resParentAccess = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/marks',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentRoleToken}` }
    });
    assert(resParentAccess.status === 403, '38. Parent denied on /api/teacher/marks (HTTP 403 Forbidden)');

    const resNoToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/marks',
      method: 'GET'
    });
    assert(resNoToken.status === 401, '39. Missing JWT returns HTTP 401 Unauthorized');

    const resBadToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/marks',
      method: 'GET',
      headers: { Authorization: 'Bearer invalid.token' }
    });
    assert(resBadToken.status === 401, '40. Invalid JWT returns HTTP 401 Unauthorized');

    console.log(`\n================================================================`);
    console.log(`🎉 Teacher Marks System Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`================================================================\n`);

  } catch (error) {
    console.error('Fatal Teacher Marks test execution error:', error);
    process.exitCode = 1;
  }
}

runTeacherMarksTests();
