const { Op } = require('sequelize');
const {
  User,
  TeacherProfile,
  ParentProfile,
  StudentProfile,
  ParentStudent,
  Conversation,
  Message,
  TutorRequest,
  sequelize
} = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { notifyForMessage } = require('../services/notificationService');
const { emitNewMessage } = require('../socket');
const {
  isTeacherAssignedToStudent,
  isParentLinkedToStudent,
  normalizeChatMessage
} = require('../utils/chatAuthorization');

/**
 * Helper to get teacher profile from authenticated user
 */
const getTeacherProfileForUser = async (userId) => {
  return TeacherProfile.findOne({ where: { userId } });
};

/**
 * Helper to verify teacher can access conversation
 */
const verifyTeacherConversation = async (teacherProfile, conversationId) => {
  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      teacherProfileId: teacherProfile.id
    },
    include: [
      {
        model: ParentProfile,
        as: 'parentProfile',
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }]
      },
      {
        model: StudentProfile,
        as: 'studentProfile',
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
      }
    ]
  });

  if (!conversation) return null;
  const [parentStudentLink, teacherAssigned] = await Promise.all([
    ParentStudent.findOne({
      where: {
        parentProfileId: conversation.parentProfileId,
        studentProfileId: conversation.studentProfileId
      },
      attributes: ['id', 'parentProfileId', 'studentProfileId']
    }),
    isTeacherAssignedToStudent(teacherProfile, conversation.studentProfile, TutorRequest)
  ]);
  return isParentLinkedToStudent(
    conversation.parentProfileId,
    conversation.studentProfileId,
    parentStudentLink
  ) && teacherAssigned ? conversation : null;
};

/**
 * List all conversations for authenticated teacher
 * @route GET /api/teacher/conversations
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);
    if (!teacherProfile) return errorResponse(res, 404, 'Teacher profile not found');

    const listedConversations = await Conversation.findAll({
      where: { teacherProfileId: teacherProfile.id },
      include: [
        {
          model: ParentProfile,
          as: 'parentProfile',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }]
        },
        {
          model: StudentProfile,
          as: 'studentProfile',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
        }
      ],
      order: [
        ['lastMessageAt', 'DESC'],
        ['updatedAt', 'DESC']
      ]
    });
    const conversations = [];
    for (const conversation of listedConversations) {
      if (await verifyTeacherConversation(teacherProfile, conversation.id)) conversations.push(conversation);
    }

    const conversationIds = conversations.map((c) => c.id);

    // Calculate unread count per conversation for this teacher (messages from parent not read)
    const unreadMessages = await Message.findAll({
      where: {
        conversationId: { [Op.in]: conversationIds.length > 0 ? conversationIds : [0] },
        senderUserId: { [Op.ne]: userId },
        isRead: false
      },
      attributes: ['conversationId']
    });

    const unreadCountMap = new Map();
    unreadMessages.forEach((m) => {
      const cur = unreadCountMap.get(m.conversationId) || 0;
      unreadCountMap.set(m.conversationId, cur + 1);
    });

    const formattedList = conversations.map((c) => ({
      id: c.id,
      parent: {
        id: c.parentProfile?.id,
        parentId: c.parentProfile?.parentId,
        name: c.parentProfile?.user?.name || 'Parent',
        email: c.parentProfile?.user?.email || '',
        phone: c.parentProfile?.phone || c.parentProfile?.user?.phone || '',
        relationship: c.parentProfile?.relationship || 'Parent'
      },
      student: {
        id: c.studentProfile?.id,
        studentId: c.studentProfile?.studentId,
        name: c.studentProfile?.user?.name || 'Student',
        className: c.studentProfile?.className || '',
        section: c.studentProfile?.section || '',
        rollNumber: c.studentProfile?.rollNumber || ''
      },
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      unreadCount: unreadCountMap.get(c.id) || 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

    return successResponse(res, 200, 'Teacher conversations retrieved successfully', {
      count: formattedList.length,
      conversations: formattedList
    });

  } catch (error) {
    console.error('[Get Teacher Conversations Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve conversations');
  }
};

const getMessageContacts = async (req, res) => {
  try {
    const teacher = await getTeacherProfileForUser(req.user.id);
    if (!teacher) return errorResponse(res, 404, 'Teacher profile not found');

    const students = await StudentProfile.findAll({
      include: [
        { model: User, as: 'user', where: { isActive: true }, attributes: ['id', 'name'] },
        {
          model: ParentProfile,
          as: 'parents',
          through: { attributes: [] },
          include: [{ model: User, as: 'user', where: { isActive: true }, attributes: ['id', 'name'] }]
        }
      ],
      order: [['studentId', 'ASC']]
    });

    const contacts = [];
    for (const student of students) {
      if (!(await isTeacherAssignedToStudent(teacher, student, TutorRequest))) continue;
      for (const parent of student.parents || []) {
        contacts.push({
          parent: {
            id: parent.id,
            parentId: parent.parentId,
            name: parent.user?.name || 'Parent',
            relationship: parent.relationship || 'Parent'
          },
          student: {
            id: student.id,
            studentId: student.studentId,
            name: student.user?.name || 'Student',
            className: student.className || '',
            section: student.section || ''
          }
        });
      }
    }

    return successResponse(res, 200, 'Authorized messaging contacts retrieved', { contacts });
  } catch (error) {
    console.error('[Get Teacher Message Contacts Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve messaging contacts');
  }
};

/**
 * Create or retrieve existing conversation with a Parent regarding a Student
 * @route POST /api/teacher/conversations
 */
const createConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { parentId, studentId } = req.body;
    const teacherProfile = await getTeacherProfileForUser(userId);
    if (!teacherProfile) return errorResponse(res, 404, 'Teacher profile not found');

    if (!parentId) {
      return errorResponse(res, 400, 'Parent ID is required to start a conversation');
    }
    if (!studentId) {
      return errorResponse(res, 400, 'Student ID is required to start a conversation');
    }

    // 1. Resolve Student Profile
    const isNumStudent = !isNaN(Number(studentId));
    const studentWhere = isNumStudent
      ? { [Op.or]: [{ id: Number(studentId) }, { studentId: String(studentId) }] }
      : { studentId: String(studentId) };

    const student = await StudentProfile.findOne({
      where: studentWhere,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    if (!student) {
      return errorResponse(res, 404, 'Student profile not found');
    }

    if (!(await isTeacherAssignedToStudent(teacherProfile, student, TutorRequest))) {
      return errorResponse(res, 403, 'Access denied. Student is not assigned to this teacher.');
    }

    // 3. Resolve Parent Profile
    const isNumParent = !isNaN(Number(parentId));
    const parentWhere = isNumParent
      ? { [Op.or]: [{ id: Number(parentId) }, { parentId: String(parentId) }] }
      : { parentId: String(parentId) };

    const parent = await ParentProfile.findOne({
      where: parentWhere,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }]
    });

    if (!parent) {
      return errorResponse(res, 404, 'Parent profile not found');
    }

    // 4. Verify Parent is linked to this Student
    const parentStudentLink = await ParentStudent.findOne({
      where: {
        parentProfileId: parent.id,
        studentProfileId: student.id
      }
    });

    if (!isParentLinkedToStudent(parent.id, student.id, parentStudentLink)) {
      return errorResponse(res, 403, 'Access denied. Parent is not associated with this student.');
    }

    // 5. Find or Create Conversation
    const [conversation, created] = await Conversation.findOrCreate({
      where: {
        teacherProfileId: teacherProfile.id,
        parentProfileId: parent.id,
        studentProfileId: student.id
      },
      defaults: {
        teacherProfileId: teacherProfile.id,
        parentProfileId: parent.id,
        studentProfileId: student.id
      }
    });

    return successResponse(res, created ? 201 : 200, created ? 'Conversation created successfully' : 'Existing conversation retrieved', {
      id: conversation.id,
      parent: {
        id: parent.id,
        parentId: parent.parentId,
        name: parent.user?.name || 'Parent',
        email: parent.user?.email || '',
        relationship: parent.relationship
      },
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.user?.name || 'Student',
        className: student.className,
        section: student.section
      },
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt
    });

  } catch (error) {
    console.error('[Create Teacher Conversation Error]:', error.message);
    return errorResponse(res, 500, 'Failed to initialize conversation');
  }
};

/**
 * Get Messages for a Conversation (Chronological order)
 * @route GET /api/teacher/conversations/:conversationId/messages
 */
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const teacherProfile = await getTeacherProfileForUser(userId);
    if (!teacherProfile) return errorResponse(res, 404, 'Teacher profile not found');

    const conversation = await verifyTeacherConversation(teacherProfile, conversationId);
    if (!conversation) {
      return errorResponse(res, 403, 'Access denied. You are not authorized to view this conversation.');
    }

    const messages = await Message.findAll({
      where: { conversationId },
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }],
      order: [['createdAt', 'ASC']]
    });

    const formattedMessages = messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      message: m.message,
      isRead: m.isRead,
      readAt: m.readAt,
      isMine: m.senderUserId === userId,
      sender: {
        id: m.sender?.id,
        name: m.sender?.name,
        role: m.sender?.role
      },
      createdAt: m.createdAt
    }));

    return successResponse(res, 200, 'Messages retrieved successfully', {
      conversation: {
        id: conversation.id,
        parent: {
          id: conversation.parentProfile?.id,
          parentId: conversation.parentProfile?.parentId,
          name: conversation.parentProfile?.user?.name,
          relationship: conversation.parentProfile?.relationship
        },
        student: {
          id: conversation.studentProfile?.id,
          studentId: conversation.studentProfile?.studentId,
          name: conversation.studentProfile?.user?.name,
          className: conversation.studentProfile?.className,
          section: conversation.studentProfile?.section
        }
      },
      count: formattedMessages.length,
      messages: formattedMessages
    });

  } catch (error) {
    console.error('[Get Teacher Messages Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve messages');
  }
};

