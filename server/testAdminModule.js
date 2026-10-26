const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const {
  User,
  StudentProfile,
  TeacherProfile,
  ParentProfile,
  ParentStudent,
  AdminProfile,
  Class,
  Section,
  Subject,
  AuditLog,
  sequelize
} = require('./src/models');

console.log('================================================================');
console.log('🛡️ Running EduSetu Step 8 Admin Module Test Suite');
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

async function runAdminTests() {
  const timestamp = Date.now();
  const adminEmail = `admin_${timestamp}@edusetu.org`;
  const teacherEmail = `teacher_admin_${timestamp}@edusetu.org`;
  const parentEmail = `parent_admin_${timestamp}@edusetu.org`;
  const student1Email = `student1_admin_${timestamp}@edusetu.org`;
  const student2Email = `student2_admin_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  let adminToken = '';
  let teacherToken = '';
  let parentToken = '';
  let studentToken = '';

  let adminUser = null;
  let teacherProfile = null;
  let parentProfile = null;
  let student1Profile = null;
  let student2Profile = null;
  let targetUserId = null;

  let createdClassId = null;
  let createdSectionId = null;
  let createdSubjectId = null;

  try {
    // 1. Model & Association Checks
    assert(typeof User.associations.adminProfile !== 'undefined', '1. User hasOne AdminProfile defined');
    assert(typeof AdminProfile.associations.user !== 'undefined', '2. AdminProfile belongsTo User defined');
    assert(typeof Class.associations.sections !== 'undefined', '3. Class hasMany Section defined');
    assert(typeof Section.associations.class !== 'undefined', '4. Section belongsTo Class defined');
    assert(typeof User.associations.auditLogs !== 'undefined', '5. User hasMany AuditLog defined');

    // 2. Register Accounts
    const resAdminReg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Dr. Vikram Malhotra', email: adminEmail, password: commonPassword, role: 'admin', designation: 'Dean of Academics', department: 'Administration' }
    );
    assert(resAdminReg.status === 201, '6. Registered Administrator Account');
    adminToken = resAdminReg.data.data.token;
    adminUser = resAdminReg.data.data.user;
    assert(adminUser.role === 'admin', '7. Admin role assigned');
    assert(adminUser.adminProfile && adminUser.adminProfile.adminId.startsWith('ADM'), '8. Generated immutable Admin ID (ADM...)');

    const resT = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Prof. Anjali Verma', email: teacherEmail, password: commonPassword, role: 'teacher', className: 'Class 10', section: 'A', subjects: ['Physics'] }
    );
    teacherToken = resT.data.data.token;
    teacherProfile = resT.data.data.user.teacherProfile;
    assert(resT.status === 201, '9. Registered Teacher');

    const resP = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Mr. Rajesh Mehra', email: parentEmail, password: commonPassword, role: 'parent', relationship: 'Father', occupation: 'Architect' }
    );
    parentToken = resP.data.data.token;
    parentProfile = resP.data.data.user.parentProfile;
    assert(resP.status === 201, '10. Registered Parent');

    const resS1 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Kavya Mehra', email: student1Email, password: commonPassword, role: 'student', className: 'Class 10', section: 'A', rollNumber: '101' }
    );
    studentToken = resS1.data.data.token;
    student1Profile = resS1.data.data.user.studentProfile;
    targetUserId = resS1.data.data.user.id;
    assert(resS1.status === 201, '11. Registered Student 1');

    const resS2 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Arjun Mehra', email: student2Email, password: commonPassword, role: 'student', className: 'Class 10', section: 'B', rollNumber: '102' }
    );
    student2Profile = resS2.data.data.user.studentProfile;
    assert(resS2.status === 201, '12. Registered Student 2');

    // 3. Admin RBAC Permissions & Denial Tests
    const resDenyStudent = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(resDenyStudent.status === 403, '13. Student denied on /api/admin/dashboard (HTTP 403 Forbidden)');

    const resDenyTeacher = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    assert(resDenyTeacher.status === 403, '14. Teacher denied on /api/admin/dashboard (HTTP 403 Forbidden)');

    const resDenyParent = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    assert(resDenyParent.status === 403, '15. Parent denied on /api/admin/dashboard (HTTP 403 Forbidden)');

    const resNoToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/admin/dashboard',
      method: 'GET'
    });
    assert(resNoToken.status === 401, '16. Missing JWT returns HTTP 401 Unauthorized');

    const resBadToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { Authorization: 'Bearer fake.token.here' }
    });
    assert(resBadToken.status === 401, '17. Invalid JWT returns HTTP 401 Unauthorized');

    // 4. Admin Dashboard Metrics
    const resDashboard = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resDashboard.status === 200, '18. Admin GET /api/admin/dashboard (HTTP 200)');
    assert(resDashboard.data.data.stats.totalUsers >= 5, '19. totalUsers count accurate');
    assert(resDashboard.data.data.stats.totalStudents >= 2, '20. totalStudents count accurate');
    assert(resDashboard.data.data.stats.totalTeachers >= 1, '21. totalTeachers count accurate');
    assert(resDashboard.data.data.stats.totalParents >= 1, '22. totalParents count accurate');
    assert(resDashboard.data.data.stats.totalAdmins >= 1, '23. totalAdmins count accurate');

    // 5. User Directory & Filtering
    const resUsers = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/admin/users?page=1&limit=10',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resUsers.status === 200, '24. GET /api/admin/users (HTTP 200)');
    assert(resUsers.data.data.total >= 5, '25. Total user count returned in pagination');

    const resFilterRole = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/admin/users?role=teacher',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resFilterRole.status === 200, '26. GET /api/admin/users?role=teacher (HTTP 200)');
    assert(resFilterRole.data.data.users.every((u) => u.role === 'teacher'), '27. Role filtering strictly enforces teacher role');

    const resSearchUser = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/admin/users?search=${encodeURIComponent('Kavya')}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resSearchUser.status === 200, '28. User search by name (HTTP 200)');
    assert(resSearchUser.data.data.users.some((u) => u.name.includes('Kavya')), '29. Search match found');

    // 6. User Status Update & Admin Self-Protection
    const resUpdateStatus = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/admin/users/${targetUserId}/status`, method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      { status: 'inactive' }
    );
    assert(resUpdateStatus.status === 200, '30. Admin deactivated user (HTTP 200)');
    assert(resUpdateStatus.data.data.isActive === false, '31. isActive is now false');

    // Re-activate user
    await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/admin/users/${targetUserId}/status`, method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      { status: 'active' }
    );

    // Admin Self-Protection
    const resSelfDeactivate = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/admin/users/${adminUser.id}/status`, method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      { status: 'inactive' }
    );
    assert(resSelfDeactivate.status === 400, '32. Admin self-deactivation blocked (HTTP 400 Bad Request)');

    // 7. Teacher Directory & Class Assignment
    const resTeachers = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/admin/teachers',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resTeachers.status === 200, '33. GET /api/admin/teachers (HTTP 200)');
    assert(resTeachers.data.data.teachers.length >= 1, '34. Teachers returned');

    const resAssignTeacher = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/admin/teachers/${teacherProfile.teacherId}/assignment`, method: 'PUT', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      { className: 'Grade 11', section: 'B', subjects: ['Physics', 'Chemistry'] }
    );
    assert(resAssignTeacher.status === 200, '35. Admin updated teacher assignment (HTTP 200)');
    assert(resAssignTeacher.data.data.className === 'Grade 11', '36. Assigned class updated');
    assert(resAssignTeacher.data.data.section === 'B', '37. Assigned section updated');

    // 8. Student Directory & Class Assignment
    const resStudents = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/admin/students',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resStudents.status === 200, '38. GET /api/admin/students (HTTP 200)');

    const resAssignStudent = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/admin/students/${student1Profile.studentId}/assignment`, method: 'PUT', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      { className: 'Grade 11', section: 'B', rollNumber: '55' }
    );
    assert(resAssignStudent.status === 200, '39. Admin updated student assignment (HTTP 200)');
    assert(resAssignStudent.data.data.className === 'Grade 11', '40. Student class updated');
    assert(resAssignStudent.data.data.rollNumber === '55', '41. Student roll number updated');

    // 9. Parent Directory & Child Linking / Unlinking
    const resParents = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/admin/parents',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resParents.status === 200, '42. GET /api/admin/parents (HTTP 200)');

    // Admin links Student 1 to Parent
    const resLinkChild = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/admin/parents/${parentProfile.parentId}/children`, method: 'POST', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      { studentId: student1Profile.studentId, relationship: 'Daughter' }
    );
    assert(resLinkChild.status === 201, '43. Admin linked Student 1 to Parent (HTTP 201 Created)');

    // Duplicate link returns gracefully
    const resDupLink = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/admin/parents/${parentProfile.parentId}/children`, method: 'POST', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      { studentId: student1Profile.studentId, relationship: 'Daughter' }
    );
    assert(resDupLink.status === 200, '44. Duplicate link handled gracefully (HTTP 200 OK)');

    // Admin unlinks Student 1
    const resUnlinkChild = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/admin/parents/${parentProfile.parentId}/children/${student1Profile.studentId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resUnlinkChild.status === 200, '45. Admin unlinked Student from Parent (HTTP 200 OK)');

    // 10. Class Management
    const resCreateClass = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/classes', method: 'POST', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      { name: `Grade 12 Advanced_${timestamp}`, description: 'Senior Secondary Grade' }
    );
    assert(resCreateClass.status === 201, '46. Admin created Class (HTTP 201 Created)');
    createdClassId = resCreateClass.data.data.id;

    const resDupClass = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/classes', method: 'POST', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      { name: `Grade 12 Advanced_${timestamp}`, description: 'Duplicate' }
    );
    assert(resDupClass.status === 409, '47. Duplicate class name rejected (HTTP 409 Conflict)');

    const resUpdateClass = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/admin/classes/${createdClassId}`, method: 'PUT', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      { description: 'Updated Senior Secondary Grade Description' }
    );
    assert(resUpdateClass.status === 200, '48. Admin updated Class (HTTP 200 OK)');

    // 11. Section Management
    const resCreateSection = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/sections', method: 'POST', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      { classId: createdClassId, name: 'A' }
    );
    assert(resCreateSection.status === 201, '49. Admin created Section A (HTTP 201 Created)');
    createdSectionId = resCreateSection.data.data.id;

    const resDupSection = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/sections', method: 'POST', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      { classId: createdClassId, name: 'A' }
    );
    assert(resDupSection.status === 409, '50. Duplicate section name in same class rejected (HTTP 409 Conflict)');

    const resUpdateSection = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/admin/sections/${createdSectionId}`, method: 'PUT', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      { status: 'active' }
    );
    assert(resUpdateSection.status === 200, '51. Admin updated Section (HTTP 200 OK)');

    // 12. Subject Management
    const resCreateSubject = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/subjects', method: 'POST', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      { name: 'Computer Science', code: `CS_${timestamp}`, description: 'Algorithms & Programming' }
    );
    assert(resCreateSubject.status === 201, '52. Admin created Subject (HTTP 201 Created)');
    createdSubjectId = resCreateSubject.data.data.id;

    const resDupSubject = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/admin/subjects', method: 'POST', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      { name: 'Computer Science Duplicate', code: `CS_${timestamp}`, description: 'Duplicate code' }
    );
    assert(resDupSubject.status === 409, '53. Duplicate subject code rejected (HTTP 409 Conflict)');

    const resUpdateSubject = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/admin/subjects/${createdSubjectId}`, method: 'PUT', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      { description: 'Updated CS syllabus description' }
    );
    assert(resUpdateSubject.status === 200, '54. Admin updated Subject (HTTP 200 OK)');

    // 13. Clean Deletions
    const resDelSec = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/admin/sections/${createdSectionId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resDelSec.status === 200, '55. Admin deleted Section (HTTP 200 OK)');

    const resDelClass = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/admin/classes/${createdClassId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resDelClass.status === 200, '56. Admin deleted Class (HTTP 200 OK)');

    const resDelSub = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/admin/subjects/${createdSubjectId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resDelSub.status === 200, '57. Admin deleted Subject (HTTP 200 OK)');

    // 14. Passwords and Secrets Exclusions
    assert(resUsers.data.data.users[0].password === undefined, '58. Passwords and hashes NOT exposed in users list');

    console.log(`\n================================================================`);
    console.log(`🎉 Step 8 Admin Module Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`================================================================\n`);

  } catch (error) {
    console.error('Fatal Admin test execution error:', error);
    process.exitCode = 1;
  }
}

runAdminTests();
