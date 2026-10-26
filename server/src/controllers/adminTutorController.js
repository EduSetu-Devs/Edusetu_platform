const { TutorProfile, TutorSubject, User, AuditLog, sequelize } = require('../models');
const { createNotification } = require('../services/notificationService');

/**
 * Get all tutor profiles pending verification
 * Endpoint: GET /api/admin/tutors/pending
 */
const getPendingTutorVerifications = async (req, res, next) => {
  try {
    const { status = 'pending_verification' } = req.query;
    const allowedStatuses = ['pending_verification', 'verified', 'rejected', 'draft', 'all'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid tutor verification status filter' });
    }

    const whereClause = {};
    if (status !== 'all') {
      whereClause.verificationStatus = status;
    }

    const tutors = await TutorProfile.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'role', 'profileImage']
        },
        {
          model: TutorSubject,
          as: 'subjects'
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 50
    });

    return res.status(200).json({
      success: true,
      data: tutors
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin approves and verifies a tutor
 * Endpoint: PUT /api/admin/tutors/:id/verify
 */
const verifyTutor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;
    const { notes } = req.body;

    const tutor = await TutorProfile.findByPk(id, {
      include: [{ model: User, as: 'user' }]
    });

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: 'Tutor profile not found'
      });
    }

    if (tutor.verificationStatus !== 'pending_verification') {
      return res.status(400).json({ success: false, message: 'Only pending tutor profiles can be verified' });
    }
    if (!(tutor.resumeUrl || (Array.isArray(tutor.certificateUrls) && tutor.certificateUrls.length)) ||
        !(tutor.degree || tutor.qualifications)) {
      return res.status(400).json({
        success: false,
        message: 'The tutor must provide a qualification and resume or certificate before verification'
      });
    }

    await sequelize.transaction(async transaction => {
      await tutor.update({
        verificationStatus: 'verified',
        verificationNotes: notes || 'Verified credentials and certificates',
        verifiedAt: new Date(),
        verifiedByUserId: adminUserId
      }, { transaction });
      await AuditLog.create({
        adminUserId,
        action: 'VERIFY_TUTOR',
        entityType: 'tutor_profile',
        entityId: tutor.id,
        details: `Approved verification for tutor user ${tutor.userId} (${tutor.user?.name})`,
      }, { transaction });
    });

    await createNotification({
      recipientUserId: tutor.userId,
      type: 'GENERAL',
      title: 'Tutor verification approved',
      message: 'Your tutor profile has been verified and now displays the verified badge.',
      relatedEntityType: 'tutor_profile',
      relatedEntityId: tutor.id
    });

    return res.status(200).json({
      success: true,
      message: 'Tutor verified successfully',
      data: tutor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin rejects a tutor verification submission
 * Endpoint: PUT /api/admin/tutors/:id/reject
 */
const rejectTutorVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;
    const { reason } = req.body;

    const tutor = await TutorProfile.findByPk(id, {
      include: [{ model: User, as: 'user' }]
    });

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: 'Tutor profile not found'
      });
    }

    if (tutor.verificationStatus !== 'pending_verification') {
      return res.status(400).json({ success: false, message: 'Only pending tutor profiles can be rejected' });
    }

    await sequelize.transaction(async transaction => {
      await tutor.update({
        verificationStatus: 'rejected',
        verificationNotes: reason || 'Document verification could not be completed.'
      }, { transaction });
      await AuditLog.create({
        adminUserId,
        action: 'REJECT_TUTOR_VERIFICATION',
        entityType: 'tutor_profile',
        entityId: tutor.id,
        details: `Rejected verification for tutor user ${tutor.userId}: ${reason || 'Incomplete credentials'}`,
      }, { transaction });
    });

    await createNotification({
      recipientUserId: tutor.userId,
      type: 'GENERAL',
      title: 'Tutor verification update',
      message: `Your verification submission was not approved. Reason: ${reason || 'Credentials could not be verified'}. You can update your profile and resubmit.`,
      relatedEntityType: 'tutor_profile',
      relatedEntityId: tutor.id
    });

    return res.status(200).json({
      success: true,
      message: 'Tutor verification rejected',
      data: tutor
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingTutorVerifications,
  verifyTutor,
  rejectTutorVerification
};