/**
 * Send Message as Teacher
 * @route POST /api/teacher/conversations/:conversationId/messages
 */
const sendMessage = async (req, res) => {
  let transaction;
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { message } = req.body;
    const teacherProfile = await getTeacherProfileForUser(userId);
    if (!teacherProfile) return errorResponse(res, 404, 'Teacher profile not found');

    const normalized = normalizeChatMessage(message);
    if (!normalized.valid) return errorResponse(res, 400, normalized.error);
    const cleanMessage = normalized.text;

    // 2. Verify Conversation Ownership
    const conversation = await verifyTeacherConversation(teacherProfile, conversationId);
    if (!conversation) {
      return errorResponse(res, 403, 'Access denied. You are not authorized to send messages in this conversation.');
    }

    // 3. Create Message and Update Conversation
    transaction = await sequelize.transaction();
    const newMessage = await Message.create({
      conversationId: Number(conversationId),
      senderUserId: userId,
      message: cleanMessage,
      isRead: false
    }, { transaction });

    conversation.lastMessage = cleanMessage;
    conversation.lastMessageAt = new Date();
    await conversation.save({ transaction });
    await transaction.commit();

    const sender = await User.findByPk(userId, { attributes: ['id', 'name', 'role'] });

    const messagePayload = {
      id: newMessage.id,
      conversationId: newMessage.conversationId,
      message: newMessage.message,
      isRead: newMessage.isRead,
      readAt: newMessage.readAt,
      sender: {
        id: sender.id,
        name: sender.name,
        role: sender.role
      },
      createdAt: newMessage.createdAt
    };

    // Emit real-time WebSocket message to parent
    const parentUserId = conversation.parentProfile?.userId;
    if (parentUserId) {
      emitNewMessage(parentUserId, messagePayload);
    }
    emitNewMessage(userId, { ...messagePayload, isMine: true });

    // Notify parent asynchronously
    notifyForMessage(newMessage, conversation, sender).catch((err) =>
      console.error('[Notification Error on sendMessage teacher]:', err.message)
    );

    return successResponse(res, 201, 'Message sent successfully', {
      ...messagePayload,
      isMine: true
    });

  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    console.error('[Send Teacher Message Error]:', error.message);
    return errorResponse(res, 500, 'Failed to send message');
  }
};

/**
 * Mark Message as Read by Teacher
 * @route PATCH /api/teacher/messages/:messageId/read
 */
const markMessageRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const teacherProfile = await getTeacherProfileForUser(userId);
    if (!teacherProfile) return errorResponse(res, 404, 'Teacher profile not found');

    const message = await Message.findByPk(messageId);

    if (!message) {
      return errorResponse(res, 404, 'Message not found');
    }

    if (!(await verifyTeacherConversation(teacherProfile, message.conversationId))) {
      return errorResponse(res, 403, 'Access denied. You are not authorized to update this message.');
    }

    if (!message.isRead && message.senderUserId !== userId) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    return successResponse(res, 200, 'Message marked as read', {
      id: message.id,
      isRead: message.isRead,
      readAt: message.readAt
    });

  } catch (error) {
    console.error('[Mark Message Read Teacher Error]:', error.message);
    return errorResponse(res, 500, 'Failed to update message status');
  }
};

/**
 * Get Total Unread Message Count for Authenticated Teacher
 * @route GET /api/teacher/messages/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);
    if (!teacherProfile) return errorResponse(res, 404, 'Teacher profile not found');

    const listedConversations = await Conversation.findAll({
      where: { teacherProfileId: teacherProfile.id },
      attributes: ['id']
    });
    const conversations = [];
    for (const conversation of listedConversations) {
      if (await verifyTeacherConversation(teacherProfile, conversation.id)) conversations.push(conversation);
    }

    const conversationIds = conversations.map((c) => c.id);

    const count = await Message.count({
      where: {
        conversationId: { [Op.in]: conversationIds.length > 0 ? conversationIds : [0] },
        senderUserId: { [Op.ne]: userId },
        isRead: false
      }
    });

    return successResponse(res, 200, 'Unread message count retrieved', {
      unreadCount: count
    });

  } catch (error) {
    console.error('[Get Unread Count Teacher Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve unread message count');
  }
};

module.exports = {
  getConversations,
  getMessageContacts,
  createConversation,
  getMessages,
  sendMessage,
  markMessageRead,
  getUnreadCount
};
