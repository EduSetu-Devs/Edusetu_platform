const { Op } = require('sequelize');
const {
  Notification,
  User,
  StudentProfile,
  TeacherProfile,
  ParentProfile,
  ParentStudent,
  Conversation
} = require('../models');
const { emitNewNotification } = require('../socket');

/**
 * Create a single notification safely and emit real-time event
 */
const createNotification = async ({
  recipientUserId,
  type = 'GENERAL',
  title,
  message,
  relatedEntityType = null,
  relatedEntityId = null
}) => {
  try {
    if (!recipientUserId || !title || !message) return null;

    const notif = await Notification.create({
      recipientUserId,
      type,
      title: title.trim(),
      message: message.trim(),
      relatedEntityType,
      relatedEntityId: relatedEntityId ? Number(relatedEntityId) : null,
      isRead: false
    });

    // Real-time WebSocket emission
    emitNewNotification(recipientUserId, {
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      relatedEntityType: notif.relatedEntityType,
      relatedEntityId: notif.relatedEntityId,
      isRead: false,
      createdAt: notif.createdAt
    });

    return notif;
  } catch (error) {
    console.error('[NotificationService createNotification Error]:', error.message);
    return null;
  }
};

/**
 * Bulk create notifications efficiently and emit real-time events
 */
const createBulkNotifications = async (items = []) => {
  try {
    if (!items || items.length === 0) return [];

    const validItems = items
      .filter((i) => i && i.recipientUserId && i.title && i.message)
      .map((i) => ({
        recipientUserId: i.recipientUserId,
        type: i.type || 'GENERAL',
        title: i.title.trim(),
        message: i.message.trim(),
        relatedEntityType: i.relatedEntityType || null,
        relatedEntityId: i.relatedEntityId ? Number(i.relatedEntityId) : null,
        isRead: false
      }));

    if (validItems.length === 0) return [];
    const createdItems = await Notification.bulkCreate(validItems);

    // Real-time WebSocket emission for each recipient
    createdItems.forEach((notif) => {
      emitNewNotification(notif.recipientUserId, {
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        relatedEntityType: notif.relatedEntityType,
        relatedEntityId: notif.relatedEntityId,
        isRead: false,
        createdAt: notif.createdAt
      });
    });

    return createdItems;
  } catch (error) {
    console.error('[NotificationService createBulkNotifications Error]:', error.message);
    return [];
  }
};

/**
 * Helper to notify Students and their linked Parents when Homework is published
 */
const notifyForHomework = async (homework) => {
  try {
    if (!homework || !homework.className) return;

    const studentWhere = { className: homework.className.trim() };
    if (homework.section && homework.section.trim()) {
      studentWhere.section = homework.section.trim();
    }

    const students = await StudentProfile.findAll({
      where: studentWhere,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
        {
          model: ParentStudent,
          as: 'parentStudents',
          include: [
            {
              model: ParentProfile,
              as: 'parentProfile',
              include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
            }
          ]
        }
      ]
    });

    const notifs = [];
    students.forEach((s) => {
      // 1. Notify Student
      if (s.userId) {
        notifs.push({
          recipientUserId: s.userId,
          type: 'HOMEWORK',
          title: 'New Homework Assigned',
          message: `New ${homework.subject} homework "${homework.title}" has been assigned for ${homework.className}. Due date: ${homework.dueDate}.`,
          relatedEntityType: 'homework',
          relatedEntityId: homework.id
        });
      }

      // 2. Notify Linked Parents
      if (s.parentStudents && s.parentStudents.length > 0) {
        s.parentStudents.forEach((ps) => {
          const parentUserId = ps.parentProfile?.userId;
          if (parentUserId) {
            notifs.push({
              recipientUserId: parentUserId,
              type: 'HOMEWORK',
              title: 'New Homework Assigned',
              message: `New ${homework.subject} homework "${homework.title}" has been assigned for ${s.user?.name || 'your child'} (${homework.className}). Due date: ${homework.dueDate}.`,
              relatedEntityType: 'homework',
              relatedEntityId: homework.id
            });
          }
        });
      }
    });

    await createBulkNotifications(notifs);
  } catch (error) {
    console.error('[NotificationService notifyForHomework Error]:', error.message);
  }
};

