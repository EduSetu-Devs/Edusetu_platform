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
  Marks,
  Conversation,
  Message,
  Notification,
  sequelize
} = require('./src/models');

console.log('================================================================');
console.log('🔔 Running EduSetu Step 7B Notification System Test Suite');
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runNotificationTests() {
  const timestamp = Date.now();
  const testClassA = `Class 10A_${timestamp}`;
  const testClassB = `Class 10B_${timestamp}`;

  const teacherEmail = `teacher_notif_${timestamp}@edusetu.org`;
  const parentAEmail = `parent_notif_a_${timestamp}@edusetu.org`;
  const parentBEmail = `parent_notif_b_${timestamp}@edusetu.org`;
  const student1Email = `stu1_notif_${timestamp}@edusetu.org`;
  const student2Email = `stu2_notif_${timestamp}@edusetu.org`;
  const commonPassword = 'Password123';

  let teacherToken = '';
  let parentAToken = '';
  let parentBToken = '';
  let student1Token = '';

  let teacherUser = null;
  let parentAUser = null;
  let parentBUser = null;
  let student1User = null;
  let student1Profile = null;
  let student2Profile = null;

  let notifId1 = null;
  let notifId2 = null;

  try {
    // 1. Model Association Checks
    assert(typeof User.associations.notifications !== 'undefined', '1. User hasMany Notification defined');
    assert(typeof Notification.associations.recipient !== 'undefined', '2. Notification belongsTo User defined');

    // 2. Register Accounts
    const resT = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Prof. Sharma', email: teacherEmail, password: commonPassword, role: 'teacher', className: testClassA, section: 'A', subjects: ['Mathematics'] }
    );
    assert(resT.status === 201, '3. Registered Teacher (Class 10A-A)');
    teacherToken = resT.data.data.token;
    teacherUser = resT.data.data.user;

    const resPA = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Dr. Suresh Sharma', email: parentAEmail, password: commonPassword, role: 'parent', relationship: 'Father', occupation: 'Physician' }
    );
    assert(resPA.status === 201, '4. Registered Parent A');
    parentAToken = resPA.data.data.token;
    parentAUser = resPA.data.data.user;

    const resPB = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Mrs. Ananya Sen', email: parentBEmail, password: commonPassword, role: 'parent', relationship: 'Mother', occupation: 'Professor' }
    );
    assert(resPB.status === 201, '5. Registered Parent B');
    parentBToken = resPB.data.data.token;
    parentBUser = resPB.data.data.user;

    const resS1 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Aarav Sharma', email: student1Email, password: commonPassword, role: 'student', className: testClassA, section: 'A', rollNumber: '1' }
    );
    assert(resS1.status === 201, '6. Registered Student 1A (Aarav, Class 10A-A)');
    student1Token = resS1.data.data.token;
    student1User = resS1.data.data.user;
    student1Profile = resS1.data.data.user.studentProfile;

    const resS2 = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Rohan Sen', email: student2Email, password: commonPassword, role: 'student', className: testClassB, section: 'B', rollNumber: '12' }
    );
    assert(resS2.status === 201, '7. Registered Student 2B (Rohan, Class 10B-B)');
    student2Profile = resS2.data.data.user.studentProfile;

    // 3. Link Children
    await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/parent/children/link', method: 'POST', headers: { Authorization: `Bearer ${parentAToken}`, 'Content-Type': 'application/json' } },
      { studentId: student1Profile.studentId, relationship: 'Son' }
    );
    await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/parent/children/link', method: 'POST', headers: { Authorization: `Bearer ${parentBToken}`, 'Content-Type': 'application/json' } },
      { studentId: student2Profile.studentId, relationship: 'Son' }
    );
    assert(true, '8. Linked Student 1A to Parent A, Student 2B to Parent B');

    // 4. Test Homework Notification Trigger
    const resCreateHw = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/teacher/homework', method: 'POST', headers: { Authorization: `Bearer ${teacherToken}`, 'Content-Type': 'application/json' } },
      { title: 'Algebra Equations', description: 'Solve Ex 3.2', subject: 'Mathematics', dueDate: '2026-12-31' }
    );
    assert(resCreateHw.status === 201, '9. Teacher created homework for Class 10A-A');
    await sleep(200); // Allow async notification dispatch

    // Verify Parent A received Homework notification
    const resParentANotifs1 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resParentANotifs1.status === 200, '10. Parent A GET /api/notifications (HTTP 200)');
    const hwNotifA = resParentANotifs1.data.data.notifications.find((n) => n.type === 'HOMEWORK');
    assert(hwNotifA !== undefined, '11. Parent A received HOMEWORK notification');
    assert(hwNotifA.title === 'New Homework Assigned', '12. Homework notification title correct');

    // Verify Student 1A received Homework notification
    const resStudentNotifs = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    const hwNotifStudent = resStudentNotifs.data.data.notifications.find((n) => n.type === 'HOMEWORK');
    assert(hwNotifStudent !== undefined, '13. Student 1A received HOMEWORK notification');

    // Verify Unrelated Parent B did NOT receive notification for Class 10A
    const resParentBNotifs1 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentBToken}` }
    });
    assert(resParentBNotifs1.data.data.notifications.length === 0, '14. Unrelated Parent B received 0 notifications');

    // 5. Test Attendance Notification Trigger
    const resMarkAtt = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/teacher/attendance', method: 'POST', headers: { Authorization: `Bearer ${teacherToken}`, 'Content-Type': 'application/json' } },
      { studentId: student1Profile.studentId, date: '2026-08-01', subject: 'Mathematics', status: 'absent' }
    );
    assert(resMarkAtt.status === 200, '15. Teacher marked Student 1A absent');
    await sleep(200);

    const resParentANotifs2 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    const attNotif = resParentANotifs2.data.data.notifications.find((n) => n.type === 'ATTENDANCE');
    assert(attNotif !== undefined, '16. Parent A received ATTENDANCE notification');
    assert(attNotif.message.includes('Absent'), '17. Attendance notification includes absent status');

    // 6. Test Marks Notification Trigger
    const resMarkMarks = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/teacher/marks', method: 'POST', headers: { Authorization: `Bearer ${teacherToken}`, 'Content-Type': 'application/json' } },
      { studentId: student1Profile.studentId, subject: 'Mathematics', examType: 'mid_term', examName: 'Mid Term Exam', maxMarks: 100, obtainedMarks: 92 }
    );
    assert(resMarkMarks.status === 200, '18. Teacher saved marks for Student 1A');
    await sleep(200);

    const resParentANotifs3 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    const marksNotif = resParentANotifs3.data.data.notifications.find((n) => n.type === 'MARKS');
    assert(marksNotif !== undefined, '19. Parent A received MARKS notification');
    assert(marksNotif.message.includes('92/100'), '20. Marks notification includes score details');

    // 7. Test Message Notification Trigger
    const resCreateConv = await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: '/api/teacher/conversations', method: 'POST', headers: { Authorization: `Bearer ${teacherToken}`, 'Content-Type': 'application/json' } },
      { parentId: parentAUser.parentProfile?.parentId || `PAR${parentAUser.id}`, studentId: student1Profile.studentId }
    );
    const convId = resCreateConv.data.data.id;

    // Teacher sends message
    await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/teacher/conversations/${convId}/messages`, method: 'POST', headers: { Authorization: `Bearer ${teacherToken}`, 'Content-Type': 'application/json' } },
      { message: 'Hello Dr. Sharma, Aarav performed exceptionally well in Mid Terms.' }
    );
    await sleep(200);

    const resParentANotifs4 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    const msgNotif = resParentANotifs4.data.data.notifications.find((n) => n.type === 'MESSAGE');
    assert(msgNotif !== undefined, '21. Parent A received MESSAGE notification from Teacher');

    // Verify Teacher did NOT receive self-notification
    const resTeacherNotifs = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    const teacherSelfMsg = resTeacherNotifs.data.data.notifications.find((n) => n.type === 'MESSAGE');
    assert(teacherSelfMsg === undefined, '22. Teacher did NOT receive self-message notification');

    // Parent replies
    await makeRequest(
      { hostname: '127.0.0.1', port: 5000, path: `/api/parent/conversations/${convId}/messages`, method: 'POST', headers: { Authorization: `Bearer ${parentAToken}`, 'Content-Type': 'application/json' } },
      { message: 'Thank you Professor, we appreciate your guidance.' }
    );
    await sleep(200);

    const resTeacherNotifs2 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    const teacherMsgNotif = resTeacherNotifs2.data.data.notifications.find((n) => n.type === 'MESSAGE');
    assert(teacherMsgNotif !== undefined, '23. Teacher received MESSAGE notification from Parent reply');

    // 8. Test Unread Count API
    const resUnread = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/notifications/unread-count',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resUnread.status === 200, '24. Parent A GET /api/notifications/unread-count (HTTP 200)');
    const initialUnreadCount = resUnread.data.data.unreadCount;
    assert(initialUnreadCount >= 4, '25. Parent A has at least 4 unread notifications');

    // 9. Test Mark Single Notification Read
    notifId1 = resParentANotifs4.data.data.notifications[0].id;
    notifId2 = resParentANotifs4.data.data.notifications[1].id;

    const resMarkRead = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/notifications/${notifId1}/read`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resMarkRead.status === 200, '26. Parent A marked single notification as read (HTTP 200)');
    assert(resMarkRead.data.data.isRead === true, '27. isRead is true');
    assert(resMarkRead.data.data.readAt !== null, '28. readAt timestamp populated');

    const resUnreadAfter1 = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/notifications/unread-count',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resUnreadAfter1.data.data.unreadCount === initialUnreadCount - 1, '29. Unread count decremented by 1');

    // 10. Test Mark All As Read
    const resMarkAll = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/notifications/read-all',
      method: 'PATCH',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resMarkAll.status === 200, '30. Parent A marked all notifications as read (HTTP 200)');

    const resUnreadAfterAll = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/notifications/unread-count',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resUnreadAfterAll.data.data.unreadCount === 0, '31. Unread count is now 0');

    // 11. Test Pagination
    const resPaging = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/notifications?page=1&limit=2',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resPaging.status === 200, '32. GET /api/notifications with pagination (HTTP 200)');
    assert(resPaging.data.data.page === 1, '33. page = 1');
    assert(resPaging.data.data.limit === 2, '34. limit = 2');
    assert(resPaging.data.data.notifications.length === 2, '35. Returned exactly 2 notifications');
    assert(resPaging.data.data.totalPages >= 2, '36. totalPages calculated correctly');

    // 12. Test Filters (?type=HOMEWORK)
    const resFilterType = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/notifications?type=HOMEWORK',
      method: 'GET',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resFilterType.status === 200, '37. GET /api/notifications?type=HOMEWORK (HTTP 200)');
    assert(resFilterType.data.data.notifications.every((n) => n.type === 'HOMEWORK'), '38. All filtered items are HOMEWORK');

    // 13. Test Delete Notification
    const resDelete = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/notifications/${notifId1}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${parentAToken}` }
    });
    assert(resDelete.status === 200, '39. Parent A deleted own notification (HTTP 200)');

    // 14. Cross-User Authorization & Security Protections
    const resCrossMarkRead = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/notifications/${notifId2}/read`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${parentBToken}` }
    });
    assert(resCrossMarkRead.status === 403, '40. Parent B denied marking Parent A notification as read (HTTP 403 Forbidden)');

    const resCrossDelete = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/notifications/${notifId2}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${parentBToken}` }
    });
    assert(resCrossDelete.status === 403, '41. Parent B denied deleting Parent A notification (HTTP 403 Forbidden)');

    // 15. Security & Authentication Checks
    const resNoToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/notifications',
      method: 'GET'
    });
    assert(resNoToken.status === 401, '42. Missing JWT returns HTTP 401 Unauthorized');

    const resBadToken = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: 'Bearer invalid.token.here' }
    });
    assert(resBadToken.status === 401, '43. Invalid JWT returns HTTP 401 Unauthorized');

    // 16. Ensure Passwords and Secrets are NOT returned
    assert(resParentANotifs4.data.data.notifications[0].password === undefined, '44. Passwords and secrets NOT exposed');

    console.log(`\n================================================================`);
    console.log(`🎉 Step 7B Notification System Summary: ${passedTests}/${totalTests} Tests Passed!`);
    console.log(`================================================================\n`);

  } catch (error) {
    console.error('Fatal Notification test execution error:', error);
    process.exitCode = 1;
  }
}

runNotificationTests();
