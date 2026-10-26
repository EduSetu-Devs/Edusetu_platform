const { Op } = require('sequelize');
const {
  TutorProfile,
  TutorSubject,
  TutorAvailability,
  TutorReview,
  User,
  TeacherProfile,
  StudentProfile,
  ParentProfile,
  ParentStudent
} = require('../models');
const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};
const { getTutorAssignmentDecision } = require('../utils/tutorAssignmentEligibility');
const { scoreTutorRecommendations } = require('../utils/tutorRecommendationScoring');

/**
 * Search and discover tutors with multi-criteria filtering
 * Public endpoint: GET /api/tutors
 */
const searchTutors = async (req, res, next) => {
  try {
    const {
      subject,
      city,
      area,
      teachingMode,
      minRate,
      maxRate,
      minExperience,
      minRating,
      qualification,
      availability,
      verifiedOnly,
      verified,
      sort = 'rating_desc',
      page = 1,
      limit = 12
    } = req.query;

    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;
    const minimumRate = req.query.minFee ?? minRate;
    const maximumRate = req.query.maxFee ?? maxRate;
    const minimumExperience = req.query.experience ?? minExperience;
    const minimumRating = req.query.rating ?? minRating;

    const textFilters = [subject, city, area, qualification, availability];
    if (textFilters.some(value => value !== undefined && typeof value !== 'string')) {
      return res.status(400).json({ success: false, message: 'Search filters must be single text values' });
    }
    const validAvailabilityDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (availability && !validAvailabilityDays.includes(availability.trim().toLowerCase())) {
      return res.status(400).json({ success: false, message: 'availability must be a weekday name' });
    }

    const numericFilters = [
      ['minFee', minimumRate, 0, Number.MAX_SAFE_INTEGER],
      ['maxFee', maximumRate, 0, Number.MAX_SAFE_INTEGER],
      ['experience', minimumExperience, 0, Number.MAX_SAFE_INTEGER],
      ['rating', minimumRating, 0, 5]
    ];
    for (const [name, value, min, max] of numericFilters) {
      if (value !== undefined && value !== '' &&
          (!Number.isFinite(Number(value)) || Number(value) < min || Number(value) > max)) {
        return res.status(400).json({ success: false, message: `${name} must be a valid value between ${min} and ${max}` });
      }
    }

    // Build TutorProfile where clause
    const whereClause = { isProfileActive: true, isAvailable: true };

    if (city && city.trim() !== '') {
      whereClause.city = { [Op.like]: `%${city.trim()}%` };
    }

    if (area && area.trim() !== '') {
      whereClause.area = { [Op.like]: `%${area.trim()}%` };
    }

    if (teachingMode && ['online', 'offline', 'both'].includes(teachingMode)) {
      if (teachingMode === 'both') {
        whereClause.teachingMode = { [Op.in]: ['online', 'offline', 'both'] };
      } else {
        whereClause.teachingMode = { [Op.in]: [teachingMode, 'both'] };
      }
    }

    if (minimumRate !== undefined || maximumRate !== undefined) {
      whereClause.hourlyRate = {};
      if (minimumRate !== undefined && minimumRate !== '') whereClause.hourlyRate[Op.gte] = Number(minimumRate);
      if (maximumRate !== undefined && maximumRate !== '') whereClause.hourlyRate[Op.lte] = Number(maximumRate);
    }

    if (minimumExperience !== undefined && minimumExperience !== '') {
      whereClause.experienceYears = { [Op.gte]: Number.parseInt(minimumExperience, 10) };
    }

    if (minimumRating !== undefined && minimumRating !== '') {
      whereClause.rating = { [Op.gte]: Number(minimumRating) };
    }

    if (verifiedOnly === 'true' || verifiedOnly === true || verified === 'true' || verified === true) {
      whereClause.verificationStatus = 'verified';
    }
    if (qualification && qualification.trim()) {
      whereClause[Op.or] = [
        { qualifications: { [Op.like]: `%${qualification.trim()}%` } },
        { degree: { [Op.like]: `%${qualification.trim()}%` } }
      ];
    }

    // Build subject include/filter
    const subjectInclude = {
      model: TutorSubject,
      as: 'subjects',
      required: false
    };

    if (subject && subject.trim() !== '') {
      subjectInclude.where = {
        subjectName: { [Op.like]: `%${subject.trim()}%` }
      };
      subjectInclude.required = true; // inner join when filtering by subject
    }

    // Sorting options
    let order = [['rating', 'DESC'], ['reviewsCount', 'DESC']];
    if (sort === 'rate_asc') order = [['hourlyRate', 'ASC']];
    else if (sort === 'rate_desc') order = [['hourlyRate', 'DESC']];
    else if (sort === 'experience_desc') order = [['experienceYears', 'DESC']];
    else if (sort === 'rating_desc') order = [['rating', 'DESC'], ['reviewsCount', 'DESC']];

    const { count, rows } = await TutorProfile.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          where: { role: 'teacher', isActive: true },
          required: true,
          attributes: ['id', 'name', 'profileImage', 'createdAt']
        },
        subjectInclude,
        {
          model: TutorAvailability,
          as: 'availabilities',
          where: {
            isSlotActive: true,
            ...(availability && availability.trim() ? { dayOfWeek: availability.toLowerCase().trim() } : {})
          },
          required: Boolean(availability && availability.trim())
        }
      ],
      order,
      limit: limitNum,
      offset,
      distinct: true
    });

    const formattedTutors = rows.map(tutor => {
      const plain = tutor.get({ plain: true });
      return {
        id: plain.id,
        userId: plain.userId,
        name: plain.user?.name || 'Tutor',
        profilePicture: plain.user?.profileImage || null,
        headline: plain.headline || 'Dedicated Educator',
        bio: plain.bio || '',
        qualifications: plain.qualifications || '',
        degree: plain.degree || '',
        university: plain.university || '',
        experienceYears: plain.experienceYears || 0,
        teachingMode: plain.teachingMode,
        city: plain.city || '',
        area: plain.area || '',
        hourlyRate: Number(plain.hourlyRate) || 0,
        monthlyRate: Number(plain.monthlyRate) || 0,
        languages: parseJsonArray(plain.languages),
        rating: plain.reviewsCount ? Number(plain.rating) : 0,
        reviewsCount: plain.reviewsCount || 0,
        totalStudentsTaught: plain.totalStudentsTaught || 0,
        verificationStatus: plain.verificationStatus,
        isVerified: plain.verificationStatus === 'verified',
        isAvailable: plain.isAvailable,
        subjects: (plain.subjects || []).map(s => ({
          id: s.id,
          subjectName: s.subjectName,
          gradeLevels: parseJsonArray(s.gradeLevels),
          hourlyRate: s.hourlyRate ? Number(s.hourlyRate) : Number(plain.hourlyRate)
        })),
        availabilitiesCount: (plain.availabilities || []).length
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        tutors: formattedTutors,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getRecommendedTutors = async (req, res, next) => {
  try {
    const { subject, budget, language, availability, studentProfileId } = req.query;
    if ([subject, language, availability].some(value => value !== undefined && typeof value !== 'string')) {
      return res.status(400).json({ success: false, message: 'Recommendation preferences must be text values' });
    }
    if (subject?.trim().length > 100 || language?.trim().length > 50) {
      return res.status(400).json({ success: false, message: 'Subject or language preference is too long' });
    }
    if (budget !== undefined && (!Number.isFinite(Number(budget)) || Number(budget) < 0)) {
      return res.status(400).json({ success: false, message: 'Budget must be a non-negative number' });
    }
    const day = availability?.trim().toLowerCase();
    if (day && !['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(day)) {
      return res.status(400).json({ success: false, message: 'Availability must be a weekday name' });
    }

    let student;
    if (req.user.role === 'student') {
      student = await StudentProfile.findOne({ where: { userId: req.user.id } });
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
      if (!getTutorAssignmentDecision(student, 'student').canRequest) {
        return res.status(403).json({ success: false, message: 'Tutor recommendations are unavailable until this account is eligible to request a tutor' });
      }
    } else {
      const parent = await ParentProfile.findOne({ where: { userId: req.user.id } });
      if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found' });
      const linkWhere = { parentProfileId: parent.id };
      if (studentProfileId !== undefined) {
        const parsedStudentId = Number(studentProfileId);
        if (!Number.isSafeInteger(parsedStudentId) || parsedStudentId < 1) {
          return res.status(400).json({ success: false, message: 'Student profile ID is invalid' });
        }
        linkWhere.studentProfileId = parsedStudentId;
      }
      const links = await ParentStudent.findAll({
        where: linkWhere,
        include: [{ model: StudentProfile, as: 'studentProfile' }],
        order: [['createdAt', 'ASC']]
      });
      const eligibleLink = links.find(link =>
        link.studentProfile && getTutorAssignmentDecision(link.studentProfile, 'parent').canRequest
      );
      if (!eligibleLink) {
        return res.status(403).json({ success: false, message: 'No linked student is currently eligible for parent-managed tutor recommendations' });
      }
      student = eligibleLink.studentProfile;
    }

    const tutors = await TutorProfile.findAll({
      where: { isProfileActive: true, isAvailable: true },
      include: [
        {
          model: User,
          as: 'user',
          where: { role: 'teacher', isActive: true },
          required: true,
          attributes: ['id', 'name', 'profileImage']
        },
        { model: TutorSubject, as: 'subjects', required: false },
        {
          model: TutorAvailability,
          as: 'availabilities',
          where: { isSlotActive: true },
          required: false
        }
      ]
    });

    const recommendations = scoreTutorRecommendations(
      tutors.map(tutor => tutor.get({ plain: true })),
      { subject: subject?.trim() || '', budget: budget === undefined ? null : Number(budget), language: language?.trim() || '', availability: day || '' },
      student.className || ''
    );
    return res.status(200).json({ success: true, data: { recommendations: recommendations.slice(0, 8) } });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single tutor public profile by ID
 * Public endpoint: GET /api/tutors/:id
 */
const getTutorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tutor = await TutorProfile.findOne({
      where: { id, isProfileActive: true },
      include: [
        {
          model: User,
          as: 'user',
          where: { role: 'teacher', isActive: true },
          required: true,
          attributes: ['id', 'name', 'profileImage', 'createdAt']
        },
        {
          model: TutorSubject,
          as: 'subjects'
        },
        {
          model: TutorAvailability,
          as: 'availabilities',
          where: { isSlotActive: true },
          required: false
        },
        {
          model: TutorReview,
          as: 'reviews',
          include: [
            {
              model: User,
              as: 'reviewer',
              attributes: ['id', 'name', 'role', 'profileImage']
            }
          ],
          limit: 20,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    const plain = tutor.get({ plain: true });

    const formattedTutor = {
      id: plain.id,
      userId: plain.userId,
      name: plain.user?.name || 'Tutor',
      profilePicture: plain.user?.profileImage || null,
      headline: plain.headline || 'Dedicated Educator',
      bio: plain.bio || '',
      qualifications: plain.qualifications || '',
      degree: plain.degree || '',
      university: plain.university || '',
      experienceYears: plain.experienceYears || 0,
      teachingExperience: plain.teachingExperience || '',
      teachingMode: plain.teachingMode,
      city: plain.city || '',
      area: plain.area || '',
      hourlyRate: Number(plain.hourlyRate) || 0,
      monthlyRate: Number(plain.monthlyRate) || 0,
      languages: parseJsonArray(plain.languages),
      demoVideoUrl: plain.demoVideoUrl || '',
      socialLinks: plain.socialLinks || {},
      rating: plain.reviewsCount ? Number(plain.rating) : 0,
      reviewsCount: plain.reviewsCount || 0,
      totalStudentsTaught: plain.totalStudentsTaught || 0,
      verificationStatus: plain.verificationStatus,
      isVerified: plain.verificationStatus === 'verified',
      isAvailable: plain.isAvailable,
      subjects: (plain.subjects || []).map(s => ({
        id: s.id,
        subjectName: s.subjectName,
        gradeLevels: parseJsonArray(s.gradeLevels),
        hourlyRate: s.hourlyRate ? Number(s.hourlyRate) : Number(plain.hourlyRate),
        description: s.description || ''
      })),
      availabilities: (plain.availabilities || []).map(a => ({
        id: a.id,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        mode: a.mode
      })),
      reviews: (plain.reviews || []).map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        isVerifiedPurchase: r.isVerifiedPurchase,
        reviewer: {
          id: r.reviewer?.id,
          name: r.reviewer?.name || 'Learner',
          role: r.reviewer?.role || r.reviewerRole,
          profilePicture: r.reviewer?.profileImage || null
        }
      }))
    };

    return res.status(200).json({
      success: true,
      data: formattedTutor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Compare up to 3 tutors side by side
 * Public endpoint: POST /api/tutors/compare
 */
const compareTutors = async (req, res, next) => {
  try {
    const { tutorIds } = req.body;

    if (!Array.isArray(tutorIds) || tutorIds.length === 0 || tutorIds.length > 3 ||
        tutorIds.some(id => !Number.isInteger(Number(id)) || Number(id) < 1)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide between 1 and 3 valid tutor IDs to compare'
      });
    }

    const selectedIds = [...new Set(tutorIds.map(Number))];

    const tutors = await TutorProfile.findAll({
      where: {
        id: { [Op.in]: selectedIds },
        isProfileActive: true,
        isAvailable: true
      },
      include: [
        {
          model: User,
          as: 'user',
          where: { role: 'teacher', isActive: true },
          required: true,
          attributes: ['id', 'name', 'profileImage']
        },
        {
          model: TutorSubject,
          as: 'subjects'
        },
        {
          model: TutorAvailability,
          as: 'availabilities',
          where: { isSlotActive: true },
          required: false
        }
      ]
    });

    const formattedList = tutors.map(t => {
      const plain = t.get({ plain: true });
      return {
        id: plain.id,
        userId: plain.userId,
        name: plain.user?.name || 'Tutor',
        profilePicture: plain.user?.profileImage || null,
        headline: plain.headline || '',
        bio: plain.bio || '',
        qualifications: plain.qualifications || '',
        degree: plain.degree || '',
        university: plain.university || '',
        experienceYears: plain.experienceYears || 0,
        teachingMode: plain.teachingMode,
        city: plain.city || '',
        area: plain.area || '',
        hourlyRate: Number(plain.hourlyRate) || 0,
        monthlyRate: Number(plain.monthlyRate) || 0,
        languages: parseJsonArray(plain.languages),
        rating: plain.reviewsCount ? Number(plain.rating) : 0,
        reviewsCount: plain.reviewsCount || 0,
        totalStudentsTaught: plain.totalStudentsTaught || 0,
        verificationStatus: plain.verificationStatus,
        isVerified: plain.verificationStatus === 'verified',
        isAvailable: plain.isAvailable,
        subjects: (plain.subjects || []).map(s => s.subjectName),
        subjectDetails: (plain.subjects || []).map(s => ({
          subjectName: s.subjectName,
gradeLevels: parseJsonArray(s.gradeLevels),
        })),
        availabilitiesCount: (plain.availabilities || []).length
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedList
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchTutors,
  getRecommendedTutors,
  getTutorById,
  compareTutors
};
