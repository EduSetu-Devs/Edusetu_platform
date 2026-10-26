const {
  sequelize,
  TutorRequest,
  TutorProfile,
  User,
  StudentProfile,
  ParentProfile,
  ParentStudent,
  TeachingSession
} = require('../models');
const { createNotification } = require('../services/notificationService');
const { getTutorAssignmentDecision } = require('../utils/tutorAssignmentEligibility');

const assignmentError = (decision) => {
  if (decision.reason === 'age_unverified') {
    return { status: 403, message: 'Age eligibility has not been verified. An administrator must review the student age record before tutor requests are available' };
  }
  if (decision.reason === 'age_verification_pending') {
    return { status: 403, message: 'Age eligibility verification is pending administrator review' };
  }
  if (decision.reason === 'age_verification_rejected') {
    return { status: 403, message: 'Age eligibility verification was rejected. Update the date of birth and request another review' };
  }
  if (decision.reason === 'dob_missing') {
    return { status: 400, message: 'Complete the student date of birth in their profile before requesting a tutor' };
  }
  if (decision.reason === 'dob_invalid') {
    return { status: 400, message: 'The student date of birth is invalid. Update the student profile before requesting a tutor' };
  }
  if (decision.reason === 'parent_required') {
    return { status: 403, message: 'A linked parent or guardian must request a tutor for students aged 18 or younger' };
  }
  if (decision.reason === 'adult_student_must_request_independently') {
    return { status: 403, message: 'Adult students must request tutors from their own account' };
  }
  return { status: 403, message: 'This account is not authorized to request a tutor for this student' };
};

const getTutorAssignmentEligibility = async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      const student = await StudentProfile.findOne({ where: { userId: req.user.id } });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }
      const decision = getTutorAssignmentDecision(student, 'student');
      return res.status(200).json({
        success: true,
        data: {
          role: 'student',
          canRequest: decision.canRequest,
          reason: decision.reason,
          ageVerificationStatus: student.ageVerificationStatus
        }
      });
    }

    const parent = await ParentProfile.findOne({ where: { userId: req.user.id } });
    if (!parent) {
      return res.status(404).json({ success: false, message: 'Parent profile not found' });
    }
    const links = await ParentStudent.findAll({
      where: { parentProfileId: parent.id },
      include: [{
        model: StudentProfile,
        as: 'studentProfile',
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
      }],
      order: [['createdAt', 'ASC']]
    });
    const children = links
      .filter(link => link.studentProfile)
      .map(link => {
        const decision = getTutorAssignmentDecision(link.studentProfile, 'parent');
        return {
          studentProfileId: link.studentProfile.id,
          name: link.studentProfile.user?.name || 'Student',
          className: link.studentProfile.className || '',
          canRequest: decision.canRequest,
          reason: decision.reason
        };
      });
    return res.status(200).json({ success: true, data: { role: 'parent', children } });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a new tutor request
 * Endpoint: POST /api/tutor/requests
 */
