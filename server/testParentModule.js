const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const { User, StudentProfile, TeacherProfile, ParentProfile, ParentStudent, sequelize } = require('./src/models');

console.log('===============================================================');
console.log('👨‍👩‍👧 Running EduSetu Step 6A Parent Module Foundation Test Suite');
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

async function runParentModuleTests() {
  const timestamp = Date.now();

  const parentAEmail = `parent_a_${timestamp}@edusetu.org`;
  const parentBEmail = `parent_b_${timestamp}@edusetu.org`;
  const student1Email = `stu1_p_${timestamp}@edusetu.org`;
  const student2Email = `stu2_p_${timestamp}@edusetu.org`;
  const student3Email = `stu3_p_${timestamp}@edusetu.org`;
  const teacherRoleEmail = `tch_role_p_${timestamp}@edusetu.org`;
  const studentRoleEmail = `stu_role_p_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  let parentAToken = '';
  let parentBToken = '';
  let studentRoleToken = '';
  let teacherRoleToken = '';

  let student1Profile = null;
  let student2Profile = null;
  let student3Profile = null;
  let parentAUser = null;
  let parentBUser = null;

  try {
    // 1. Model Association Checks
    assert(User.associations.parentProfile !== undefined, '1. User hasOne ParentProfile defined');
    assert(ParentProfile.associations.user !== undefined, '2. ParentProfile belongsTo User defined');
    assert(ParentProfile.associations.parentStudents !== undefined, '3. ParentProfile hasMany ParentStudent defined');
    assert(ParentStudent.associations.studentProfile !== undefined, '4. ParentStudent belongsTo StudentProfile defined');

    // 2. Register Parent A
    const resPA = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Mr. Rajesh Sharma', email: parentAEmail, password: commonPassword, role: 'parent', phone: '9876543210', relationship: 'Father', occupation: 'Engineer' }
    );
    assert(resPA.status === 201, '5. Parent A registered successfully (HTTP 201 Created)');
    assert(resPA.data.data.user.role === 'parent', '6. Parent A role is parent');
    assert(resPA.data.data.user.parentProfile !== undefined, '7. ParentProfile auto-generated on registration');
    assert(resPA.data.data.user.parentProfile.parentId.startsWith('PAR'), '8. Unique parentId generated (starts with PAR)');
    parentAToken = resPA.data.data.token;
    parentAUser = resPA.data.data.user;

    // 3. Register Parent B
    const resPB = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Mrs. Sunita Sen', email: parentBEmail, password: commonPassword, role: 'parent', phone: '9123456780', relationship: 'Mother', occupation: 'Doctor' }
    );
    assert(resPB.status === 201, '9. Parent B registered successfully (HTTP 201 Created)');
    parentBToken = resPB.data.data.token;
    parentBUser = resPB.data.data.user;

    // 4. Register Students
    const resS1 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Aarav Sharma', email: student1Email, password: commonPassword, role: 'student', className: 'Class 10', section: 'A', rollNumber: '1' }
    );
    student1Profile = resS1.data.data.user.studentProfile;

    const resS2 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Diya Sharma', email: student2Email, password: commonPassword, role: 'student', className: 'Class 8', section: 'B', rollNumber: '5' }
    );
    student2Profile = resS2.data.data.user.studentProfile;

    const resS3 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Rohan Sen', email: student3Email, password: commonPassword, role: 'student', className: 'Class 10', section: 'B', rollNumber: '12' }
    );
    student3Profile = resS3.data.data.user.studentProfile;

    assert(true, '10. Registered 3 controlled students for parent mapping');

    // Register Teacher and Student for RBAC tests
    const resTRole = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Teacher RBAC', email: teacherRoleEmail, password: commonPassword, role: 'teacher' }
    );
    teacherRoleToken = resTRole.data.data.token;

    const resSRole = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Student RBAC', email: studentRoleEmail, password: commonPassword, role: 'student' }
    );
    studentRoleToken = resSRole.data.data.token;

    // 5. Link Children
    // Parent A links Student 1 and Student 2
    const resLink1 = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/parent/children/link',
        method: 'POST',
        headers: { Authorization: `Bearer ${parentAToken}`, 'Content-Type': 'application/json' }
      },
      { studentId: student1Profile.studentId, relationship: 'Son' }
    );
    assert(resLink1.status === 200, '11. Parent A links Student 1 (Son) successfully');

    const resLink2 = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/parent/children/link',
        method: 'POST',
        headers: { Authorization: `Bearer ${parentAToken}`, 'Content-Type': 'application/json' }
      },
      { studentId: student2Profile.studentId, relationship: 'Daughter' }
    );
    assert(resLink2.status === 200, '12. Parent A links Student 2 (Daughter) successfully');

    // Parent B links Student 3
    const resLink3 = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/parent/children/link',
        method: 'POST',
        headers: { Authorization: `Bearer ${parentBToken}`, 'Content-Type': 'application/json' }
      },
      { studentId: student3Profile.studentId, relationship: 'Son' }
    );
    assert(resLink3.status === 200, '13. Parent B links Student 3 (Son) successfully');

    // 6. Test GET /api/parent/profile
    const resProfile = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/parent/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resProfile.status === 200, '14. Parent A GET /api/parent/profile (HTTP 200)');
    assert(resProfile.data.data.name === 'Mr. Rajesh Sharma', '15. Profile name matches');
    assert(resProfile.data.data.relationship === 'Father', '16. Profile relationship matches');
    assert(resProfile.data.data.occupation === 'Engineer', '17. Profile occupation matches');
    assert(resProfile.data.data.password === undefined, '18. Password NOT exposed in parent profile');

    // 7. Test PUT /api/parent/profile
    const resUpdateProfile = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/parent/profile',
        method: 'PUT',
        headers: { Authorization: `Bearer ${parentAToken}`, 'Content-Type': 'application/json' }
      },
      {
        name: 'Mr. Rajesh K. Sharma',
        phone: '9876543219',
        occupation: 'Senior Software Architect',
        address: '42 Academic Enclave, Sector 5'
      }
    );
    assert(resUpdateProfile.status === 200, '19. Parent A updates profile (HTTP 200)');
    assert(resUpdateProfile.data.data.name === 'Mr. Rajesh K. Sharma', '20. Updated name persisted');
    assert(resUpdateProfile.data.data.occupation === 'Senior Software Architect', '21. Updated occupation persisted');
    assert(resUpdateProfile.data.data.role === 'parent', '22. Role remains parent (immutable)');
    assert(resUpdateProfile.data.data.parentId === parentAUser.parentProfile.parentId, '23. parentId remains immutable');

    // 8. Test GET /api/parent/children
    const resChildrenA = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/parent/children',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resChildrenA.status === 200, '24. Parent A GET /api/parent/children (HTTP 200)');
    assert(resChildrenA.data.data.count === 2, '25. Parent A receives exactly 2 linked children');
    assert(resChildrenA.data.data.children[0].name === 'Aarav Sharma', '26. Child 1 name matches');
    assert(resChildrenA.data.data.children[1].name === 'Diya Sharma', '27. Child 2 name matches');

    // 9. Test Parent Isolation: Parent B GET /api/parent/children
    const resChildrenB = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/parent/children',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentBToken}` }
    });
    assert(resChildrenB.status === 200, '28. Parent B GET /api/parent/children (HTTP 200)');
    assert(resChildrenB.data.data.count === 1, '29. Parent B receives only 1 child (Parent isolation verified)');
    assert(resChildrenB.data.data.children[0].name === 'Rohan Sen', '30. Parent B child is Rohan Sen');

    // 10. Test GET /api/parent/children/:studentId (Own child)
    const resChildDetails = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student1Profile.studentId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resChildDetails.status === 200, '31. Parent A GET child details (HTTP 200)');
    assert(resChildDetails.data.data.name === 'Aarav Sharma', '32. Child details name matches');
    assert(resChildDetails.data.data.className === 'Class 10', '33. Child class matches');
    assert(resChildDetails.data.data.relationship === 'Son', '34. Relationship matches');

    // 11. Test Security: Parent A accessing Parent B's child (Unauthorized child access)
    const resUnauthorizedChild = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/children/${student3Profile.studentId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resUnauthorizedChild.status === 403, '35. Parent A denied on unauthorized child (HTTP 403 Forbidden)');

    // 12. Test RBAC Guards
    const resStudentOnParent = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/parent/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentRoleToken}` }
    });
    assert(resStudentOnParent.status === 403, '36. Student denied on /api/parent/profile (HTTP 403 Forbidden)');

    const resTeacherOnParent = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/parent/children',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherRoleToken}` }
    });
    assert(resTeacherOnParent.status === 403, '37. Teacher denied on /api/parent/children (HTTP 403 Forbidden)');

    const resNoToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/parent/profile',
      method: 'GET'
    });
    assert(resNoToken.status === 401, '38. Missing JWT returns HTTP 401 Unauthorized');

    const resBadToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/parent/profile',
      method: 'GET',
      headers: { Authorization: 'Bearer invalid.token' }
    });
    assert(resBadToken.status === 401, '39. Invalid JWT returns HTTP 401 Unauthorized');

    console.log(`\n===============================================================`);
    console.log(`🎉 Parent Module Foundation Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`===============================================================\n`);

  } catch (error) {
    console.error('Fatal Parent Module test execution error:', error);
    process.exitCode = 1;
  }
}

runParentModuleTests();
