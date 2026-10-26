const { sequelize } = require('../config/db');
const User = require('./User');
const StudentProfile = require('./StudentProfile');
const TeacherProfile = require('./TeacherProfile');
const ParentProfile = require('./ParentProfile');
const ParentStudent = require('./ParentStudent');
const Attendance = require('./Attendance');
const Homework = require('./Homework');
const HomeworkSubmission = require('./HomeworkSubmission');
const SubmissionAttachment = require('./SubmissionAttachment');
const Marks = require('./Marks');
const Conversation = require('./Conversation');
const Message = require('./Message');
const Notification = require('./Notification');
const AdminProfile = require('./AdminProfile');
const Class = require('./Class');
const Section = require('./Section');
const Subject = require('./Subject');
const AuditLog = require('./AuditLog');
const TeachingSession = require('./TeachingSession');
const TeachingSessionParticipant = require('./TeachingSessionParticipant');
const ClassResource = require('./ClassResource');
const ClassNote = require('./ClassNote');
const ClassFeedback = require('./ClassFeedback');
const AIChatHistory = require('./AIChatHistory');
const AIQuestionCache = require('./AIQuestionCache');
const AISafetyLog = require('./AISafetyLog');
const TutorProfile = require('./TutorProfile');
const TutorSubject = require('./TutorSubject');
const TutorAvailability = require('./TutorAvailability');
const TutorRequest = require('./TutorRequest');
const TutorReview = require('./TutorReview');
const TutorShortlist = require('./TutorShortlist');
const SchoolProfile = require('./SchoolProfile');
const TutorBookingReport = require('./TutorBookingReport');

