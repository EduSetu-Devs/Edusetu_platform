const { TutorShortlist, TutorProfile, TutorSubject, User } = require('../models');

/**
 * Toggle bookmark/shortlist for a tutor
 * Endpoint: POST /api/tutors/:id/shortlist
 */
const toggleShortlist = async (req, res, next) => {
  try {
    const tutorProfileId = req.params.id;
    const userId = req.user.id;
    const { notes } = req.body;

    const tutor = await TutorProfile.findByPk(tutorProfileId);
    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: 'Tutor profile not found'
      });
    }

    const existing = await TutorShortlist.findOne({
      where: { userId, tutorProfileId }
    });

    if (existing) {
      await existing.destroy();
      return res.status(200).json({
        success: true,
        isShortlisted: false,
        message: 'Tutor removed from shortlist'
      });
    } else {
      await TutorShortlist.create({
        userId,
        tutorProfileId,
        notes: notes || ''
      });
      return res.status(201).json({
        success: true,
        isShortlisted: true,
        message: 'Tutor saved to shortlist'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's shortlisted tutors
 * Endpoint: GET /api/tutors/my-shortlist
 */
const getMyShortlist = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const shortlists = await TutorShortlist.findAll({
      where: { userId },
      include: [
        {
          model: TutorProfile,
          as: 'tutorProfile',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'profileImage']
            },
            {
              model: TutorSubject,
              as: 'subjects'
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formatted = shortlists.map(item => {
      const tutor = item.tutorProfile;
      const plain = tutor ? tutor.get({ plain: true }) : null;
      return {
        shortlistId: item.id,
        notes: item.notes,
        createdAt: item.createdAt,
        tutor: plain
          ? {
              id: plain.id,
              userId: plain.userId,
              name: plain.user?.name || 'Tutor',
              profilePicture: plain.user?.profileImage || null,
              headline: plain.headline || '',
              qualifications: plain.qualifications || '',
              experienceYears: plain.experienceYears || 0,
              hourlyRate: Number(plain.hourlyRate) || 0,
              city: plain.city || '',
              area: plain.area || '',
              rating: plain.reviewsCount ? Number(plain.rating) : 0,
              reviewsCount: plain.reviewsCount || 0,
              verificationStatus: plain.verificationStatus,
              isVerified: plain.verificationStatus === 'verified',
              subjects: (plain.subjects || []).map(s => s.subjectName)
            }
          : null
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleShortlist,
  getMyShortlist
};
