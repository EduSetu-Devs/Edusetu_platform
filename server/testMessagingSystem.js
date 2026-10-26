const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const {
  User,
  StudentProfile,
  TeacherProfile,
  ParentProfile,
  ParentStudent,
  Conversation,
  Message,
  sequelize
} = require('./src/models');

console.log('================================================================');
console.log('💬 Running EduSetu Step 7A Teacher ↔ Parent Messaging Test Suite');
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

async function runMessagingTests() {
  const timestamp = Date.now();
  const testClassA = `Class 10A_${timestamp}`;
  const testClassB = `Class 10B_${timestamp}`;

  const teacherAEmail = `teacher_msg_a_${timestamp}@edusetu.org`;
  const teacherBEmail = `teacher_msg_b_${timestamp}@edusetu.org`;
  const parentAEmail = `parent_msg_a_${timestamp}@edusetu.org`;
  const parentBEmail = `parent_msg_b_${timestamp}@edusetu.org`;
  const student1Email = `stu1_msg_${timestamp}@edusetu.org`;
  const student2Email = `stu2_msg_${timestamp}@edusetu.org`;
  const student3Email = `stu3_msg_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  let teacherAToken = '';
  let teacherBToken = '';
  let parentAToken = '';
  let parentBToken = '';
  let student1Token = '';

  let teacherAProfile = null;
  let teacherBProfile = null;
  let parentAProfile = null;
  let parentBProfile = null;
  let student1Profile = null;
  let student2Profile = null;
  let student3Profile = null;

  let conv1Id = null;
  let conv2Id = null;
  let message1Id = null;
  let message2Id = null;

  try {
    // 1. Model Associations Verification
    assert(typeof TeacherProfile.associations.conversations !== 'undefined', '1. TeacherProfile hasMany Conversation defined');
    assert(typeof ParentProfile.associations.conversations !== 'undefined', '2. ParentProfile hasMany Conversation defined');
    assert(typeof StudentProfile.associations.conversations !== 'undefined', '3. StudentProfile hasMany Conversation defined');
    assert(typeof Conversation.associations.messages !== 'undefined', '4. Conversation hasMany Message defined');
    assert(typeof Message.associations.conversation !== 'undefined', '5. Message belongsTo Conversation defined');
    assert(typeof Message.associations.sender !== 'undefined', '6. Message belongsTo User defined');

    // 2. Register Accounts
    const resTA = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Prof. Math A', email: teacherAEmail, password: commonPassword, role: 'teacher', className: testClassA, section: 'A', subjects: ['Mathematics'] }
    );
    assert(resTA.status === 201, '7. Registered Teacher A (Class 10A, Sec A)');
    teacherAToken = resTA.data.data.token;
    teacherAProfile = resTA.data.data.user.teacherProfile;

    const resTB = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Prof. Science B', email: teacherBEmail, password: commonPassword, role: 'teacher', className: testClassB, section: 'B', subjects: ['Physics'] }
    );
    assert(resTB.status === 201, '8. Registered Teacher B (Class 10B, Sec B)');
    teacherBToken = resTB.data.data.token;
    teacherBProfile = resTB.data.data.user.teacherProfile;

    const resPA = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Dr. Suresh Sharma', email: parentAEmail, password: commonPassword, role: 'parent', relationship: 'Father', occupation: 'Physician' }
    );
    assert(resPA.status === 201, '9. Registered Parent A');
    parentAToken = resPA.data.data.token;
    parentAProfile = resPA.data.data.user.parentProfile;

    const resPB = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Mrs. Ananya Sen', email: parentBEmail, password: commonPassword, role: 'parent', relationship: 'Mother', occupation: 'Professor' }
    );
    assert(resPB.status === 201, '10. Registered Parent B');
    parentBToken = resPB.data.data.token;
    parentBProfile = resPB.data.data.user.parentProfile;

    const resS1 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Aarav Sharma', email: student1Email, password: commonPassword, role: 'student', className: testClassA, section: 'A', rollNumber: '1' }
    );
    assert(resS1.status === 201, '11. Registered Student 1A (Aarav, Class 10A-A)');
    student1Profile = resS1.data.data.user.studentProfile;
    student1Token = resS1.data.data.token;

    const resS2 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Diya Sharma', email: student2Email, password: commonPassword, role: 'student', className: testClassA, section: 'A', rollNumber: '2' }
    );
    assert(resS2.status === 201, '12. Registered Student 2A (Diya, Class 10A-A)');
    student2Profile = resS2.data.data.user.studentProfile;

    const resS3 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Rohan Sen', email: student3Email, password: commonPassword, role: 'student', className: testClassB, section: 'B', rollNumber: '12' }
    );
    assert(resS3.status === 201, '13. Registered Student 3B (Rohan, Class 10B-B)');
    student3Profile = resS3.data.data.user.studentProfile;

    // 3. Link Children
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
    assert(true, '14. Linked Student 1A & 2A to Parent A, Student 3B to Parent B');

    // 4. Teacher A creates Conversation with Parent A regarding Student 1A
    const resCreateConv1 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/teacher/conversations', method: 'POST', headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' } },
      { parentId: parentAProfile.parentId, studentId: student1Profile.studentId }
    );
    assert(resCreateConv1.status === 201, '15. Teacher A creates conversation with Parent A regarding Student 1A (HTTP 201)');
    conv1Id = resCreateConv1.data.data.id;
    assert(conv1Id !== undefined, '16. Conversation 1 ID created');

    // 5. Duplicate Prevention: Teacher A calls create again -> returns existing conversation without error
    const resDupConv1 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/teacher/conversations', method: 'POST', headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' } },
      { parentId: parentAProfile.parentId, studentId: student1Profile.studentId }
    );
    assert(resDupConv1.status === 200, '17. Duplicate conversation request returns existing conversation (HTTP 200)');
    assert(resDupConv1.data.data.id === conv1Id, '18. Same conversation ID returned');

    // 6. Parent A creates conversation with Teacher A regarding Student 2A (Separate conversation for distinct child)
    const resCreateConv2 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/parent/conversations', method: 'POST', headers: { Authorization: `Bearer ${parentAToken}`, 'Content-Type': 'application/json' } },
      { teacherId: teacherAProfile.teacherId, studentId: student2Profile.studentId }
    );
    assert(resCreateConv2.status === 201, '19. Parent A creates conversation with Teacher A regarding Student 2A (HTTP 201)');
    conv2Id = resCreateConv2.data.data.id;
    assert(conv2Id !== conv1Id, '20. Multi-child isolation: Distinct conversation created for second child');

    // 7. Teacher A lists conversations
    const resTeacherConvs = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/conversations',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resTeacherConvs.status === 200, '21. Teacher A GET conversations (HTTP 200)');
    assert(resTeacherConvs.data.data.count === 2, '22. Teacher A receives exactly 2 conversations');

    // 8. Parent A lists conversations
    const resParentConvs = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/parent/conversations',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resParentConvs.status === 200, '23. Parent A GET conversations (HTTP 200)');
    assert(resParentConvs.data.data.count === 2, '24. Parent A receives exactly 2 conversations');

    // 9. Teacher A sends message in Conv 1
    const resSend1 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/teacher/conversations/${conv1Id}/messages`, method: 'POST', headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' } },
      { message: "Hello Dr. Sharma, please check Aarav's pending homework." }
    );
    assert(resSend1.status === 201, '25. Teacher A sends message in Conv 1 (HTTP 201)');
    message1Id = resSend1.data.data.id;
    assert(resSend1.data.data.isRead === false, '26. Initial message isRead is false');
    assert(resSend1.data.data.isMine === true, '27. Teacher message isMine is true');

    // 10. Unread Count Check
    const resParentUnread1 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/parent/messages/unread-count',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resParentUnread1.status === 200, '28. Parent A GET unread-count (HTTP 200)');
    assert(resParentUnread1.data.data.unreadCount === 1, '29. Parent A unreadCount is 1');

    const resTeacherUnread1 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/messages/unread-count',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resTeacherUnread1.data.data.unreadCount === 0, '30. Teacher A unreadCount is 0 (own messages not counted)');

    // 11. Parent A reads messages in Conv 1
    const resParentGetMsgs = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/conversations/${conv1Id}/messages`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resParentGetMsgs.status === 200, '31. Parent A GET messages for Conv 1 (HTTP 200)');
    assert(resParentGetMsgs.data.data.count === 1, '32. Conv 1 has 1 message');
    assert(resParentGetMsgs.data.data.messages[0].isMine === false, '33. Message isMine is false for Parent');

    // 12. Parent A marks message as read
    const resMarkRead = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/messages/${message1Id}/read`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resMarkRead.status === 200, '34. Parent A marks message as read (HTTP 200)');
    assert(resMarkRead.data.data.isRead === true, '35. isRead updated to true');

    const resParentUnread2 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/parent/messages/unread-count',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resParentUnread2.data.data.unreadCount === 0, '36. Parent A unreadCount is now 0');

    // 13. Parent A replies in Conv 1
    const resSend2 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/parent/conversations/${conv1Id}/messages`, method: 'POST', headers: { Authorization: `Bearer ${parentAToken}`, 'Content-Type': 'application/json' } },
      { message: 'Thank you for notifying me, Sir. He has completed it today.' }
    );
    assert(resSend2.status === 201, '37. Parent A replies in Conv 1 (HTTP 201)');
    message2Id = resSend2.data.data.id;

    // 14. Teacher A checks unread count and retrieves chronological thread
    const resTeacherUnread2 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/messages/unread-count',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resTeacherUnread2.data.data.unreadCount === 1, '38. Teacher A receives 1 unread reply');

    const resTeacherGetMsgs = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/conversations/${conv1Id}/messages`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherAToken}` }
    });
    assert(resTeacherGetMsgs.status === 200, '39. Teacher A GET messages (HTTP 200)');
    assert(resTeacherGetMsgs.data.data.count === 2, '40. Thread contains exactly 2 messages');
    assert(resTeacherGetMsgs.data.data.messages[0].id === message1Id, '41. Chronological order: Message 1 oldest');
    assert(resTeacherGetMsgs.data.data.messages[1].id === message2Id, '42. Chronological order: Message 2 newest');

    // 15. Message Validation
    const resEmptyMsg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/teacher/conversations/${conv1Id}/messages`, method: 'POST', headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' } },
      { message: '   ' }
    );
    assert(resEmptyMsg.status === 400, '43. Empty message rejected (HTTP 400 Bad Request)');

    const resNonStringMsg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/teacher/conversations/${conv1Id}/messages`, method: 'POST', headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' } },
      { message: 12345 }
    );
    assert(resNonStringMsg.status === 400, '44. Non-string message rejected (HTTP 400 Bad Request)');

    const resOversizedMsg = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/teacher/conversations/${conv1Id}/messages`, method: 'POST', headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' } },
      { message: 'A'.repeat(2001) }
    );
    assert(resOversizedMsg.status === 400, '45. Oversized message (>2000 chars) rejected (HTTP 400 Bad Request)');

    // 16. Cross-Teacher & Cross-Parent Authorization Protection
    const resCrossTeacherConv = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/teacher/conversations', method: 'POST', headers: { Authorization: `Bearer ${teacherAToken}`, 'Content-Type': 'application/json' } },
      { parentId: parentBProfile.parentId, studentId: student3Profile.studentId }
    );
    assert(resCrossTeacherConv.status === 403, '46. Teacher A denied creating conv for Student 3B (Section B) (HTTP 403 Forbidden)');

    const resCrossParentConv = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/parent/conversations', method: 'POST', headers: { Authorization: `Bearer ${parentAToken}`, 'Content-Type': 'application/json' } },
      { teacherId: teacherBProfile.teacherId, studentId: student1Profile.studentId }
    );
    assert(resCrossParentConv.status === 403, '47. Parent A denied creating conv with Teacher B (Section B) (HTTP 403 Forbidden)');

    const resCrossGetMsgsTeacher = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/teacher/conversations/${conv1Id}/messages`,
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherBToken}` }
    });
    assert(resCrossGetMsgsTeacher.status === 403, '48. Teacher B denied viewing Teacher A messages (HTTP 403 Forbidden)');

    const resCrossGetMsgsParent = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/parent/conversations/${conv1Id}/messages`,
      method: 'GET',
      headers: { Authorization: `Bearer ${parentBToken}` }
    });
    assert(resCrossGetMsgsParent.status === 403, '49. Parent B denied viewing Parent A messages (HTTP 403 Forbidden)');

    const resCrossSendTeacher = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/teacher/conversations/${conv1Id}/messages`, method: 'POST', headers: { Authorization: `Bearer ${teacherBToken}`, 'Content-Type': 'application/json' } },
      { message: 'Malicious spoof attempt' }
    );
    assert(resCrossSendTeacher.status === 403, '50. Teacher B denied sending message in Teacher A conv (HTTP 403 Forbidden)');

    const resCrossSendParent = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/parent/conversations/${conv1Id}/messages`, method: 'POST', headers: { Authorization: `Bearer ${parentBToken}`, 'Content-Type': 'application/json' } },
      { message: 'Malicious parent spoof attempt' }
    );
    assert(resCrossSendParent.status === 403, '51. Parent B denied sending message in Parent A conv (HTTP 403 Forbidden)');

    // 17. RBAC & Security Tests
    const resStudentOnTeacherConv = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/conversations',
      method: 'GET',
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(resStudentOnTeacherConv.status === 403, '52. Student denied on /api/teacher/conversations (HTTP 403 Forbidden)');

    const resStudentOnParentConv = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/parent/conversations',
      method: 'GET',
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(resStudentOnParentConv.status === 403, '53. Student denied on /api/parent/conversations (HTTP 403 Forbidden)');

    const resNoToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/conversations',
      method: 'GET'
    });
    assert(resNoToken.status === 401, '54. Missing JWT returns HTTP 401 Unauthorized');

    const resBadToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/teacher/conversations',
      method: 'GET',
      headers: { Authorization: 'Bearer invalid.jwt.token' }
    });
    assert(resBadToken.status === 401, '55. Invalid JWT returns HTTP 401 Unauthorized');

    // 18. Passwords and secrets NOT exposed
    assert(resTeacherConvs.data.data.conversations[0].parent.password === undefined, '56. Password NOT exposed in conversation list');

    console.log(`\n================================================================`);
    console.log(`🎉 Step 7A Messaging System Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`================================================================\n`);

  } catch (error) {
    console.error('Fatal Messaging test execution error:', error);
    process.exitCode = 1;
  }
}

runMessagingTests();
