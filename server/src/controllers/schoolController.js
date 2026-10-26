const { Op } = require('sequelize');
const { SchoolProfile, TutorProfile, TutorSubject, User } = require('../models');

/**
 * Get school profile for the current user
 * Endpoint: GET /api/school/profile
 */
const getSchoolProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let school = await SchoolProfile.findOne({ where: { userId } });

    if (!school) {
      return res.status(200).json({
        success: true,
        data: {
          exists: false,
          profile: {
            userId,
            institutionName: '',
            institutionType: 'school',
            affiliation: 'CBSE',
            registrationNumber: '',
            city: '',
            area: '',
            pincode: '',
            address: '',
            contactEmail: req.user.email || '',
            contactPhone: '',
            website: '',
            description: '',
            requiredSubjects: [],
            requiredQualifications: ''
          }
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        exists: true,
        profile: school
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create or update school profile
 * Endpoint: POST /api/school/profile
 */
const upsertSchoolProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      institutionName,
      institutionType,
      affiliation,
      registrationNumber,
      city,
      area,
      pincode,
      address,
      contactEmail,
      contactPhone,
      website,
      description,
      requiredSubjects,
      requiredQualifications
    } = req.body;

    if (!institutionName || institutionName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Institution name is required'
      });
    }

    let school = await SchoolProfile.findOne({ where: { userId } });

    const payload = {
      institutionName: institutionName.trim(),
      institutionType: institutionType || 'school',
      affiliation: affiliation || '',
      registrationNumber: registrationNumber || '',
      city: city || '',
      area: area || '',
      pincode: pincode || '',
      address: address || '',
      contactEmail: contactEmail || req.user.email || '',
      contactPhone: contactPhone || '',
      website: website || '',
      description: description || '',
      requiredSubjects: Array.isArray(requiredSubjects) ? requiredSubjects : [],
      requiredQualifications: requiredQualifications || ''
    };

    if (school) {
      await school.update(payload);
    } else {
      school = await SchoolProfile.create({
        userId,
        ...payload
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Institution profile saved successfully',
      data: school
    });
  } catch (error) {
    next(error);
  }
};

/**
 * School portal: Search prospective teachers and faculty candidates
 * Endpoint: GET /api/school/tutors
 */
const searchTeachersForSchool = async (req, res, next) => {
  try {
    const {
      subject,
      qualification,
      minExperience,
      city,
      area,
      mode,
      verifiedOnly
    } = req.query;

    const whereClause = {
      isProfileActive: true
    };

    if (city && city.trim() !== '') {
      whereClause.city = { [Op.like]: `%${city.trim()}%` };
    }

    if (area && area.trim() !== '') {
      whereClause.area = { [Op.like]: `%${area.trim()}%` };
    }

    if (minExperience) {
      whereClause.experienceYears = { [Op.gte]: parseInt(minExperience, 10) };
    }

    if (qualification && qualification.trim() !== '') {
      whereClause[Op.or] = [
        { qualifications: { [Op.like]: `%${qualification.trim()}%` } },
        { degree: { [Op.like]: `%${qualification.trim()}%` } }
      ];
    }

    if (mode && ['online', 'offline', 'both'].includes(mode)) {
      whereClause.teachingMode = mode === 'both'
        ? { [Op.in]: ['online', 'offline', 'both'] }
        : { [Op.in]: [mode, 'both'] };
    }

    if (verifiedOnly === 'true' || verifiedOnly === true) {
      whereClause.verificationStatus = 'verified';
    }

    const subjectInclude = {
      model: TutorSubject,
      as: 'subjects',
      required: false
    };

    if (subject && subject.trim() !== '') {
      subjectInclude.where = {
        subjectName: { [Op.like]: `%${subject.trim()}%` }
      };
      subjectInclude.required = true;
    }

    const tutors = await TutorProfile.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          where: { role: 'teacher', isActive: true },
          attributes: ['id', 'name', 'profileImage']
        },
        subjectInclude
      ],
      order: [['rating', 'DESC'], ['experienceYears', 'DESC']],
      limit: 30
    });

    const formatted = tutors.map(t => {
      const plain = t.get({ plain: true });
      return {
        id: plain.id,
        userId: plain.userId,
        name: plain.user?.name || 'Candidate',
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
        rating: plain.reviewsCount ? Number(plain.rating) : 0,
        reviewsCount: plain.reviewsCount || 0,
        verificationStatus: plain.verificationStatus,
        isVerified: plain.verificationStatus === 'verified',
        resumeUrl: plain.resumeUrl || '',
        subjects: (plain.subjects || []).map(s => s.subjectName)
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
  getSchoolProfile,
  upsertSchoolProfile,
  searchTeachersForSchool
};
