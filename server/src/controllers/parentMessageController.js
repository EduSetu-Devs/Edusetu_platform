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
 * Helper to get parent profile from authenticated user
 */
const getParentProfileForUser = async (userId) => {
  return ParentProfile.findOne({ where: { userId } });
};

/**
 * Helper to verify parent can access conversation
 */
const verifyParentConversation = async (parentProfileId, conversationId) => {
  const conversation = await Conversation.findOne({
    where: {
      id: conversationId,
      parentProfileId
    },
    include: [
      {
        model: TeacherProfile,
        as: 'teacherProfile',
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
  const parentStudentLink = await ParentStudent.findOne({
    where: {
      parentProfileId: parentProfileId,
      studentProfileId: conversation.studentProfileId
    },
    attributes: ['id', 'parentProfileId', 'studentProfileId']
  });
  const teacherAssigned = await isTeacherAssignedToStudent(
    conversation.teacherProfile,
    conversation.studentProfile,
    TutorRequest
  );
  return isParentLinkedToStudent(
    parentProfileId,
    conversation.studentProfileId,
    parentStudentLink
  ) && teacherAssigned ? conversation : null;
};

/**
 * List all conversations for authenticated parent
 * @route GET /api/parent/conversations
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const parentProfile = await getParentProfileForUser(userId);
    if (!parentProfile) return errorResponse(res, 404, 'Parent profile not found');

    const listedConversations = await Conversation.findAll({
      where: { parentProfileId: parentProfile.id },
      include: [
        {
          model: TeacherProfile,
          as: 'teacherProfile',
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
      if (await verifyParentConversation(parentProfile.id, conversation.id)) conversations.push(conversation);
    }

    const conversationIds = conversations.map((c) => c.id);

    // Calculate unread count per conversation for parent (messages from teacher not read)
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
      teacher: {
        id: c.teacherProfile?.id,
        teacherId: c.teacherProfile?.teacherId,
        name: c.teacherProfile?.user?.name || 'Teacher',
        email: c.teacherProfile?.user?.email || '',
        phone: c.teacherProfile?.user?.phone || '',
        department: c.teacherProfile?.department || '',
        designation: c.teacherProfile?.designation || 'Instructor'
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

    return successResponse(res, 200, 'Parent conversations retrieved successfully', {
      count: formattedList.length,
      conversations: formattedList
    });

  } catch (error) {
    console.error('[Get Parent Conversations Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve conversations');
  }
};

const getMessageContacts = async (req, res) => {
  try {
    const parent = await getParentProfileForUser(req.user.id);
    if (!parent) return errorResponse(res, 404, 'Parent profile not found');

    const links = await ParentStudent.findAll({
      where: { parentProfileId: parent.id },
      include: [{
        model: StudentProfile,
        as: 'studentProfile',
        include: [{ model: User, as: 'user', where: { isActive: true }, attributes: ['id', 'name'] }]
      }]
    });
    const teachers = await TeacherProfile.findAll({
      include: [{ model: User, as: 'user', where: { isActive: true }, attributes: ['id', 'name'] }]
    });
    const contacts = [];

    for (const link of links) {
      if (!link.studentProfile) continue;
      for (const teacher of teachers) {
        if (!(await isTeacherAssignedToStudent(teacher, link.studentProfile, TutorRequest))) continue;
        contacts.push({
          teacher: {
            id: teacher.id,
            teacherId: teacher.teacherId,
            name: teacher.user?.name || 'Teacher',
            designation: teacher.designation || 'Instructor'
          },
          student: {
            id: link.studentProfile.id,
            studentId: link.studentProfile.studentId,
            name: link.studentProfile.user?.name || 'Student',
            className: link.studentProfile.className || '',
            section: link.studentProfile.section || ''
          }
        });
      }
    }

    return successResponse(res, 200, 'Authorized messaging contacts retrieved', { contacts });
  } catch (error) {
    console.error('[Get Parent Message Contacts Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve messaging contacts');
  }
};

/**
 * Create or retrieve existing conversation with a Teacher regarding a linked Student
 * @route POST /api/parent/conversations
 */
const createConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { teacherId, studentId } = req.body;
    const parentProfile = await getParentProfileForUser(userId);
    if (!parentProfile) return errorResponse(res, 404, 'Parent profile not found');

    if (!teacherId) {
      return errorResponse(res, 400, 'Teacher ID is required to start a conversation');
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

    // 2. Verify Parent owns/links this Student
    const parentStudentLink = await ParentStudent.findOne({
      where: {
        parentProfileId: parentProfile.id,
        studentProfileId: student.id
      }
    });

    if (!isParentLinkedToStudent(parentProfile.id, student.id, parentStudentLink)) {
      return errorResponse(res, 403, 'Access denied. You are not authorized to start conversations for this student.');
    }

    // 3. Resolve Teacher Profile
    const isNumTeacher = !isNaN(Number(teacherId));
    const teacherWhere = isNumTeacher
      ? { [Op.or]: [{ id: Number(teacherId) }, { teacherId: String(teacherId) }] }
      : { teacherId: String(teacherId) };

    const teacher = await TeacherProfile.findOne({
      where: teacherWhere,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }]
    });

    if (!teacher) {
      return errorResponse(res, 404, 'Teacher profile not found');
    }

    if (!(await isTeacherAssignedToStudent(teacher, student, TutorRequest))) {
      return errorResponse(res, 403, 'Access denied. Teacher is not assigned to this student.');
    }

    // 5. Find or Create Conversation
    const [conversation, created] = await Conversation.findOrCreate({
      where: {
        teacherProfileId: teacher.id,
        parentProfileId: parentProfile.id,
        studentProfileId: student.id
      },
      defaults: {
        teacherProfileId: teacher.id,
        parentProfileId: parentProfile.id,
        studentProfileId: student.id
      }
    });

    return successResponse(res, created ? 201 : 200, created ? 'Conversation created successfully' : 'Existing conversation retrieved', {
      id: conversation.id,
      teacher: {
        id: teacher.id,
        teacherId: teacher.teacherId,
        name: teacher.user?.name || 'Teacher',
        email: teacher.user?.email || '',
        department: teacher.department,
        designation: teacher.designation
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
    console.error('[Create Parent Conversation Error]:', error.message);
    return errorResponse(res, 500, 'Failed to initialize conversation');
  }
};

/**
 * Get Messages for a Conversation (Chronological order)
 * @route GET /api/parent/conversations/:conversationId/messages
 */
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const parentProfile = await getParentProfileForUser(userId);
    if (!parentProfile) return errorResponse(res, 404, 'Parent profile not found');

    const conversation = await verifyParentConversation(parentProfile.id, conversationId);
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
        teacher: {
          id: conversation.teacherProfile?.id,
          teacherId: conversation.teacherProfile?.teacherId,
          name: conversation.teacherProfile?.user?.name,
          department: conversation.teacherProfile?.department
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
    console.error('[Get Parent Messages Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve messages');
  }
};

/**
 * Send Message as Parent
 * @route POST /api/parent/conversations/:conversationId/messages
 */
const sendMessage = async (req, res) => {
  let transaction;
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { message } = req.body;
    const parentProfile = await getParentProfileForUser(userId);
    if (!parentProfile) return errorResponse(res, 404, 'Parent profile not found');

    const normalized = normalizeChatMessage(message);
    if (!normalized.valid) return errorResponse(res, 400, normalized.error);
    const cleanMessage = normalized.text;

    // 2. Verify Conversation Ownership
    const conversation = await verifyParentConversation(parentProfile.id, conversationId);
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

    // Emit real-time WebSocket message to teacher
    const teacherUserId = conversation.teacherProfile?.userId;
    if (teacherUserId) {
      emitNewMessage(teacherUserId, messagePayload);
    }
    emitNewMessage(userId, { ...messagePayload, isMine: true });

    // Notify teacher asynchronously
    notifyForMessage(newMessage, conversation, sender).catch((err) =>
      console.error('[Notification Error on sendMessage parent]:', err.message)
    );

    return successResponse(res, 201, 'Message sent successfully', {
      ...messagePayload,
      isMine: true
    });

  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    console.error('[Send Parent Message Error]:', error.message);
    return errorResponse(res, 500, 'Failed to send message');
  }
};

/**
 * Mark Message as Read by Parent
 * @route PATCH /api/parent/messages/:messageId/read
 */
const markMessageRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const parentProfile = await getParentProfileForUser(userId);
    if (!parentProfile) return errorResponse(res, 404, 'Parent profile not found');

    const message = await Message.findByPk(messageId);

    if (!message) {
      return errorResponse(res, 404, 'Message not found');
    }

    if (!(await verifyParentConversation(parentProfile.id, message.conversationId))) {
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
    console.error('[Mark Message Read Parent Error]:', error.message);
    return errorResponse(res, 500, 'Failed to update message status');
  }
};

/**
 * Get Total Unread Message Count for Authenticated Parent
 * @route GET /api/parent/messages/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const parentProfile = await getParentProfileForUser(userId);
    if (!parentProfile) return errorResponse(res, 404, 'Parent profile not found');

    const listedConversations = await Conversation.findAll({
      where: { parentProfileId: parentProfile.id },
      attributes: ['id']
    });
    const conversations = [];
    for (const conversation of listedConversations) {
      if (await verifyParentConversation(parentProfile.id, conversation.id)) conversations.push(conversation);
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
    console.error('[Get Unread Count Parent Error]:', error.message);
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
