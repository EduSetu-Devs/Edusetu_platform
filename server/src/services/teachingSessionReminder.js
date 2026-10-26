const { Op } = require('sequelize');
const { TeachingSession, TutorRequest, Notification, StudentProfile } = require('../models');
const { createNotification } = require('./notificationService');

let timer = null;
const sendUpcomingReminders = async () => {
  const now = new Date();
  const upper = new Date(now.getTime() + 31 * 60 * 1000);
  const sessions = await TeachingSession.findAll({
    where: {
      status: 'SCHEDULED',
      scheduledDate: { [Op.between]: [now.toISOString().slice(0, 10), upper.toISOString().slice(0, 10)] },
      [Op.or]: [{ bookingStatus: null }, { bookingStatus: 'CONFIRMED' }]
    },
    include: [{ model: TutorRequest, as: 'bookingRequest', attributes: ['requesterUserId'] }]
  });
  for (const session of sessions) {
    const startsAt = new Date(`${session.scheduledDate}T${session.startTime}`);
    const diff = startsAt.getTime() - now.getTime();
    if (diff < 29 * 60 * 1000 || diff > 30 * 60 * 1000) continue;
    const student = await StudentProfile.findByPk(session.studentProfileId);
    if (!student?.userId) continue;
    const subject = session.subjectName || session.title;
    const recipients = new Set([student.userId, session.bookingRequest?.requesterUserId]);
    for (const recipientUserId of recipients) {
      if (!recipientUserId) continue;
      const exists = await Notification.findOne({ where: { recipientUserId, relatedEntityType: 'teaching_session', relatedEntityId: session.id, title: 'Class reminder' } });
      if (!exists) await createNotification({ recipientUserId, type: 'GENERAL', title: 'Class reminder', message: `Your ${subject} class starts in 30 minutes.`, relatedEntityType: 'teaching_session', relatedEntityId: session.id });
    }
  }
};

const startTeachingSessionReminderWorker = () => {
  if (timer) return;
  timer = setInterval(() => sendUpcomingReminders().catch((error) => console.error('[Teaching Session Reminder Error]:', error.message)), 60 * 1000);
  sendUpcomingReminders().catch((error) => console.error('[Teaching Session Reminder Error]:', error.message));
};

module.exports = { startTeachingSessionReminderWorker, sendUpcomingReminders };
