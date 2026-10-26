const { fn, col } = require('sequelize');
const {
  sequelize,
  TutorReview,
  TutorProfile,
  User,
  TeachingSession,
  TeacherProfile,
  StudentProfile,
  ParentProfile,
  ParentStudent
} = require('../models');

const getTutorReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tutor = await TutorProfile.findByPk(id);
    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor profile not found' });
    }

    const reviews = await TutorReview.findAll({
      where: { tutorProfileId: id },
      include: [{
        model: User,
        as: 'reviewer',
        attributes: ['id', 'name', 'role', 'profileImage']
      }],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    return res.status(200).json({
      success: true,
      data: {
        tutorId: id,
        rating: tutor.reviewsCount ? Number(tutor.rating) : 0,
        reviewsCount: tutor.reviewsCount || 0,
        reviews
      }
    });
  } catch (error) {
    next(error);
  }
};

const getReviewableTutorSessions = async (req, res, next) => {
  try {
    const tutor = await TutorProfile.findByPk(req.params.id);
    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor profile not found' });
    }

    let studentProfileIds = [];
    if (req.user.role === 'student') {
      const student = await StudentProfile.findOne({ where: { userId: req.user.id } });
      if (student) studentProfileIds = [student.id];
    } else if (req.user.role === 'parent') {
      const parent = await ParentProfile.findOne({ where: { userId: req.user.id } });
      if (parent) {
        const linkedStudents = await ParentStudent.findAll({
          where: { parentProfileId: parent.id },
          attributes: ['studentProfileId']
        });
        studentProfileIds = linkedStudents.map(link => link.studentProfileId);
      }
    } else {
      return res.status(403).json({ success: false, message: 'Only students or parents can review a tutor' });
    }

    const teacher = await TeacherProfile.findOne({ where: { userId: tutor.userId } });
    const sessions = teacher && studentProfileIds.length
      ? await TeachingSession.findAll({
          where: {
            teacherProfileId: teacher.id,
            studentProfileId: studentProfileIds,
            status: 'COMPLETED'
          },
          attributes: ['id', 'title', 'scheduledDate'],
          order: [['scheduledDate', 'DESC']]
        })
      : [];

    const existingReviews = sessions.length
      ? await TutorReview.findAll({
          where: {
            reviewerUserId: req.user.id,
            teachingSessionId: sessions.map(session => session.id)
          },
          attributes: ['teachingSessionId']
        })
      : [];
    const reviewedSessionIds = new Set(existingReviews.map(review => review.teachingSessionId));

    return res.status(200).json({
      success: true,
      data: sessions
        .filter(session => !reviewedSessionIds.has(session.id))
        .map(session => ({
          id: session.id,
          title: session.title,
          scheduledDate: session.scheduledDate
        }))
    });
  } catch (error) {
    next(error);
  }
};

const createTutorReview = async (req, res, next) => {
  try {
    const tutorProfileId = req.params.id;
    const reviewerUserId = req.user.id;
    const reviewerRole = req.user.role;
    const { rating, comment, teachingSessionId } = req.body;
    const tutor = await TutorProfile.findByPk(tutorProfileId);

    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor profile not found' });
    }
    if (tutor.userId === reviewerUserId) {
      return res.status(400).json({ success: false, message: 'You cannot review your own tutor profile' });
    }
    if (!['student', 'parent'].includes(reviewerRole)) {
      return res.status(403).json({ success: false, message: 'Only students or parents can review a tutor' });
    }

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
    }
    if (!teachingSessionId) {
      return res.status(400).json({
        success: false,
        message: 'A completed teaching session is required to submit a review'
      });
    }

    const teacherProfile = await TeacherProfile.findOne({ where: { userId: tutor.userId } });
    const session = teacherProfile && await TeachingSession.findOne({
      where: {
        id: teachingSessionId,
        teacherProfileId: teacherProfile.id,
        status: 'COMPLETED'
      },
      include: [{ model: StudentProfile, as: 'studentProfile' }]
    });

    if (!session?.studentProfile) {
      return res.status(403).json({
        success: false,
        message: 'You can only review a completed session with this tutor'
      });
    }

    let eligible = session.studentProfile.userId === reviewerUserId;
    if (reviewerRole === 'parent') {
      const parentProfile = await ParentProfile.findOne({ where: { userId: reviewerUserId } });
      eligible = Boolean(parentProfile && await ParentStudent.findOne({
        where: {
          parentProfileId: parentProfile.id,
          studentProfileId: session.studentProfile.id
        }
      }));
    }
    if (!eligible) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to review this teaching session'
      });
    }

    const { review, averageRating, count } = await sequelize.transaction(async transaction => {
      const lockedSession = await TeachingSession.findByPk(session.id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!lockedSession || lockedSession.status !== 'COMPLETED') {
        const error = new Error('You can only review a completed session with this tutor');
        error.status = 403;
        throw error;
      }

      const existingReview = await TutorReview.findOne({
        where: { teachingSessionId: session.id, reviewerUserId },
        transaction
      });
      if (existingReview) {
        const error = new Error('You have already reviewed this teaching session');
        error.status = 409;
        throw error;
      }

      const createdReview = await TutorReview.create({
        tutorProfileId,
        tutorUserId: tutor.userId,
        reviewerUserId,
        reviewerRole,
        rating: numRating,
        comment: typeof comment === 'string' ? comment.trim() : '',
        teachingSessionId: session.id,
        isVerifiedPurchase: true
      }, { transaction });

      const aggregate = await TutorReview.findOne({
        where: { tutorProfileId },
        attributes: [
          [fn('AVG', col('rating')), 'averageRating'],
          [fn('COUNT', col('id')), 'reviewsCount']
        ],
        raw: true,
        transaction
      });
      const reviewCount = Number(aggregate.reviewsCount) || 0;
      const average = reviewCount ? Number(Number(aggregate.averageRating).toFixed(2)) : 0;
      await tutor.update({ rating: average, reviewsCount: reviewCount }, { transaction });
      return { review: createdReview, averageRating: average, count: reviewCount };
    });

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: {
        review,
        updatedTutorRating: averageRating,
        updatedReviewsCount: count
      }
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = { getTutorReviews, getReviewableTutorSessions, createTutorReview };
