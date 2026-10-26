const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const { User, StudentProfile, Marks, sequelize } = require('./src/models');
const { calculatePercentage, calculateGrade } = require('./src/utils/gradeCalculator');

console.log('====================================================');
console.log('📊 Running EduSetu Step 4D Marks System Test Suite');
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

async function runMarksTests() {
  const timestamp = Date.now();
  const studentAEmail = `student_marks_a_${timestamp}@edusetu.org`;
  const studentBEmail = `student_marks_b_${timestamp}@edusetu.org`;
  const studentFreshEmail = `student_marks_fresh_${timestamp}@edusetu.org`;
  const teacherEmail = `teacher_marks_${timestamp}@edusetu.org`;
  const parentEmail = `parent_marks_${timestamp}@edusetu.org`;
  const adminEmail = `admin_marks_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  let studentAToken = '';
  let studentBToken = '';
  let studentFreshToken = '';
  let teacherToken = '';
  let parentToken = '';
  let adminToken = '';

  let studentAProfile = null;
  let studentBProfile = null;
  let teacherUser = null;
  let mark1Id = null;
  let markBId = null;

  try {
    // 1. Grade Calculator Unit Tests
    assert(calculatePercentage(82, 100) === 82, '1. calculatePercentage(82, 100) = 82%');
    assert(calculatePercentage(42, 50) === 84, '2. calculatePercentage(42, 50) = 84%');
    assert(calculatePercentage(22, 25) === 88, '3. calculatePercentage(22, 25) = 88%');
    assert(calculatePercentage(0, 100) === 0, '4. calculatePercentage(0, 100) = 0%');

    assert(calculateGrade(95) === 'A+', '5. Grade 95% = A+');
    assert(calculateGrade(85) === 'A', '6. Grade 85% = A');
    assert(calculateGrade(75) === 'B+', '7. Grade 75% = B+');
    assert(calculateGrade(65) === 'B', '8. Grade 65% = B');
    assert(calculateGrade(55) === 'C', '9. Grade 55% = C');
    assert(calculateGrade(45) === 'D', '10. Grade 45% = D');
    assert(calculateGrade(35) === 'F', '11. Grade 35% = F');
    assert(calculateGrade(null) === 'N/A', '12. Grade null = N/A');

    // 2. Model Associations Verification
    assert(typeof StudentProfile.associations.marks !== 'undefined', '13. StudentProfile hasMany Marks defined');
    assert(typeof Marks.associations.studentProfile !== 'undefined', '14. Marks belongsTo StudentProfile defined');
    assert(typeof User.associations.markedGrades !== 'undefined', '15. User hasMany Marks defined');
    assert(typeof Marks.associations.evaluator !== 'undefined', '16. Marks belongsTo User defined');

    // 3. Register Accounts
    const resA = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Student Marks A', email: studentAEmail, password: commonPassword, role: 'student', className: 'Class 10', section: 'A' }
    );
    assert(resA.status === 201, '17. Registered Student A');
    studentAToken = resA.data.data.token;
    studentAProfile = resA.data.data.user.studentProfile;

    const resB = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Student Marks B', email: studentBEmail, password: commonPassword, role: 'student', className: 'Class 10', section: 'B' }
    );
    assert(resB.status === 201, '18. Registered Student B');
    studentBToken = resB.data.data.token;
    studentBProfile = resB.data.data.user.studentProfile;

    const resFresh = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Student Fresh', email: studentFreshEmail, password: commonPassword, role: 'student' }
    );
    assert(resFresh.status === 201, '19. Registered Fresh Student with 0 marks');
    studentFreshToken = resFresh.data.data.token;

    const resT = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Teacher Marks', email: teacherEmail, password: commonPassword, role: 'teacher' }
    );
    teacherToken = resT.data.data.token;
    teacherUser = resT.data.data.user;

    const resP = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Parent Marks', email: parentEmail, password: commonPassword, role: 'parent' }
    );
    parentToken = resP.data.data.token;

    const resAdm = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Admin Marks', email: adminEmail, password: commonPassword, role: 'admin' }
    );
    adminToken = resAdm.data.data.token;

    // 4. Model-Level Validations
    let validationFailedProperly = false;
    try {
      await Marks.create({
        studentId: studentAProfile.id,
        subject: 'Mathematics',
        examType: 'unit_test',
        examName: 'Invalid Test',
        maxMarks: 100,
        obtainedMarks: 110 // invalid!
      });
    } catch (e) {
      validationFailedProperly = true;
    }
    assert(validationFailedProperly, '20. Model rejects obtainedMarks > maxMarks');

    let negativeRejected = false;
    try {
      await Marks.create({
        studentId: studentAProfile.id,
        subject: 'Mathematics',
        examType: 'unit_test',
        examName: 'Negative Test',
        maxMarks: 100,
        obtainedMarks: -10 // invalid!
      });
    } catch (e) {
      negativeRejected = true;
    }
    assert(negativeRejected, '21. Model rejects negative obtainedMarks');

    // 5. Seed Controlled Marks
    // Student A:
    // Math: Unit Test 1 (22 / 25), Mid Term 1 (80 / 100) -> 102 / 125 = 81.60% (A)
    // Physics: Mid Term 1 (45 / 50), Practical 1 (28 / 30) -> 73 / 80 = 91.25% (A+)
    // Chemistry: Quiz 1 (18 / 20) -> 18 / 20 = 90.00% (A+)
    // Total: 193 / 225 = 85.78% (A)
    const m1 = await Marks.create({
      studentId: studentAProfile.id,
      subject: 'Mathematics',
      examType: 'unit_test',
      examName: 'Unit Test 1',
      maxMarks: 25,
      obtainedMarks: 22,
      examDate: '2026-08-10',
      remarks: 'Strong algebraic reasoning',
      markedBy: teacherUser.id
    });
    mark1Id = m1.id;

    await Marks.create({
      studentId: studentAProfile.id,
      subject: 'Mathematics',
      examType: 'mid_term',
      examName: 'Mid Term 1',
      maxMarks: 100,
      obtainedMarks: 80,
      examDate: '2026-08-20',
      remarks: 'Great performance in trigonometry',
      markedBy: teacherUser.id
    });

    await Marks.create({
      studentId: studentAProfile.id,
      subject: 'Physics',
      examType: 'mid_term',
      examName: 'Mid Term 1',
      maxMarks: 50,
      obtainedMarks: 45,
      examDate: '2026-08-22',
      remarks: 'Outstanding ray diagram accuracy',
      markedBy: teacherUser.id
    });

    await Marks.create({
      studentId: studentAProfile.id,
      subject: 'Physics',
      examType: 'practical',
      examName: 'Practical 1',
      maxMarks: 30,
      obtainedMarks: 28,
      examDate: '2026-08-25',
      remarks: 'Excellent lab experiment',
      markedBy: teacherUser.id
    });

    await Marks.create({
      studentId: studentAProfile.id,
      subject: 'Chemistry',
      examType: 'quiz',
      examName: 'Quiz 1',
      maxMarks: 20,
      obtainedMarks: 18,
      examDate: '2026-08-28',
      remarks: 'Very good periodic table recall',
      markedBy: teacherUser.id
    });

    // Student B: English Final Exam
    const mb = await Marks.create({
      studentId: studentBProfile.id,
      subject: 'English',
      examType: 'final_exam',
      examName: 'Annual Exam',
      maxMarks: 100,
      obtainedMarks: 75,
      examDate: '2026-08-29',
      remarks: 'Good essay composition',
      markedBy: teacherUser.id
    });
    markBId = mb.id;

    assert(true, '22. Seeded controlled test marks for Student A & B');

    // 6. Test Composite Unique Constraint (Duplicate Protection)
    let duplicateRejected = false;
    try {
      await Marks.create({
        studentId: studentAProfile.id,
        subject: 'Mathematics',
        examType: 'unit_test',
        examName: 'Unit Test 1', // duplicate!
        maxMarks: 25,
        obtainedMarks: 20
      });
    } catch (e) {
      duplicateRejected = true;
    }
    assert(duplicateRejected, '23. Composite unique constraint prevents duplicate [studentId, subject, examType, examName]');

    // 7. Test Fresh Student Empty Performance: GET /api/student/performance
    const resFreshPerf = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/performance',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentFreshToken}` }
    });
    assert(resFreshPerf.status === 200, '24. Fresh student GET /api/student/performance (HTTP 200)');
    assert(resFreshPerf.data.data.totalExams === 0, '25. Zero exams on fresh student');
    assert(resFreshPerf.data.data.overallPercentage === 0, '26. Zero percentage on fresh student');
    assert(resFreshPerf.data.data.overallGrade === 'N/A', '27. Grade is N/A when no marks');

    // 8. Test Student A Listing Marks: GET /api/student/marks
    const resMarksA = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/marks',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resMarksA.status === 200, '28. Student A GET /api/student/marks (HTTP 200)');
    assert(resMarksA.data.data.length === 5, '29. Student A retrieved all 5 marks records');
    assert(resMarksA.data.data[0].percentage !== undefined, '30. Marks list response includes percentage');
    assert(resMarksA.data.data[0].grade !== undefined, '31. Marks list response includes grade');

    // 9. Test Student B Listing Marks (User Isolation)
    const resMarksB = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/marks',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentBToken}` }
    });
    assert(resMarksB.status === 200, '32. Student B GET /api/student/marks (HTTP 200)');
    assert(resMarksB.data.data.length === 1, '33. Student B receives only their 1 record (User isolation verified)');

    // 10. Test Filters: Subject, ExamType, Search, Date
    const resSubFilter = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/marks?subject=Mathematics',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resSubFilter.data.data.length === 2, '34. Subject filter (?subject=Mathematics) returns exactly 2 records');

    const resTypeFilter = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/marks?examType=mid_term',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resTypeFilter.data.data.length === 2, '35. ExamType filter (?examType=mid_term) returns 2 records');

    const resSearchFilter = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/marks?search=Physics',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resSearchFilter.data.data.length === 2, '36. Search query (?search=Physics) matches 2 records');

    const resDateFilter = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/marks?startDate=2026-08-21&endDate=2026-08-26',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resDateFilter.data.data.length === 2, '37. Date range filter returns matching 2 records');

    // 11. Test Filter Validation Errors (400)
    const resBadType = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/marks?examType=invalid_type',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resBadType.status === 400, '38. Invalid examType returns HTTP 400');

    const resBadDates = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/marks?startDate=2026-08-30&endDate=2026-08-01',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resBadDates.status === 400, '39. Invalid date range (startDate > endDate) returns HTTP 400');

    // 12. Test Get Mark by ID: GET /api/student/marks/:id
    const resMarkDetail = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/student/marks/${mark1Id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resMarkDetail.status === 200, '40. Student A GET /api/student/marks/:id (HTTP 200)');
    assert(resMarkDetail.data.data.subject === 'Mathematics', '41. Mark detail subject matches');
    assert(resMarkDetail.data.data.percentage === 88, '42. Mark detail calculated percentage is 88%');
    assert(resMarkDetail.data.data.grade === 'A', '43. Mark detail calculated grade is A');

    // 13. Test Mark ID Security (Student A cannot view Student B mark)
    const resDeniedMark = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/student/marks/${markBId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resDeniedMark.status === 404, '44. Student A denied access to Student B mark (HTTP 404 Not Found)');

    // 14. Test Student Performance Calculation: GET /api/student/performance
    const resPerfA = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/performance',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAToken}` }
    });
    assert(resPerfA.status === 200, '45. Student A GET /api/student/performance (HTTP 200)');
    assert(resPerfA.data.data.totalExams === 5, '46. Total exams = 5');
    assert(resPerfA.data.data.totalMaxMarks === 225, '47. Total max marks = 225');
    assert(resPerfA.data.data.totalObtainedMarks === 193, '48. Total obtained marks = 193');
    assert(resPerfA.data.data.overallPercentage === 85.78, `49. Overall percentage = 85.78% (got ${resPerfA.data.data.overallPercentage}%)`);
    assert(resPerfA.data.data.overallGrade === 'A', '50. Overall grade = A');
    assert(resPerfA.data.data.subjects.length === 3, '51. Subject analytics generated for 3 subjects');

    // 15. Test Role Authorization (Teacher, Parent, Admin denied on student marks endpoints)
    const resTeacherMarks = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/marks',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    assert(resTeacherMarks.status === 403, '52. Teacher denied on student marks endpoint (HTTP 403 Forbidden)');

    const resParentMarks = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/performance',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    assert(resParentMarks.status === 403, '53. Parent denied on student performance endpoint (HTTP 403 Forbidden)');

    const resAdminMarks = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/marks',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resAdminMarks.status === 403, '54. Admin denied on student marks endpoint (HTTP 403 Forbidden)');

    // 16. Test Authentication Guards
    const resNoToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/marks',
      method: 'GET'
    });
    assert(resNoToken.status === 401, '55. Missing JWT returns HTTP 401 Unauthorized');

    const resBadToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/student/marks',
      method: 'GET',
      headers: { Authorization: 'Bearer invalid.token' }
    });
    assert(resBadToken.status === 401, '56. Invalid JWT returns HTTP 401 Unauthorized');

    console.log(`\n====================================================`);
    console.log(`🎉 Marks System Test Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`====================================================\n`);

  } catch (error) {
    console.error('Fatal Marks System test execution error:', error);
    process.exitCode = 1;
  }
}

runMarksTests();
