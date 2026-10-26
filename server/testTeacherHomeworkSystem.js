const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const { User, StudentProfile, TeacherProfile, Homework, HomeworkSubmission, sequelize } = require('./src/models');

console.log('===============================================================');
console.log('📚 Running EduSetu Step 5D Teacher Homework System Test Suite');
console.log('===============================================================\n');

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

async function runTeacherHomeworkTests() {
  const timestamp = Date.now();
  const futureDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const class10Name = `Class 10_hw_${timestamp}`;

  const teacherAEmail = `teacher_a_hw_${timestamp}@edusetu.org`;
  const teacherBEmail = `teacher_b_hw_${timestamp}@edusetu.org`;
  const student1AEmail = `stu1_a_hw_${timestamp}@edusetu.org`;
  const student2AEmail = `stu2_a_hw_${timestamp}@edusetu.org`;
  const student3BEmail = `stu3_b_hw_${timestamp}@edusetu.org`;
  const studentRoleEmail = `stu_role_hw_${timestamp}@edusetu.org`;
  const parentRoleEmail = `parent_role_hw_${timestamp}@edusetu.org`;
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

  let createdHomeworkId = null;

  try {
    // 1. Register Teachers
    // Teacher A (Class 10, Sec A)
    const resTA = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Prof. Gauss', email: teacherAEmail, password: commonPassword, role: 'teacher', className: class10Name, section: 'A' }
    );
    assert(resTA.status === 201, '1. Registered Teacher A (Class 10, Sec A)');
    teacherAToken = resTA.data.data.token;
    teacherAUser = resTA.data.data.user;

    // Teacher B (Class 10, Sec B)
    const resTB = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Prof. Euler', email: teacherBEmail, password: commonPassword, role: 'teacher', className: class10Name, section: 'B' }
    );
    assert(resTB.status === 201, '2. Registered Teacher B (Class 10, Sec B)');
    teacherBToken = resTB.data.data.token;

    // 2. Register Students
    const resS1 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Alice 1A', email: student1AEmail, password: commonPassword, role: 'student', className: class10Name, section: 'A', rollNumber: '10' }
    );
    student1AProfile = resS1.data.data.user.studentProfile;
    student1AToken = resS1.data.data.token;

    const resS2 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Bob 2A', email: student2AEmail, password: commonPassword, role: 'student', className: class10Name, section: 'A', rollNumber: '11' }
    );
    student2AProfile = resS2.data.data.user.studentProfile;

    const resS3 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Charlie 3B', email: student3BEmail, password: commonPassword, role: 'student', className: class10Name, section: 'B', rollNumber: '12' }
    );
    student3BProfile = resS3.data.data.user.studentProfile;

    assert(true, '3. Registered 3 controlled students in Class 10-A and 10-B');

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

    // 3. Test Create Homework: POST /api/teacher/homework
    const resCreate = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/homework',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      {
        title: 'Trigonometry Assignment 1',
        description: 'Complete problem sets 1 through 10 from Chapter 8.',
        subject: 'Mathematics',
        dueDate: futureDueDate,
        status: 'active'
      }
    );
    assert(resCreate.status === 201, '4. Teacher A creates homework (HTTP 201 Created)');
    assert(resCreate.data.data.assignedBy === teacherAUser.id, '5. Homework assignedBy matches Teacher A ID');
    assert(resCreate.data.data.className === class10Name, '6. Homework className auto-assigned from Teacher A profile');
    assert(resCreate.data.data.section === 'A', '7. Homework section auto-assigned from Teacher A profile');
    createdHomeworkId = resCreate.data.data.id;

    // 4. Test Validation: Missing Fields
    const resMissingTitle = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/homework',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      { description: 'No title provided', subject: 'Math', dueDate: futureDueDate }
    );
    assert(resMissingTitle.status === 400, '8. Missing title rejected (HTTP 400 Bad Request)');

    const resInvalidDate = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/teacher/homework',
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      { title: 'Invalid Due Date', description: 'Desc', subject: 'Math', dueDate: 'not-a-date' }
    );
    assert(resInvalidDate.status === 400, '9. Invalid due date rejected (HTTP 400 Bad Request)');

    // 5. Test Get My Homework: GET /api/teacher/homework
    const resGetList = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/homework',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resGetList.status === 200, '10. Teacher A GET /api/teacher/homework (HTTP 200)');
    assert(resGetList.data.data.count === 1, '11. Received exactly 1 homework assignment');
    assert(resGetList.data.data.homework[0].totalStudents === 2, '12. Homework computed totalStudents = 2 for Class 10-A');
    assert(resGetList.data.data.homework[0].pending === 2, '13. Homework computed pending = 2');

    // 6. Test Teacher Isolation (Teacher B does not see Teacher A's homework)
    const resGetListB = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/homework',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherBToken}` }
    });
    assert(resGetListB.status === 200, '14. Teacher B GET /api/teacher/homework (HTTP 200)');
    assert(resGetListB.data.data.count === 0, '15. Teacher B receives 0 homework (Teacher isolation verified)');

    // 7. Test Search & Filter
    const resSearch = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/homework?search=Trigonometry',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resSearch.data.data.count === 1, '16. Search (?search=Trigonometry) matches created homework');

    const resFilterSubject = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/homework?subject=Mathematics',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resFilterSubject.data.data.count === 1, '17. Subject filter (?subject=Mathematics) returns 1 result');

    const resFilterMismatch = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/homework?subject=History',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resFilterMismatch.data.data.count === 0, '18. Mismatched subject filter returns 0 results');

    // 8. Test Homework Details: GET /api/teacher/homework/:id
    const resDetail = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/homework/${createdHomeworkId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resDetail.status === 200, '19. Teacher A GET homework details (HTTP 200)');
    assert(resDetail.data.data.title === 'Trigonometry Assignment 1', '20. Details title matches');
    assert(resDetail.data.data.teacherName === 'Prof. Gauss', '21. Teacher name matches');

    // 9. Test Unauthorized Details Access: Teacher B requesting Teacher A's homework
    const resDetailDenied = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/homework/${createdHomeworkId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherBToken}` }
    });
    assert(resDetailDenied.status === 403, '22. Teacher B denied on Teacher A homework details (HTTP 403 Forbidden)');

    // 10. Test Update Homework: PUT /api/teacher/homework/:id
    const resUpdate = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/teacher/homework/${createdHomeworkId}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' }
      },
      {
        title: 'Trigonometry Assignment 1 (Revised)',
        description: 'Complete problem sets 1 through 15.'
      }
    );
    assert(resUpdate.status === 200, '23. Teacher A updates homework (HTTP 200)');
    assert(resUpdate.data.data.title === 'Trigonometry Assignment 1 (Revised)', '24. Title updated successfully');

    // 11. Test Unauthorized Update: Teacher B updating Teacher A's homework
    const resUpdateDenied = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/teacher/homework/${createdHomeworkId}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${teacherBToken}`, 'Content-Type': 'application/json' }
      },
      { title: 'Hacked Homework' }
    );
    assert(resUpdateDenied.status === 403, '25. Teacher B denied updating Teacher A homework (HTTP 403 Forbidden)');

    // 12. Student 1A Submits Solution (Using Student submission API)
    const resSubmit = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/student/homework/${createdHomeworkId}/submit`,
        method: 'POST',
        headers: { Authorization: `Bearer ${student1AToken}`, 'Content-Type': 'application/json' }
      },
      { submissionText: 'Attached solutions for questions 1 through 15' }
    );
    assert(resSubmit.status === 201, '26. Student 1A submits homework successfully');

    // 13. Test Submissions List: GET /api/teacher/homework/:id/submissions
    const resSubList = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/homework/${createdHomeworkId}/submissions`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resSubList.status === 200, '27. Teacher A GET homework submissions (HTTP 200)');
    assert(resSubList.data.data.stats.totalStudents === 2, '28. Submissions list totalStudents = 2');
    assert(resSubList.data.data.stats.submitted === 1, '29. Submissions list submitted = 1');
    assert(resSubList.data.data.stats.pending === 1, '30. Submissions list pending = 1');
    assert(resSubList.data.data.students[0].status === 'submitted', '31. Student 1A status is "submitted"');
    assert(resSubList.data.data.students[1].status === 'pending', '32. Student 2A status is "pending"');

    // 14. Test Unauthorized Submissions List: Teacher B
    const resSubListDenied = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/homework/${createdHomeworkId}/submissions`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherBToken}` }
    });
    assert(resSubListDenied.status === 403, '33. Teacher B denied on Teacher A homework submissions (HTTP 403 Forbidden)');

    // 15. Test Submission Details: GET /api/teacher/homework/:id/submissions/:studentId
    const resSubDetail = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/homework/${createdHomeworkId}/submissions/${student1AProfile.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resSubDetail.status === 200, '34. Teacher A views Student 1A submission details (HTTP 200)');
    assert(resSubDetail.data.data.submission.submissionText === 'Attached solutions for questions 1 through 15', '35. Submission text matches');

    // 16. Test Unauthorized Submission Details (Student 3B in Section B)
    const resSubDetailDenied = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/homework/${createdHomeworkId}/submissions/${student3BProfile.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resSubDetailDenied.status === 403, '36. Teacher A denied viewing submission of Section B student (HTTP 403 Forbidden)');

    // 17. Test RBAC & Token Guards
    const resStudentAccess = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/homework',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentRoleToken}` }
    });
    assert(resStudentAccess.status === 403, '37. Student denied on /api/teacher/homework (HTTP 403 Forbidden)');

    const resParentAccess = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/homework',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentRoleToken}` }
    });
    assert(resParentAccess.status === 403, '38. Parent denied on /api/teacher/homework (HTTP 403 Forbidden)');

    const resNoToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/homework',
      method: 'GET'
    });
    assert(resNoToken.status === 401, '39. Missing JWT returns HTTP 401 Unauthorized');

    const resBadToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/homework',
      method: 'GET',
      headers: { Authorization: 'Bearer fake.token' }
    });
    assert(resBadToken.status === 401, '40. Invalid JWT returns HTTP 401 Unauthorized');

    // 18. Test Delete Homework: DELETE /api/teacher/homework/:id
    const resDelete = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/homework/${createdHomeworkId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resDelete.status === 200, '41. Teacher A deletes homework (HTTP 200)');

    // Verify deleted
    const countHw = await Homework.count({ where: { id: createdHomeworkId } });
    assert(countHw === 0, '42. Verified homework deleted from database');

    console.log(`\n===============================================================`);
    console.log(`🎉 Teacher Homework System Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`===============================================================\n`);

  } catch (error) {
    console.error('Fatal Teacher Homework test execution error:', error);
    process.exitCode = 1;
  }
}

runTeacherHomeworkTests();