const sendTutorRequest = async (req, res, next) => {
  try {
    const requesterUserId = req.user.id;
    const requesterRole = req.user.role;
    const {
      tutorProfileId,
      studentProfileId,
      studentName,
      subject,
      gradeLevel,
      preferredMode,
      preferredSchedule,
      scheduledDate,
      startTime,
      endTime,
      message,
      budget
    } = req.body;

    if (!['student', 'parent'].includes(requesterRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only students and parents can send tutor requests'
      });
    }

    if (!tutorProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Tutor profile ID is required'
      });
    }

    if (typeof subject !== 'string' || subject.trim() === '' || subject.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required and must be 100 characters or fewer'
      });
    }
    if (budget !== undefined && budget !== '' && (!Number.isFinite(Number(budget)) || Number(budget) < 0)) {
      return res.status(400).json({ success: false, message: 'Budget must be a non-negative number' });
    }

    const tutorProfile = await TutorProfile.findOne({
      where: { id: tutorProfileId, isProfileActive: true, isAvailable: true },
      include: [{
        model: User,
        as: 'user',
        where: { role: 'teacher', isActive: true },
        attributes: ['id', 'name']
      }]
    });

    if (!tutorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    // Disallow sending request to oneself
    if (tutorProfile.userId === requesterUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a tutor request to yourself'
      });
    }

    let finalStudentProfileId = studentProfileId || null;
    let finalStudentName = studentName || '';

    if (requesterRole === 'student') {
      const studentProf = await StudentProfile.findOne({ where: { userId: requesterUserId } });
      if (!studentProf) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }
      const decision = getTutorAssignmentDecision(studentProf, 'student');
      if (!decision.canRequest) {
        const error = assignmentError(decision);
        return res.status(error.status).json({ success: false, message: error.message });
      }
      finalStudentProfileId = studentProf.id;
      finalStudentName = req.user.name;
    } else {
      const parentProfile = await ParentProfile.findOne({ where: { userId: requesterUserId } });
      if (!parentProfile) {
        return res.status(404).json({ success: false, message: 'Parent profile not found' });
      }
      const linkedStudents = await ParentStudent.findAll({
        where: { parentProfileId: parentProfile.id },
        include: [{ model: StudentProfile, as: 'studentProfile' }]
      });
      const selectedStudent = finalStudentProfileId
        ? linkedStudents.find(link => String(link.studentProfileId) === String(finalStudentProfileId))
        : linkedStudents.length === 1 ? linkedStudents[0] : null;
      if (!selectedStudent) {
        return res.status(400).json({
          success: false,
          message: linkedStudents.length ? 'Select a child linked to your parent account' : 'Link a child before requesting a tutor'
        });
      }
      const decision = getTutorAssignmentDecision(selectedStudent.studentProfile, 'parent');
      if (!decision.canRequest) {
        const error = assignmentError(decision);
        return res.status(error.status).json({ success: false, message: error.message });
      }
      finalStudentProfileId = selectedStudent.studentProfileId;
      finalStudentName = selectedStudent.studentProfile?.userId
        ? (await User.findByPk(selectedStudent.studentProfile.userId, { attributes: ['id', 'name'] }))?.name || ''
        : '';
    }

    const requestedDate = scheduledDate ? new Date(`${scheduledDate}T00:00:00Z`) : null;
    const today = new Date().toISOString().slice(0, 10);
    const mode = String(preferredMode || 'online').toLowerCase();
    const hasRequestedTime = scheduledDate || startTime || endTime;
    if (!['online', 'offline', 'both'].includes(mode) ||
        (hasRequestedTime && (!scheduledDate || !startTime || !endTime ||
          !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate) ||
          Number.isNaN(requestedDate?.getTime()) || requestedDate.toISOString().slice(0, 10) !== scheduledDate ||
          scheduledDate < today ||
          !/^\d{2}:\d{2}$/.test(startTime) ||
          !/^\d{2}:\d{2}$/.test(endTime) ||
          startTime >= endTime))) {
      return res.status(400).json({
        success: false,
        message: 'Choose a valid teaching mode and, if supplied, a complete future date/time range'
      });
    }

    const request = await TutorRequest.create({
      requesterUserId,
      requesterRole,
      tutorProfileId: tutorProfile.id,
      tutorUserId: tutorProfile.userId,
      studentProfileId: finalStudentProfileId,
      studentName: finalStudentName,
      subject: subject.trim(),
      gradeLevel: gradeLevel || '',
      preferredMode: mode,
      preferredSchedule: preferredSchedule || '',
      scheduledDate,
      startTime,
      endTime,
      message: message || '',
      budget: budget !== undefined && budget !== '' ? Number(budget) : null,
      status: 'pending'
    });

    await createNotification({
      recipientUserId: tutorProfile.userId,
      type: 'GENERAL',
      title: 'New tutor request',
      message: `${req.user.name} sent a request for ${subject.trim()}.`,
      relatedEntityType: 'tutor_request',
      relatedEntityId: request.id
    });

    return res.status(201).json({
      success: true,
      message: 'Tutor request sent successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get outgoing requests sent by logged in user
 * Endpoint: GET /api/tutor/my-requests
 */
const getMyRequests = async (req, res, next) => {
  try {
    const requesterUserId = req.user.id;

    const requests = await TutorRequest.findAll({
      where: { requesterUserId },
      include: [
        {
          model: TutorProfile,
          as: 'tutorProfile',
          attributes: ['id', 'headline', 'hourlyRate', 'city', 'area', 'rating', 'verificationStatus'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'profileImage']
            }
          ]
        },
        {
          model: TeachingSession,
          as: 'teachingSession',
          attributes: ['id', 'title', 'scheduledDate', 'startTime', 'endTime', 'status', 'bookingStatus', 'mode', 'classRoomId']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get incoming requests for the logged-in tutor
 * Endpoint: GET /api/tutor/incoming-requests
 */
const getIncomingRequests = async (req, res, next) => {
  try {
    const tutorUserId = req.user.id;

    const requests = await TutorRequest.findAll({
      where: { tutorUserId },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email', 'role', 'profileImage']
        },
        {
          model: StudentProfile,
          as: 'studentProfile',
          attributes: ['id', 'studentId', 'rollNumber']
        },
        {
          model: TeachingSession,
          as: 'teachingSession',
          attributes: ['id', 'title', 'scheduledDate', 'startTime', 'endTime', 'status', 'bookingStatus', 'mode', 'classRoomId']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tutor accepts a request and automatically creates a connected TeachingSession
 * Endpoint: PUT /api/tutor/requests/:id/accept
 */
const acceptRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tutorUserId = req.user.id;
    const { responseMessage } = req.body;
    const request = await sequelize.transaction(async transaction => {
      const tutorRequest = await TutorRequest.findOne({
        where: { id, tutorUserId },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!tutorRequest) {
        const error = new Error('Tutor request not found or unauthorized');
        error.status = 404;
        throw error;
      }
      if (tutorRequest.status !== 'pending') {
        const error = new Error(`Cannot accept request with status: ${tutorRequest.status}`);
        error.status = 400;
        throw error;
      }
      if (!tutorRequest.studentProfileId) {
        const error = new Error('The tutor request is not linked to a student');
        error.status = 400;
        throw error;
      }
      const student = await StudentProfile.findByPk(tutorRequest.studentProfileId, { transaction });
      const requesterIsAuthorizedStudent = tutorRequest.requesterRole === 'student' &&
        student?.userId === tutorRequest.requesterUserId;
      let requesterIsLinkedParent = false;
      if (tutorRequest.requesterRole === 'parent' && student) {
        const parent = await ParentProfile.findOne({
          where: { userId: tutorRequest.requesterUserId },
          transaction
        });
        requesterIsLinkedParent = Boolean(parent && await ParentStudent.findOne({
          where: { parentProfileId: parent.id, studentProfileId: student.id },
          transaction
        }));
      }
      if (!requesterIsAuthorizedStudent && !requesterIsLinkedParent) {
        const error = new Error('The tutor request is no longer authorized for this student');
        error.status = 403;
        throw error;
      }
      const eligibility = getTutorAssignmentDecision(student, tutorRequest.requesterRole);
      if (!eligibility.canRequest) {
        const errorDetails = assignmentError(eligibility);
        const error = new Error(errorDetails.message);
        error.status = errorDetails.status;
        throw error;
      }
      await tutorRequest.update({
        status: 'accepted',
        responseMessage: responseMessage || 'Your tutoring request has been accepted. You can now book a class.',
        respondedAt: new Date()
      }, { transaction });
      return tutorRequest;
    });

    await createNotification({
      recipientUserId: request.requesterUserId,
      type: 'GENERAL',
      title: 'Tutor request accepted',
      message: `Your tutoring request for ${request.subject} was accepted. Choose a time to request your class.`,
      relatedEntityType: 'tutor_request',
      relatedEntityId: request.id
    });

    return res.status(200).json({
      success: true,
      message: 'Tutor request accepted. The learner can now book a class.',
      data: request
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * Tutor rejects a request
 * Endpoint: PUT /api/tutor/requests/:id/reject
 */
const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tutorUserId = req.user.id;
    const { responseMessage } = req.body;

    const request = await TutorRequest.findOne({
      where: { id, tutorUserId }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Tutor request not found or unauthorized'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status: ${request.status}`
      });
    }

    await request.update({
      status: 'rejected',
      responseMessage: responseMessage || 'Unable to accept at this time due to schedule conflicts.',
      respondedAt: new Date()
    });

    await createNotification({
      recipientUserId: request.requesterUserId,
      type: 'GENERAL',
      title: 'Tutor request update',
      message: `Your tutoring request for ${request.subject} could not be accepted at this time.`,
      relatedEntityType: 'tutor_request',
      relatedEntityId: request.id
    });

    return res.status(200).json({
      success: true,
      message: 'Request declined',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Requester cancels their pending request
 * Endpoint: PUT /api/tutor/requests/:id/cancel
 */
const cancelRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterUserId = req.user.id;

    const request = await TutorRequest.findOne({
      where: { id, requesterUserId }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Tutor request not found or unauthorized'
      });
    }

    const student = request.studentProfileId
      ? await StudentProfile.findByPk(request.studentProfileId)
      : null;
    if (request.requesterRole === 'parent') {
      const parentProfile = await ParentProfile.findOne({ where: { userId: requesterUserId } });
      const linkedStudent = parentProfile && student && await ParentStudent.findOne({
        where: { parentProfileId: parentProfile.id, studentProfileId: student.id }
      });
      if (!linkedStudent) {
        return res.status(403).json({ success: false, message: 'You are not authorized to manage this student request' });
      }
    }
    const decision = getTutorAssignmentDecision(student, request.requesterRole);
    if (!decision.canRequest) {
      const error = assignmentError(decision);
      return res.status(error.status).json({ success: false, message: error.message });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be cancelled'
      });
    }

    await request.update({
      status: 'cancelled',
      respondedAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Request cancelled successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTutorAssignmentEligibility,
  sendTutorRequest,
  getMyRequests,
  getIncomingRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest
};