/**
 * Helper to notify Parents and Students when Attendance is marked/updated
 */
const notifyForAttendance = async (attendanceRecord, studentProfile) => {
  try {
    if (!attendanceRecord || !studentProfile) return;

    const student = await StudentProfile.findByPk(studentProfile.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
        {
          model: ParentStudent,
          as: 'parentStudents',
          include: [
            {
              model: ParentProfile,
              as: 'parentProfile',
              include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
            }
          ]
        }
      ]
    });

    if (!student) return;

    const statusLabel =
      attendanceRecord.status.charAt(0).toUpperCase() + attendanceRecord.status.slice(1);
    const notifs = [];

    // Notify Student
    if (student.userId) {
      notifs.push({
        recipientUserId: student.userId,
        type: 'ATTENDANCE',
        title: 'Attendance Recorded',
        message: `Your attendance for ${attendanceRecord.subject} on ${attendanceRecord.date} has been marked ${statusLabel}.`,
        relatedEntityType: 'attendance',
        relatedEntityId: attendanceRecord.id
      });
    }

    // Notify Parents
    if (student.parentStudents && student.parentStudents.length > 0) {
      student.parentStudents.forEach((ps) => {
        const parentUserId = ps.parentProfile?.userId;
        if (parentUserId) {
          notifs.push({
            recipientUserId: parentUserId,
            type: 'ATTENDANCE',
            title: 'Attendance Updated',
            message: `Attendance for ${student.user?.name || 'your child'} on ${attendanceRecord.date} (${attendanceRecord.subject}) has been marked ${statusLabel}.`,
            relatedEntityType: 'attendance',
            relatedEntityId: attendanceRecord.id
          });
        }
      });
    }

    await createBulkNotifications(notifs);
  } catch (error) {
    console.error('[NotificationService notifyForAttendance Error]:', error.message);
  }
};

/**
 * Helper to notify Parents and Students when Marks are published
 */
const notifyForMarks = async (marksRecord, studentProfile) => {
  try {
    if (!marksRecord || !studentProfile) return;

    const student = await StudentProfile.findByPk(studentProfile.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
        {
          model: ParentStudent,
          as: 'parentStudents',
          include: [
            {
              model: ParentProfile,
              as: 'parentProfile',
              include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
            }
          ]
        }
      ]
    });

    if (!student) return;

    const notifs = [];

    // Notify Student
    if (student.userId) {
      notifs.push({
        recipientUserId: student.userId,
        type: 'MARKS',
        title: 'Marks Published',
        message: `Your marks for ${marksRecord.subject} (${marksRecord.examName}) have been published: ${marksRecord.obtainedMarks}/${marksRecord.maxMarks} (${marksRecord.percentage}% - Grade ${marksRecord.grade}).`,
        relatedEntityType: 'marks',
        relatedEntityId: marksRecord.id
      });
    }

    // Notify Parents
    if (student.parentStudents && student.parentStudents.length > 0) {
      student.parentStudents.forEach((ps) => {
        const parentUserId = ps.parentProfile?.userId;
        if (parentUserId) {
          notifs.push({
            recipientUserId: parentUserId,
            type: 'MARKS',
            title: 'Marks Published',
            message: `Marks for ${student.user?.name || 'your child'} in ${marksRecord.subject} (${marksRecord.examName}) have been published: ${marksRecord.obtainedMarks}/${marksRecord.maxMarks} (${marksRecord.percentage}% - Grade ${marksRecord.grade}).`,
            relatedEntityType: 'marks',
            relatedEntityId: marksRecord.id
          });
        }
      });
    }

    await createBulkNotifications(notifs);
  } catch (error) {
    console.error('[NotificationService notifyForMarks Error]:', error.message);
  }
};

