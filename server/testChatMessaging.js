const assert = require('node:assert/strict');
const test = require('node:test');
const {
  hasTeacherClassAssignment,
  isParentLinkedToStudent,
  isTeacherAssignedToStudent,
  normalizeChatMessage
} = require('./src/utils/chatAuthorization');

const models = require('./src/models');
const socket = require('./src/socket');
const notifications = require('./src/services/notificationService');

const emittedMessages = [];
socket.emitNewMessage = (userId, payload) => emittedMessages.push({ userId, payload });
notifications.notifyForMessage = async () => {};

const teacherController = require('./src/controllers/teacherMessageController');
const parentController = require('./src/controllers/parentMessageController');

const makeResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

const mockLinkedConversation = (t, { authorizedParent = true, assignedTeacher = true } = {}) => {
  const teacher = {
    id: 10,
    userId: 100,
    className: assignedTeacher ? 'Grade 8' : '',
    section: assignedTeacher ? 'A' : ''
  };
  const parent = { id: 20, userId: 200 };
  const student = {
    id: 30,
    className: 'Grade 8',
    section: 'A',
    user: { id: 300, name: 'Student' }
  };
  const conversation = {
    id: 40,
    teacherProfileId: teacher.id,
    parentProfileId: parent.id,
    studentProfileId: student.id,
    teacherProfile: teacher,
    parentProfile: parent,
    studentProfile: student,
    save: async () => {}
  };

  t.mock.method(models.TeacherProfile, 'findOne', async () => teacher);
  t.mock.method(models.ParentProfile, 'findOne', async () => parent);
  t.mock.method(models.Conversation, 'findOne', async ({ where }) => {
    if (where.teacherProfileId && where.teacherProfileId !== teacher.id) return null;
    if (where.parentProfileId && where.parentProfileId !== parent.id) return null;
    return conversation;
  });
  t.mock.method(models.ParentStudent, 'findOne', async ({ attributes }) => {
    const row = authorizedParent
      ? { id: 1, parentProfileId: parent.id, studentProfileId: student.id }
      : { id: 2, parentProfileId: 999, studentProfileId: student.id };
    return Object.fromEntries(attributes.map((field) => [field, row[field]]));
  });
  t.mock.method(models.TutorRequest, 'findOne', async () => null);
  t.mock.method(models.Message, 'findAll', async () => []);
  return { teacher, parent, student, conversation };
};

test('class assignments authorize only matching assigned students', () => {
  const teacher = { className: 'Grade 8', section: 'A' };
  assert.equal(hasTeacherClassAssignment(teacher, { className: 'Grade 8', section: 'A' }), true);
  assert.equal(hasTeacherClassAssignment(teacher, { className: 'Grade 8', section: 'B' }), false);
  assert.equal(hasTeacherClassAssignment({}, { className: 'Grade 8', section: 'A' }), false);
  assert.equal(hasTeacherClassAssignment({ section: 'A' }, { className: 'Grade 8', section: 'A' }), false);
});

test('accepted tutoring relationships authorize the specific student only', async () => {
  const teacher = { userId: 12, className: '', section: '' };
  const student = { id: 45, className: 'Grade 8', section: 'B' };
  let query;
  const TutorRequest = {
    findOne: async ({ where }) => {
      query = where;
      return where.studentProfileId === student.id && where.status === 'accepted' ? { id: 1 } : null;
    }
  };

  assert.equal(await isTeacherAssignedToStudent(teacher, student, TutorRequest), true);
  assert.deepEqual(query, { tutorUserId: 12, studentProfileId: 45, status: 'accepted' });
  assert.equal(await isTeacherAssignedToStudent(teacher, { ...student, id: 99 }, TutorRequest), false);
});

test('parent-student relationship requires the exact linked profiles', () => {
  const link = { parentProfileId: 2, studentProfileId: 45 };
  assert.equal(isParentLinkedToStudent(2, 45, link), true);
  assert.equal(isParentLinkedToStudent(3, 45, link), false);
  assert.equal(isParentLinkedToStudent(2, 99, link), false);
  assert.equal(isParentLinkedToStudent(2, 45, null), false);
});

test('missing, whitespace-only, and oversized messages are rejected', () => {
  assert.equal(normalizeChatMessage(undefined).valid, false);
  assert.equal(normalizeChatMessage('   ').valid, false);
  assert.equal(normalizeChatMessage('x'.repeat(2001)).valid, false);
  assert.deepEqual(normalizeChatMessage('  Hello  '), { valid: true, text: 'Hello' });
});