// 1. User <-> StudentProfile (1 : 1)
User.hasOne(StudentProfile, {
  foreignKey: 'userId',
  as: 'studentProfile',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

StudentProfile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// 2. User <-> TeacherProfile (1 : 1)
User.hasOne(TeacherProfile, {
  foreignKey: 'userId',
  as: 'teacherProfile',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

TeacherProfile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// 3. User <-> ParentProfile (1 : 1)
User.hasOne(ParentProfile, {
  foreignKey: 'userId',
  as: 'parentProfile',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

ParentProfile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// 4. ParentProfile <-> ParentStudent <-> StudentProfile (Many : Many)
ParentProfile.hasMany(ParentStudent, {
  foreignKey: 'parentProfileId',
  as: 'parentStudents',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

ParentStudent.belongsTo(ParentProfile, {
  foreignKey: 'parentProfileId',
  as: 'parentProfile'
});

StudentProfile.hasMany(ParentStudent, {
  foreignKey: 'studentProfileId',
  as: 'parentStudents',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

ParentStudent.belongsTo(StudentProfile, {
  foreignKey: 'studentProfileId',
  as: 'studentProfile'
});

ParentProfile.belongsToMany(StudentProfile, {
  through: ParentStudent,
  foreignKey: 'parentProfileId',
  otherKey: 'studentProfileId',
  as: 'students'
});

StudentProfile.belongsToMany(ParentProfile, {
  through: ParentStudent,
  foreignKey: 'studentProfileId',
  otherKey: 'parentProfileId',
  as: 'parents'
});

// 5. StudentProfile <-> Attendance (1 : Many)
StudentProfile.hasMany(Attendance, {
  foreignKey: 'studentProfileId',
  as: 'attendances',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Attendance.belongsTo(StudentProfile, {
  foreignKey: 'studentProfileId',
  as: 'studentProfile',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// 6. User (Teacher/Admin) <-> Attendance (1 : Many, optional marker)
User.hasMany(Attendance, {
  foreignKey: 'markedBy',
  as: 'markedAttendances',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

Attendance.belongsTo(User, {
  foreignKey: 'markedBy',
  as: 'marker',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

// 7. User (Teacher) <-> Homework (1 : Many)
User.hasMany(Homework, {
  foreignKey: 'assignedBy',
  as: 'assignedHomeworks',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Homework.belongsTo(User, {
  foreignKey: 'assignedBy',
  as: 'teacher',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// 8. Homework <-> HomeworkSubmission (1 : Many)
Homework.hasMany(HomeworkSubmission, {
  foreignKey: 'homeworkId',
  as: 'submissions',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

HomeworkSubmission.belongsTo(Homework, {
  foreignKey: 'homeworkId',
  as: 'homework',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

HomeworkSubmission.hasMany(SubmissionAttachment, {
  foreignKey: 'submissionId',
  as: 'attachments',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

SubmissionAttachment.belongsTo(HomeworkSubmission, {
  foreignKey: 'submissionId',
  as: 'submission',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// 9. StudentProfile <-> HomeworkSubmission (1 : Many)
StudentProfile.hasMany(HomeworkSubmission, {
  foreignKey: 'studentId',
  as: 'homeworkSubmissions',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

HomeworkSubmission.belongsTo(StudentProfile, {
  foreignKey: 'studentId',
  as: 'studentProfile',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// 10. StudentProfile <-> Marks (1 : Many)
StudentProfile.hasMany(Marks, {
  foreignKey: 'studentId',
  as: 'marks',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Marks.belongsTo(StudentProfile, {
  foreignKey: 'studentId',
  as: 'studentProfile',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// 11. User (Teacher/Admin) <-> Marks (1 : Many, optional markedBy)
User.hasMany(Marks, {
  foreignKey: 'markedBy',
  as: 'markedGrades',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

Marks.belongsTo(User, {
  foreignKey: 'markedBy',
  as: 'evaluator',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

// 12. Messaging: Conversation Associations
TeacherProfile.hasMany(Conversation, {
  foreignKey: 'teacherProfileId',
  as: 'conversations',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Conversation.belongsTo(TeacherProfile, {
  foreignKey: 'teacherProfileId',
  as: 'teacherProfile'
});

ParentProfile.hasMany(Conversation, {
  foreignKey: 'parentProfileId',
  as: 'conversations',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Conversation.belongsTo(ParentProfile, {
  foreignKey: 'parentProfileId',
  as: 'parentProfile'
});

StudentProfile.hasMany(Conversation, {
  foreignKey: 'studentProfileId',
  as: 'conversations',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Conversation.belongsTo(StudentProfile, {
  foreignKey: 'studentProfileId',
  as: 'studentProfile'
});

// 13. Messaging: Message Associations
Conversation.hasMany(Message, {
  foreignKey: 'conversationId',
  as: 'messages',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Message.belongsTo(Conversation, {
  foreignKey: 'conversationId',
  as: 'conversation'
});

User.hasMany(Message, {
  foreignKey: 'senderUserId',
  as: 'sentMessages',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Message.belongsTo(User, {
  foreignKey: 'senderUserId',
  as: 'sender'
});

// 14. Notifications: User <-> Notification (1 : Many)
User.hasMany(Notification, {
  foreignKey: 'recipientUserId',
  as: 'notifications',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Notification.belongsTo(User, {
  foreignKey: 'recipientUserId',
  as: 'recipient'
});

// 15. Admin: User <-> AdminProfile (1 : 1)
User.hasOne(AdminProfile, {
  foreignKey: 'userId',
  as: 'adminProfile',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

AdminProfile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// 16. Academic Structure: Class <-> Section (1 : Many)
Class.hasMany(Section, {
  foreignKey: 'classId',
  as: 'sections',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Section.belongsTo(Class, {
  foreignKey: 'classId',
  as: 'class'
});

// 17. Governance: User <-> AuditLog (1 : Many)
User.hasMany(AuditLog, {
  foreignKey: 'adminUserId',
  as: 'auditLogs',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

AuditLog.belongsTo(User, {
  foreignKey: 'adminUserId',
  as: 'adminUser'
});

// 18. Teaching Sessions
TeacherProfile.hasMany(TeachingSession, {
  foreignKey: 'teacherProfileId',
  as: 'teachingSessions',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

TeachingSession.belongsTo(TeacherProfile, {
  foreignKey: 'teacherProfileId',
  as: 'teacherProfile'
});

StudentProfile.hasMany(TeachingSession, {
  foreignKey: 'studentProfileId',
  as: 'teachingSessions',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

TeachingSession.belongsTo(StudentProfile, {
  foreignKey: 'studentProfileId',
  as: 'studentProfile'
});

Subject.hasMany(TeachingSession, {
  foreignKey: 'subjectId',
  as: 'teachingSessions',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

TeachingSession.belongsTo(Subject, {
  foreignKey: 'subjectId',
  as: 'subject'
});

TutorRequest.hasMany(TeachingSession, {
  foreignKey: 'tutorRequestId',
  as: 'bookedSessions',
  constraints: false,
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
TeachingSession.belongsTo(TutorRequest, {
  foreignKey: 'tutorRequestId',
  as: 'bookingRequest',
  constraints: false,
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
TeachingSession.hasMany(TutorBookingReport, {
  foreignKey: 'teachingSessionId',
  as: 'bookingReports',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
TutorBookingReport.belongsTo(TeachingSession, {
  foreignKey: 'teachingSessionId',
  as: 'teachingSession'
});
User.hasMany(TutorBookingReport, {
  foreignKey: 'reporterUserId',
  as: 'tutorBookingReports',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
TutorBookingReport.belongsTo(User, {
  foreignKey: 'reporterUserId',
  as: 'reporter'
});

TeachingSession.hasMany(TeachingSessionParticipant, {
  foreignKey: 'teachingSessionId',
  as: 'participants',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

TeachingSessionParticipant.belongsTo(TeachingSession, {
  foreignKey: 'teachingSessionId',
  as: 'teachingSession'
});

User.hasMany(TeachingSessionParticipant, {
  foreignKey: 'userId',
  as: 'teachingSessionParticipations',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

TeachingSessionParticipant.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

TeachingSession.hasMany(ClassResource, { foreignKey: 'teachingSessionId', as: 'resources', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
ClassResource.belongsTo(TeachingSession, { foreignKey: 'teachingSessionId', as: 'teachingSession' });
ClassResource.belongsTo(User, { foreignKey: 'uploadedByUserId', as: 'uploader' });

TeachingSession.hasOne(ClassNote, { foreignKey: 'teachingSessionId', as: 'note', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
ClassNote.belongsTo(TeachingSession, { foreignKey: 'teachingSessionId', as: 'teachingSession' });
ClassNote.belongsTo(User, { foreignKey: 'authorUserId', as: 'author' });

TeachingSession.hasOne(ClassFeedback, { foreignKey: 'teachingSessionId', as: 'feedback', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
ClassFeedback.belongsTo(TeachingSession, { foreignKey: 'teachingSessionId', as: 'teachingSession' });
ClassFeedback.belongsTo(User, { foreignKey: 'authorUserId', as: 'author' });

User.hasMany(AIChatHistory, { foreignKey: 'userId', as: 'aiChatHistory', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
AIChatHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Phase 5: Tutor Marketplace & Discovery System Associations

// User <-> TutorProfile (1 : 1)
User.hasOne(TutorProfile, {
  foreignKey: 'userId',
  as: 'tutorProfile',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
TutorProfile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// TutorProfile <-> TutorSubject (1 : Many)
TutorProfile.hasMany(TutorSubject, {
  foreignKey: 'tutorProfileId',
  as: 'subjects',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
TutorSubject.belongsTo(TutorProfile, {
  foreignKey: 'tutorProfileId',
  as: 'tutorProfile'
});

// TutorProfile <-> TutorAvailability (1 : Many)
TutorProfile.hasMany(TutorAvailability, {
  foreignKey: 'tutorProfileId',
  as: 'availabilities',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
TutorAvailability.belongsTo(TutorProfile, {
  foreignKey: 'tutorProfileId',
  as: 'tutorProfile'
});

// TutorRequest Associations
User.hasMany(TutorRequest, {
  foreignKey: 'requesterUserId',
  as: 'sentTutorRequests',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
TutorRequest.belongsTo(User, {
  foreignKey: 'requesterUserId',
  as: 'requester'
});

TutorProfile.hasMany(TutorRequest, {
  foreignKey: 'tutorProfileId',
  as: 'tutorRequests',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
TutorRequest.belongsTo(TutorProfile, {
  foreignKey: 'tutorProfileId',
  as: 'tutorProfile'
});

User.hasMany(TutorRequest, {
  foreignKey: 'tutorUserId',
  as: 'receivedTutorRequests',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
TutorRequest.belongsTo(User, {
  foreignKey: 'tutorUserId',
  as: 'tutorUser'
});

StudentProfile.hasMany(TutorRequest, {
  foreignKey: 'studentProfileId',
  as: 'tutorRequests',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
TutorRequest.belongsTo(StudentProfile, {
  foreignKey: 'studentProfileId',
  as: 'studentProfile'
});

TeachingSession.hasOne(TutorRequest, {
  foreignKey: 'teachingSessionId',
  as: 'tutorRequest',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
TutorRequest.belongsTo(TeachingSession, {
  foreignKey: 'teachingSessionId',
  as: 'teachingSession'
});

// TutorReview Associations
TutorProfile.hasMany(TutorReview, {
  foreignKey: 'tutorProfileId',
  as: 'reviews',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
TutorReview.belongsTo(TutorProfile, {
  foreignKey: 'tutorProfileId',
  as: 'tutorProfile'
});

User.hasMany(TutorReview, {
  foreignKey: 'reviewerUserId',
  as: 'writtenTutorReviews',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
TutorReview.belongsTo(User, {
  foreignKey: 'reviewerUserId',
  as: 'reviewer'
});

TeachingSession.hasMany(TutorReview, {
  foreignKey: 'teachingSessionId',
  as: 'tutorReviews',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
TutorReview.belongsTo(TeachingSession, {
  foreignKey: 'teachingSessionId',
  as: 'teachingSession'
});

// TutorShortlist Associations
User.hasMany(TutorShortlist, {
  foreignKey: 'userId',
  as: 'shortlistedTutors',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
TutorShortlist.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

TutorProfile.hasMany(TutorShortlist, {
  foreignKey: 'tutorProfileId',
  as: 'shortlists',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
TutorShortlist.belongsTo(TutorProfile, {
  foreignKey: 'tutorProfileId',
  as: 'tutorProfile'
});

// User <-> SchoolProfile (1 : 1)
User.hasOne(SchoolProfile, {
  foreignKey: 'userId',
  as: 'schoolProfile',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
SchoolProfile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

module.exports = {
  sequelize,
  User,
  StudentProfile,
  TeacherProfile,
  ParentProfile,
  ParentStudent,
  Attendance,
  Homework,
  HomeworkSubmission,
  SubmissionAttachment,
  Marks,
  Conversation,
  Message,
  Notification,
  AdminProfile,
  Class,
  Section,
  Subject,
  AuditLog,
  TeachingSession,
  TeachingSessionParticipant,
  ClassResource,
  ClassNote,
  ClassFeedback,
  AIChatHistory,
  AIQuestionCache,
  AISafetyLog,
  TutorProfile,
  TutorSubject,
  TutorAvailability,
  TutorRequest,
  TutorReview,
  TutorShortlist,
  SchoolProfile,
  TutorBookingReport
};