/**
 * Helper to notify Recipient when a direct Message is sent in a Conversation
 */
const notifyForMessage = async (messageRecord, conversation, senderUser) => {
  try {
    if (!messageRecord || !conversation || !senderUser) return;

    let recipientUserId = null;

    if (senderUser.role === 'teacher') {
      // Notify parent
      const parentProfile = await ParentProfile.findByPk(conversation.parentProfileId);
      recipientUserId = parentProfile?.userId;
    } else if (senderUser.role === 'parent') {
      // Notify teacher
      const teacherProfile = await TeacherProfile.findByPk(conversation.teacherProfileId);
      recipientUserId = teacherProfile?.userId;
    }

    if (!recipientUserId || recipientUserId === senderUser.id) return;

    const studentName = conversation.studentProfile?.user?.name || 'student';

    await createNotification({
      recipientUserId,
      type: 'MESSAGE',
      title: 'New Message Received',
      message: `You have received a new message from ${senderUser.name} regarding ${studentName}.`,
      relatedEntityType: 'conversation',
      relatedEntityId: conversation.id
    });
  } catch (error) {
    console.error('[NotificationService notifyForMessage Error]:', error.message);
  }
};

/**
 * Query paginated notifications for a user
 */
const getUserNotifications = async (
  userId,
  { page = 1, limit = 20, unread = false, type = null } = {}
) => {
  try {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const whereClause = { recipientUserId: userId };

    if (unread === true || unread === 'true') {
      whereClause.isRead = false;
    }

    if (type && ['HOMEWORK', 'ATTENDANCE', 'MARKS', 'MESSAGE', 'GENERAL'].includes(type.toUpperCase())) {
      whereClause.type = type.toUpperCase();
    }

    const { count, rows } = await Notification.findAndCountAll({
      where: whereClause,
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC']
      ],
      limit: limitNum,
      offset,
      attributes: [
        'id',
        'type',
        'title',
        'message',
        'relatedEntityType',
        'relatedEntityId',
        'isRead',
        'readAt',
        'createdAt'
      ]
    });

    return {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum) || 1,
      notifications: rows
    };
  } catch (error) {
    console.error('[NotificationService getUserNotifications Error]:', error.message);
    throw error;
  }
};

/**
 * Get total unread count for user
 */
const getUnreadCount = async (userId) => {
  return await Notification.count({
    where: {
      recipientUserId: userId,
      isRead: false
    }
  });
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (notificationId, userId) => {
  const notif = await Notification.findByPk(notificationId);
  if (!notif) {
    return { notFound: true, authorized: false, notification: null };
  }

  if (notif.recipientUserId !== userId) {
    return { notFound: false, authorized: false, notification: null };
  }

  if (!notif.isRead) {
    notif.isRead = true;
    notif.readAt = new Date();
    await notif.save();
  }

  return { notFound: false, authorized: true, notification: notif };
};

/**
 * Mark all unread notifications of user as read
 */
const markAllAsRead = async (userId) => {
  const [updatedCount] = await Notification.update(
    { isRead: true, readAt: new Date() },
    {
      where: {
        recipientUserId: userId,
        isRead: false
      }
    }
  );

  return updatedCount;
};

/**
 * Delete a single notification (owner only)
 */
const deleteNotification = async (notificationId, userId) => {
  const notif = await Notification.findByPk(notificationId);
  if (!notif) {
    return { notFound: true, authorized: false };
  }

  if (notif.recipientUserId !== userId) {
    return { notFound: false, authorized: false };
  }

  await notif.destroy();
  return { notFound: false, authorized: true };
};

module.exports = {
  createNotification,
  createBulkNotifications,
  notifyForHomework,
  notifyForAttendance,
  notifyForMarks,
  notifyForMessage,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
