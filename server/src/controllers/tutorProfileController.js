const { sequelize, TutorProfile, TutorSubject, TutorAvailability, User, TeacherProfile } = require('../models');
const { createNotification } = require('../services/notificationService');

/**
 * Get the authenticated teacher's own tutor profile
 * Endpoint: GET /api/tutor/my-profile
 */
const getMyTutorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let tutor = await TutorProfile.findOne({
      where: { userId },
      include: [
        {
          model: TutorSubject,
          as: 'subjects'
        },
        {
          model: TutorAvailability,
          as: 'availabilities'
        }
      ]
    });

    const teacher = await TeacherProfile.findOne({ where: { userId } });

    if (!tutor) {
      return res.status(200).json({
        success: true,
        data: {
          exists: false,
          profile: {
            userId,
            headline: teacher?.designation ? `${teacher.designation} Educator` : 'Experienced Educator',
            bio: '',
            qualifications: '',
            degree: '',
            university: '',
            experienceYears: 0,
            teachingExperience: '',
            teachingMode: 'both',
            city: '',
            area: '',
            pincode: '',
            hourlyRate: 0,
            monthlyRate: 0,
            languages: ['English'],
            verificationStatus: 'draft',
            isAvailable: true,
            isProfileActive: true,
            subjects: Array.isArray(teacher?.subjects)
              ? teacher.subjects.map(s => ({ subjectName: typeof s === 'string' ? s : s.name || 'General', gradeLevels: [] }))
              : [],
            availabilities: []
          }
        }
      });
    }

    const plain = tutor.get({ plain: true });

    return res.status(200).json({
      success: true,
      data: {
        exists: true,
        profile: {
          ...plain,
          hourlyRate: Number(plain.hourlyRate) || 0,
          monthlyRate: Number(plain.monthlyRate) || 0,
          rating: plain.reviewsCount ? Number(plain.rating) : 0,
          subjects: (plain.subjects || []).map(s => ({
            id: s.id,
            subjectName: s.subjectName,
            gradeLevels: Array.isArray(s.gradeLevels) ? s.gradeLevels : [],
            hourlyRate: s.hourlyRate ? Number(s.hourlyRate) : Number(plain.hourlyRate),
            description: s.description || ''
          })),
          availabilities: (plain.availabilities || []).map(a => ({
            id: a.id,
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
            mode: a.mode,
            isSlotActive: a.isSlotActive
          }))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create or update tutor profile details
 * Endpoint: POST /api/tutor/profile
 */
const upsertTutorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      headline,
      bio,
      qualifications,
      degree,
      university,
      experienceYears,
      teachingExperience,
      teachingMode,
      city,
      area,
      pincode,
      hourlyRate,
      monthlyRate,
      languages,
      demoVideoUrl,
      socialLinks,
      isAvailable,
      isProfileActive
    } = req.body;

    let tutor = await TutorProfile.findOne({ where: { userId } });

    const updateData = {
      headline: headline !== undefined ? headline : tutor?.headline,
      bio: bio !== undefined ? bio : tutor?.bio,
      qualifications: qualifications !== undefined ? qualifications : tutor?.qualifications,
      degree: degree !== undefined ? degree : tutor?.degree,
      university: university !== undefined ? university : tutor?.university,
      experienceYears: experienceYears !== undefined ? Math.max(0, parseInt(experienceYears, 10) || 0) : (tutor?.experienceYears || 0),
      teachingExperience: teachingExperience !== undefined ? teachingExperience : tutor?.teachingExperience,
      teachingMode: teachingMode !== undefined ? teachingMode : (tutor?.teachingMode || 'both'),
      city: city !== undefined ? city.trim() : tutor?.city,
      area: area !== undefined ? area.trim() : tutor?.area,
      pincode: pincode !== undefined ? pincode.trim() : tutor?.pincode,
      hourlyRate: hourlyRate !== undefined ? Math.max(0, parseFloat(hourlyRate) || 0) : (tutor?.hourlyRate || 0),
      monthlyRate: monthlyRate !== undefined ? Math.max(0, parseFloat(monthlyRate) || 0) : (tutor?.monthlyRate || 0),
      languages: Array.isArray(languages) ? languages : (tutor?.languages || []),
      demoVideoUrl: demoVideoUrl !== undefined ? demoVideoUrl : tutor?.demoVideoUrl,
      socialLinks: socialLinks !== undefined ? socialLinks : (tutor?.socialLinks || {}),
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : (tutor?.isAvailable ?? true),
      isProfileActive: isProfileActive !== undefined ? Boolean(isProfileActive) : (tutor?.isProfileActive ?? true)
    };

    if (tutor) {
      await tutor.update(updateData);
    } else {
      tutor = await TutorProfile.create({
        userId,
        ...updateData,
        verificationStatus: 'draft'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Tutor profile updated successfully',
      data: tutor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manage / Replace Tutor Subjects
 * Endpoint: POST /api/tutor/subjects
 */
const manageSubjects = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjects } = req.body;

    let tutor = await TutorProfile.findOne({ where: { userId } });
    if (!tutor) {
      tutor = await TutorProfile.create({ userId, verificationStatus: 'draft' });
    }

    if (!Array.isArray(subjects)) {
      return res.status(400).json({
        success: false,
        message: 'Subjects must be an array'
      });
    }

    // Replace all existing subjects
    await TutorSubject.destroy({ where: { tutorProfileId: tutor.id } });

    const createdSubjects = [];
    for (const sub of subjects) {
      if (sub.subjectName && sub.subjectName.trim() !== '') {
        const item = await TutorSubject.create({
          tutorProfileId: tutor.id,
          subjectName: sub.subjectName.trim(),
          gradeLevels: Array.isArray(sub.gradeLevels) ? sub.gradeLevels : [],
          hourlyRate: sub.hourlyRate ? parseFloat(sub.hourlyRate) : null,
          description: sub.description || ''
        });
        createdSubjects.push(item);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Subjects updated successfully',
      data: createdSubjects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manage / Replace Tutor Availability Slots
 * Endpoint: POST /api/tutor/availability
 */
const manageAvailability = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { availabilities } = req.body;

    let tutor = await TutorProfile.findOne({ where: { userId } });
    if (!tutor) {
      tutor = await TutorProfile.create({ userId, verificationStatus: 'draft' });
    }

    if (!Array.isArray(availabilities)) {
      return res.status(400).json({
        success: false,
        message: 'Availabilities must be an array of time slots'
      });
    }

    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const normalizedSlots = [];
    for (const slot of availabilities) {
      const day = typeof slot.dayOfWeek === 'string' ? slot.dayOfWeek.toLowerCase() : '';
      const startTime = typeof slot.startTime === 'string' ? slot.startTime : '';
      const endTime = typeof slot.endTime === 'string' ? slot.endTime : '';
      const mode = slot.mode || 'both';
      if (!validDays.includes(day) ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) ||
          startTime >= endTime ||
          !['online', 'offline', 'both'].includes(mode) ||
          (slot.isSlotActive !== undefined && typeof slot.isSlotActive !== 'boolean')) {
        return res.status(400).json({ success: false, message: 'Each availability slot must include a valid weekday, time range, mode, and active state' });
      }
      normalizedSlots.push({
        tutorProfileId: tutor.id,
        dayOfWeek: day,
        startTime,
        endTime,
        mode,
        isSlotActive: slot.isSlotActive ?? true
      });
    }

    const slotsByDay = new Map();
    for (const slot of normalizedSlots.filter(item => item.isSlotActive)) {
      const daySlots = slotsByDay.get(slot.dayOfWeek) || [];
      if (daySlots.some(existing => slot.startTime < existing.endTime && slot.endTime > existing.startTime)) {
        return res.status(400).json({ success: false, message: `Availability slots cannot overlap on ${slot.dayOfWeek}` });
      }
      daySlots.push(slot);
      slotsByDay.set(slot.dayOfWeek, daySlots);
    }

    const createdSlots = await sequelize.transaction(async transaction => {
      await TutorAvailability.destroy({ where: { tutorProfileId: tutor.id }, transaction });
      if (normalizedSlots.length === 0) return [];
      return TutorAvailability.bulkCreate(normalizedSlots, { transaction });
    });

    return res.status(200).json({
      success: true,
      message: 'Availability schedule updated successfully',
      data: createdSlots
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit Tutor Profile for Verification
 * Endpoint: POST /api/tutor/submit-verification
 */
const submitForVerification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { resumeUrl, certificateUrls, degree, university, qualifications } = req.body;

    let tutor = await TutorProfile.findOne({ where: { userId } });
    if (!tutor) {
      tutor = await TutorProfile.create({ userId });
    }

    const updates = {
      verificationStatus: 'pending_verification'
    };

    if (resumeUrl !== undefined) updates.resumeUrl = resumeUrl;
    if (Array.isArray(certificateUrls)) updates.certificateUrls = certificateUrls;
    if (degree !== undefined) updates.degree = degree;
    if (university !== undefined) updates.university = university;
    if (qualifications !== undefined) updates.qualifications = qualifications;

    await tutor.update(updates);

    // Notify admins if possible
    const adminUsers = await User.findAll({ where: { role: 'admin' }, attributes: ['id'] });
    for (const admin of adminUsers) {
      await createNotification({
        recipientUserId: admin.id,
        type: 'GENERAL',
        title: 'Tutor verification request',
        message: `${req.user.name || 'A teacher'} submitted credentials for tutor verification.`,
        relatedEntityType: 'tutor_profile',
        relatedEntityId: tutor.id
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification request submitted successfully. Our team will review your credentials.',
      data: {
        verificationStatus: tutor.verificationStatus,
        resumeUrl: tutor.resumeUrl,
        certificateUrls: tutor.certificateUrls
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyTutorProfile,
  upsertTutorProfile,
  manageSubjects,
  manageAvailability,
  submitForVerification
};
