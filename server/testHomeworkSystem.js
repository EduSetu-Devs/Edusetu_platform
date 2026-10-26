const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const { User, StudentProfile, Homework, HomeworkSubmission, sequelize } = require('./src/models');

console.log('====================================================');
console.log('📚 Running EduSetu Step 4C Homework System Test Suite');
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

async function runHomeworkTests() {
  const timestamp = Date.now();
  const class10Name = `Class 10_${timestamp}`;
  const class12Name = `Class 12_${timestamp}`;

  const studentAEmail = `student_hw_a_${timestamp}@edusetu.org`;
  const studentBEmail = `student_hw_b_${timestamp}@edusetu.org`;
  const teacherEmail = `teacher_hw_${timestamp}@edusetu.org`;
  const parentEmail = `parent_hw_${timestamp}@edusetu.org`;
  const adminEmail = `admin_hw_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  let studentAToken = '';
  let studentBToken = '';
  let teacherToken = '';
  let parentToken = '';
  let adminToken = '';

  let teacherUser = null;
  let hw1Id = null;
  let hw2Id = null;
  let hw3Id = null;
  let hw4Id = null;
  let hw5Id = null;
  let hw6Id = null;

  try {
    // 1. Model Associations Verification
    assert(typeof User.associations.assignedHomeworks !== 'undefined', '1. User hasMany Homework defined');
    assert(typeof Homework.associations.teacher !== 'undefined', '2. Homework belongsTo User defined');
    assert(typeof Homework.associations.submissions !== 'undefined', '3. Homework hasMany HomeworkSubmission defined');
    assert(typeof HomeworkSubmission.associations.homework !== 'undefined', '4. HomeworkSubmission belongsTo Homework defined');
    assert(typeof StudentProfile.associations.homeworkSubmissions !== 'undefined', '5. StudentProfile hasMany HomeworkSubmission defined');
    assert(typeof HomeworkSubmission.associations.studentProfile !== 'undefined', '6. HomeworkSubmission belongsTo StudentProfile defined');

    // 2. Register Accounts
    const resA = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Student HW A', email: studentAEmail, password: commonPassword, role: 'student', className: class10Name, section: 'A' }
    );
    assert(resA.status === 201, '7. Registered Student A in Class 10');
    studentAToken = resA.data.data.token;

    const resB = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Student HW B', email: studentBEmail, password: commonPassword, role: 'student', className: class12Name, section: 'B' }
    );
    assert(resB.status === 201, '8. Registered Student B in Class 12');
    studentBToken = resB.data.data.token;

    const resT = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Teacher HW', email: teacherEmail, password: commonPassword, role: 'teacher' }
    );
    teacherToken = resT.data.data.token;
    teacherUser = resT.data.data.user;

    const resP = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Parent HW', email: parentEmail, password: commonPassword, role: 'parent' }
    );
    parentToken = resP.data.data.token;

    const resAdm = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Admin HW', email: adminEmail, password: commonPassword, role: 'admin' }
    );
    adminToken = resAdm.data.data.token;

    // 3. Seed Controlled Test Homework Assignments
    const today = new Date().toISOString().slice(0, 10);
    const futureDate1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const futureDate2 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const hw1 = await Homework.create({
      title: 'Trigonometry Problem Set',
      description: 'Complete exercises 1 to 20 on page 142.',
      subject: 'Mathematics',
      className: class10Name,
      section: 'A',
      assignedBy: teacherUser.id,
      assignedDate: today,
      dueDate: futureDate1,
      status: 'active'
    });
    hw1Id = hw1.id;

    const hw2 = await Homework.create({
      title: 'Optics Ray Diagram Report',
      description: 'Draw concave and convex mirror diagrams.',
      subject: 'Physics',
      className: class10Name,
      section: 'A',
      assignedBy: teacherUser.id,
      assignedDate: today,
      dueDate: futureDate2,
      status: 'active'
    });
    hw2Id = hw2.id;

    const hw3 = await Homework.create({
      title: 'Organic Chemistry Reactions',
      description: 'Balance hydrocarbon combustion reactions.',
      subject: 'Chemistry',
      className: class10Name,
      section: 'A',
      assignedBy: teacherUser.id,
      assignedDate: pastDate,
      dueDate: pastDate, // past due date
      status: 'active'
    });
    hw3Id = hw3.id;

    const hw4 = await Homework.create({
      title: 'Closed History Essay',
      description: 'Ancient Indus Valley Civilisation essay.',
      subject: 'History',
      className: class10Name,
      section: 'A',
      assignedBy: teacherUser.id,
      assignedDate: pastDate,
      dueDate: pastDate,
      status: 'closed'
    });
    hw4Id = hw4.id;

    const hw5 = await Homework.create({
      title: 'Data Structures Binary Tree',
      description: 'Implement AVL Tree balancing in Java.',
      subject: 'Computer Science',
      className: class12Name,
      section: 'B',
      assignedBy: teacherUser.id,
      assignedDate: today,
      dueDate: futureDate1,
      status: 'active'
    });
    hw5Id = hw5.id;

    const hw6 = await Homework.create({
      title: 'Draft Unreleased Assignment',
      description: 'Teacher draft not ready.',
      subject: 'Physics',
      className: class10Name,
      section: 'A',
      assignedBy: teacherUser.id,
      assignedDate: today,
      dueDate: futureDate1,
      status: 'draft'
    });
    hw6Id = hw6.id;

    assert(true, '9. Seeded controlled test homework assignments');

    // 4. Test Student A Listing Homework (Class 10)
    const resListA = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/homework',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resListA.status === 200, '10. Student A GET /api/student/homework (HTTP 200)');
    assert(resListA.data.data.length === 4, `11. Student A receives exactly 4 Class 10 assignments (got ${resListA.data.data.length})`);
    assert(resListA.data.data[0].submissionStatus === 'pending', '12. Default submission status is pending');

    // 5. Test Student B Listing Homework (Class 12)
    const resListB = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/homework',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    assert(resListB.status === 200, '13. Student B GET /api/student/homework (HTTP 200)');
    assert(resListB.data.data.length === 1 && resListB.data.data[0].title === 'Data Structures Binary Tree', '14. Student B receives only Class 12 homework');

    // 6. Test Subject Filter: GET /api/student/homework?subject=Mathematics
    const resSub = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/homework?subject=Mathematics',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resSub.status === 200, '15. Subject filter query succeeds (HTTP 200)');
    assert(resSub.data.data.length === 1 && resSub.data.data[0].subject === 'Mathematics', '16. Filtered exactly 1 Mathematics assignment');

    // 7. Test Status Filter: GET /api/student/homework?status=active
    const resStat = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/homework?status=active',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resStat.data.data.length === 3, `17. Status=active filter excludes closed homework (got ${resStat.data.data.length})`);

    // 8. Test Search Filter: GET /api/student/homework?search=Optics
    const resSearch = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/homework?search=Optics',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resSearch.data.data.length === 1 && resSearch.data.data[0].title === 'Optics Ray Diagram Report', '18. Title search query matches Optics');

    // 9. Test Date Validation
    const resBadDate = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/homework?startDate=2026-09-10&endDate=2026-09-01',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resBadDate.status === 400, '19. Invalid date range (startDate > endDate) returns HTTP 400');

    // 10. Test Get Homework Details: GET /api/student/homework/:id
    const resDetail = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/student/homework/${hw1Id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resDetail.status === 200, '20. Student A GET /api/student/homework/:id (HTTP 200)');
    assert(resDetail.data.data.title === 'Trigonometry Problem Set', '21. Homework detail returns full title');
    assert(resDetail.data.data.submissionStatus === 'pending', '22. Submission status is pending before submit');

    // 11. Test Class Security on Detail View: Student A attempts Class 12 Homework
    const resForbiddenDetail = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/student/homework/${hw5Id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resForbiddenDetail.status === 403, '23. Student A denied access to Class 12 homework (HTTP 403 Forbidden)');

    // 12. Test Homework Submission: POST /api/student/homework/:id/submit (On-time)
    const resSubm1 = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/student/homework/${hw1Id}/submit`,
        method: 'POST',
        headers: { Authorization: `Bearer ${studentAToken}`, 'Content-Type': 'application/json' }
      },
      {
        submissionText: 'Here is my complete solution to problems 1-20.',
        attachmentUrl: 'https://storage.edusetu.org/homework/trig_sol.pdf'
      }
    );
    assert(resSubm1.status === 201, '24. Student submits HW1 successfully (HTTP 201 Created)');
    assert(resSubm1.data.data.status === 'submitted', '25. On-time submission assigned status "submitted"');

    // 13. Test Duplicate Submission Prevention
    const resDupSubm = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/student/homework/${hw1Id}/submit`,
        method: 'POST',
        headers: { Authorization: `Bearer ${studentAToken}`, 'Content-Type': 'application/json' }
      },
      { submissionText: 'Duplicate attempt' }
    );
    assert(resDupSubm.status === 409, '26. Duplicate submission rejected (HTTP 409 Conflict)');

    // 14. Test Late Submission Detection
    const resLateSubm = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/student/homework/${hw3Id}/submit`,
        method: 'POST',
        headers: { Authorization: `Bearer ${studentAToken}`, 'Content-Type': 'application/json' }
      },
      { submissionText: 'Late submission for chemistry' }
    );
    assert(resLateSubm.status === 201, '27. Past due homework submission accepted (HTTP 201)');
    assert(resLateSubm.data.data.status === 'late', '28. Past due submission correctly marked as "late"');

    // 15. Test Closed Homework Submission Rejection
    const resClosedSubm = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/student/homework/${hw4Id}/submit`,
        method: 'POST',
        headers: { Authorization: `Bearer ${studentAToken}`, 'Content-Type': 'application/json' }
      },
      { submissionText: 'Trying to submit closed homework' }
    );
    assert(resClosedSubm.status === 400, '29. Submission on closed homework rejected (HTTP 400 Bad Request)');

    // 16. Test Empty Submission Validation
    const resEmptySubm = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/student/homework/${hw2Id}/submit`,
        method: 'POST',
        headers: { Authorization: `Bearer ${studentAToken}`, 'Content-Type': 'application/json' }
      },
      { submissionText: '' }
    );
    assert(resEmptySubm.status === 400, '30. Empty submission rejected (HTTP 400 Bad Request)');

    // 17. Test View Submission API: GET /api/student/homework/:id/submission
    const resGetSubm = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/student/homework/${hw1Id}/submission`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resGetSubm.status === 200, '31. Student views own submission (HTTP 200)');
    assert(resGetSubm.data.data.submission.submissionText === 'Here is my complete solution to problems 1-20.', '32. Submission text matches');

    // 18. Test Role Authorization (Teacher/Parent/Admin denied student homework submission)
    const resTeacherSubmit = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/student/homework/${hw1Id}/submit`,
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherToken}`, 'Content-Type': 'application/json' }
      },
      { submissionText: 'Teacher submit' }
    );
    assert(resTeacherSubmit.status === 403, '33. Teacher denied on student submit endpoint (HTTP 403 Forbidden)');

    const resParentAccess = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/homework',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    assert(resParentAccess.status === 403, '34. Parent denied on student homework (HTTP 403 Forbidden)');

    const resAdminAccess = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/homework',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resAdminAccess.status === 403, '35. Admin denied on student homework (HTTP 403 Forbidden)');

    // 19. Test Authentication Guards
    const resNoToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/homework',
      method: 'GET'
    });
    assert(resNoToken.status === 401, '36. Missing token returns HTTP 401 Unauthorized');

    const resBadToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/homework',
      method: 'GET',
      headers: { Authorization: 'Bearer fake.token' }
    });
    assert(resBadToken.status === 401, '37. Invalid token returns HTTP 401 Unauthorized');

    console.log(`\n====================================================`);
    console.log(`🎉 Homework System Test Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`====================================================\n`);

  } catch (error) {
    console.error('Fatal Homework System test execution error:', error);
    process.exitCode = 1;
  }
}

runHomeworkTests();