test('teacher message route rejects an empty message without writing', async (t) => {
  const teacher = { id: 10, userId: 10, className: 'Grade 8', section: 'A' };
  t.mock.method(models.TeacherProfile, 'findOne', async () => teacher);
  const createSpy = t.mock.method(models.Message, 'create', async () => {
    throw new Error('Message must not be written');
  });
  const res = makeResponse();

  await teacherController.sendMessage({
    user: { id: 10 },
    params: { conversationId: '20' },
    body: { message: '  ' }
  }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Message text is required and cannot be empty');
  assert.equal(createSpy.mock.callCount(), 0);
});

test('teacher cannot send to a conversation not owned by their profile', async (t) => {
  const teacher = { id: 10, userId: 10, className: 'Grade 8', section: 'A' };
  t.mock.method(models.TeacherProfile, 'findOne', async () => teacher);
  t.mock.method(models.Conversation, 'findOne', async () => null);
  const createSpy = t.mock.method(models.Message, 'create', async () => {
    throw new Error('Unauthorized message must not be written');
  });
  const res = makeResponse();

  await teacherController.sendMessage({
    user: { id: 10 },
    params: { conversationId: '20' },
    body: { message: 'Unauthorized message' }
  }, res);

  assert.equal(res.statusCode, 403);
  assert.equal(createSpy.mock.callCount(), 0);
});

test('authorized teacher messages are persisted and delivered to the linked parent', async (t) => {
  const teacher = { id: 10, userId: 10, className: 'Grade 8', section: 'A' };
  const conversation = {
    id: 20,
    teacherProfileId: 10,
    parentProfileId: 2,
    studentProfileId: 45,
    parentProfile: { userId: 20 },
    studentProfile: { id: 45, className: 'Grade 8', section: 'A' },
    save: async () => {}
  };
  const transaction = {
    finished: false,
    async commit() {
      this.finished = 'commit';
    },
    async rollback() {
      this.finished = 'rollback';
    }
  };
  const savedMessage = {
    id: 30,
    conversationId: 20,
    message: 'Hello parent',
    isRead: false,
    readAt: null,
    createdAt: new Date('2026-10-22T09:00:00Z')
  };

  t.mock.method(models.TeacherProfile, 'findOne', async () => teacher);
  t.mock.method(models.Conversation, 'findOne', async () => conversation);
  t.mock.method(models.ParentStudent, 'findOne', async () => ({
    parentProfileId: 2,
    studentProfileId: 45
  }));
  t.mock.method(models.sequelize, 'transaction', async () => transaction);
  const createSpy = t.mock.method(models.Message, 'create', async (data, options) => {
    assert.equal(data.senderUserId, 10);
    assert.equal(data.message, 'Hello parent');
    assert.equal(options.transaction, transaction);
    return savedMessage;
  });
  t.mock.method(models.User, 'findByPk', async () => ({ id: 10, name: 'Teacher', role: 'teacher' }));
  emittedMessages.length = 0;
  const res = makeResponse();

  await teacherController.sendMessage({
    user: { id: 10 },
    params: { conversationId: '20' },
    body: { message: ' Hello parent ' }
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.data.id, 30);
  assert.equal(res.body.data.isMine, true);
  assert.equal(transaction.finished, 'commit');
  assert.equal(createSpy.mock.callCount(), 1);
  assert.equal(emittedMessages.length, 1);
  assert.equal(emittedMessages[0].userId, 20);
  assert.equal(emittedMessages[0].payload.conversationId, 20);
});

test('teacher and linked parent can open history when Sequelize projects the relationship fields', async (t) => {
  mockLinkedConversation(t);
  const parentRes = makeResponse();
  await parentController.getMessages({
    user: { id: 200 },
    params: { conversationId: '40' }
  }, parentRes);

  const teacherRes = makeResponse();
  await teacherController.getMessages({
    user: { id: 100 },
    params: { conversationId: '40' }
  }, teacherRes);

  assert.equal(parentRes.statusCode, 200);
  assert.equal(teacherRes.statusCode, 200);
});

test('unrelated parent and unassigned teacher are denied conversation history', async (t) => {
  mockLinkedConversation(t, { authorizedParent: false });
  const parentRes = makeResponse();
  await parentController.getMessages({
    user: { id: 200 },
    params: { conversationId: '40' }
  }, parentRes);
  assert.equal(parentRes.statusCode, 403);

  t.mock.method(models.ParentStudent, 'findOne', async ({ attributes }) => {
    const row = { id: 1, parentProfileId: 20, studentProfileId: 30 };
    return Object.fromEntries(attributes.map((field) => [field, row[field]]));
  });
  t.mock.method(models.TeacherProfile, 'findOne', async () => ({
    id: 10,
    userId: 100,
    className: '',
    section: ''
  }));
  const teacherRes = makeResponse();
  await teacherController.getMessages({
    user: { id: 100 },
    params: { conversationId: '40' }
  }, teacherRes);
  assert.equal(teacherRes.statusCode, 403);
});

test('parent can mark an incoming message read in an authorized conversation', async (t) => {
  mockLinkedConversation(t);
  const message = {
    id: 50,
    conversationId: 40,
    senderUserId: 100,
    isRead: false,
    readAt: null,
    async save() {}
  };
  t.mock.method(models.Message, 'findByPk', async () => message);
  const res = makeResponse();

  await parentController.markMessageRead({
    user: { id: 200 },
    params: { messageId: '50' }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.isRead, true);
});

test('authorized parent and teacher unread counts include only verified conversations', async (t) => {
  mockLinkedConversation(t);
  t.mock.method(models.Conversation, 'findAll', async () => [{ id: 40 }]);
  t.mock.method(models.Message, 'count', async ({ where }) => {
    assert.deepEqual(where.conversationId, { [require('sequelize').Op.in]: [40] });
    return 1;
  });

  const parentRes = makeResponse();
  await parentController.getUnreadCount({ user: { id: 200 } }, parentRes);
  const teacherRes = makeResponse();
  await teacherController.getUnreadCount({ user: { id: 100 } }, teacherRes);

  assert.equal(parentRes.statusCode, 200);
  assert.equal(parentRes.body.data.unreadCount, 1);
  assert.equal(teacherRes.statusCode, 200);
  assert.equal(teacherRes.body.data.unreadCount, 1);
});

test('parent can send an authorized reply and it is delivered to the teacher', async (t) => {
  const { conversation } = mockLinkedConversation(t);
  const transaction = {
    finished: false,
    async commit() {
      this.finished = 'commit';
    },
    async rollback() {
      this.finished = 'rollback';
    }
  };
  const savedMessage = {
    id: 51,
    conversationId: 40,
    message: 'Parent reply',
    isRead: false,
    readAt: null,
    createdAt: new Date('2026-10-22T09:05:00Z')
  };
  t.mock.method(models.sequelize, 'transaction', async () => transaction);
  t.mock.method(models.Message, 'create', async (data, options) => {
    assert.equal(data.senderUserId, 200);
    assert.equal(data.message, 'Parent reply');
    assert.equal(options.transaction, transaction);
    return savedMessage;
  });
  t.mock.method(models.User, 'findByPk', async () => ({ id: 200, name: 'Parent', role: 'parent' }));
  emittedMessages.length = 0;
  const res = makeResponse();

  await parentController.sendMessage({
    user: { id: 200 },
    params: { conversationId: '40' },
    body: { message: 'Parent reply' }
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(transaction.finished, 'commit');
  assert.equal(emittedMessages.length, 1);
  assert.equal(emittedMessages[0].userId, conversation.teacherProfile.userId);
});

test('parent cannot start a conversation for an unrelated student', async (t) => {
  t.mock.method(models.ParentProfile, 'findOne', async () => ({ id: 2, userId: 20 }));
  t.mock.method(models.StudentProfile, 'findOne', async () => ({ id: 45, studentId: 'STU45' }));
  t.mock.method(models.ParentStudent, 'findOne', async () => null);
  const conversationSpy = t.mock.method(models.Conversation, 'findOrCreate', async () => {
    throw new Error('Unauthorized conversation must not be created');
  });
  const res = makeResponse();

  await parentController.createConversation({
    user: { id: 20 },
    body: { teacherId: 10, studentId: 45 }
  }, res);

  assert.equal(res.statusCode, 403);
  assert.equal(conversationSpy.mock.callCount(), 0);
});

test('real-time delivery targets only the designated authenticated user room', () => {
  const events = [];
  const fakeIO = {
    to(room) {
      return {
        emit(event, payload) {
          events.push({ room, event, payload });
        }
      };
    }
  };

  assert.equal(socket.emitNewMessageToIO(fakeIO, 20, { conversationId: 7, message: 'Hello' }), true);
  assert.deepEqual(events, [{
    room: 'user_20',
    event: 'message:new',
    payload: { conversationId: 7, message: 'Hello' }
  }]);
  assert.equal(socket.emitNewMessageToIO(fakeIO, null, {}), false);
});
