const { User, StudentProfile } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { getStudentAge } = require('../utils/tutorAssignmentEligibility');

/**
 * Helper to retrieve or lazily ensure a StudentProfile exists for the student user
 */
const getOrCreateStudentProfile = async (userId) => {
  let profile = await StudentProfile.findOne({ where: { userId } });
  if (!profile) {
    const timestampPart = Date.now().toString().slice(-4);
    const generatedId = `STU${String(userId).padStart(3, '0')}${timestampPart}`;
    profile = await StudentProfile.create({
      userId,
      studentId: generatedId
    });
  }
  return profile;
};

/**
 * Get Authenticated Student Profile
 * @route GET /api/student/profile
 */
const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user and student profile
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return errorResponse(res, 404, 'Student account not found');
    }

    const studentProfile = await getOrCreateStudentProfile(userId);

    const combinedProfile = {
      id: user.id,
      studentId: studentProfile.studentId,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      profileImage: user.profileImage || '',
      className: studentProfile.className || '',
      section: studentProfile.section || '',
      rollNumber: studentProfile.rollNumber || '',
      dateOfBirth: studentProfile.dateOfBirth || null,
      gender: studentProfile.gender || '',
      address: studentProfile.address || '',
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: studentProfile.updatedAt
    };

    return successResponse(res, 200, 'Student profile retrieved successfully', combinedProfile);

  } catch (error) {
    console.error('[Get Student Profile Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve student profile');
  }
};

/**
 * Update Authenticated Student Profile
 * @route PUT /api/student/profile
 */
const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      phone,
      profileImage,
      className,
      section,
      rollNumber,
      dateOfBirth,
      gender,
      address
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse(res, 404, 'Student account not found');
    }

    const studentProfile = await getOrCreateStudentProfile(userId);

    // 1. Update Allowed User fields
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return errorResponse(res, 400, 'Name must be at least 2 characters long');
      }
      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.phone = typeof phone === 'string' ? phone.trim() : '';
    }

    if (profileImage !== undefined) {
      user.profileImage = typeof profileImage === 'string' ? profileImage.trim() : '';
    }

    // 2. Update Allowed StudentProfile fields
    if (className !== undefined) studentProfile.className = String(className).trim();
    if (section !== undefined) studentProfile.section = String(section).trim();
    if (rollNumber !== undefined) studentProfile.rollNumber = String(rollNumber).trim();
    if (gender !== undefined) studentProfile.gender = String(gender).trim();
    if (address !== undefined) studentProfile.address = String(address).trim();
    if (dateOfBirth !== undefined) {
      if (dateOfBirth !== null && dateOfBirth !== '' &&
          (typeof dateOfBirth !== 'string' || getStudentAge(dateOfBirth).reason)) {
        return errorResponse(res, 400, 'Date of birth must be a valid date in the past using YYYY-MM-DD format');
      }
      const nextDateOfBirth = dateOfBirth || null;
      if (studentProfile.dateOfBirth !== nextDateOfBirth) {
        studentProfile.ageVerificationStatus = nextDateOfBirth ? 'pending' : 'unverified';
        studentProfile.ageVerifiedAt = null;
        studentProfile.ageVerifiedByUserId = null;
      } else if (nextDateOfBirth &&
          ['unverified', 'rejected'].includes(studentProfile.ageVerificationStatus)) {
        studentProfile.ageVerificationStatus = 'pending';
      }
      studentProfile.dateOfBirth = nextDateOfBirth;
    }

    await user.save();
    await studentProfile.save();

    const updatedProfile = {
      id: user.id,
      studentId: studentProfile.studentId,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profileImage: user.profileImage,
      className: studentProfile.className,
      section: studentProfile.section,
      rollNumber: studentProfile.rollNumber,
      dateOfBirth: studentProfile.dateOfBirth,
      ageVerificationStatus: studentProfile.ageVerificationStatus,
      gender: studentProfile.gender,
      address: studentProfile.address,
      updatedAt: studentProfile.updatedAt
    };

    return successResponse(res, 200, 'Student profile updated successfully', updatedProfile);

  } catch (error) {
    console.error('[Update Student Profile Error]:', error.message);
    if (error.name === 'SequelizeValidationError') {
      return errorResponse(res, 400, error.errors[0]?.message || 'Validation error');
    }
    return errorResponse(res, 500, 'Failed to update student profile');
  }
};

/**
 * Get Student Dashboard Summary
 * @route GET /api/student/dashboard
 */
const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return errorResponse(res, 404, 'Student account not found');
    }

    const studentProfile = await getOrCreateStudentProfile(userId);

    const dashboardData = {
      message: `Welcome back to EduSetu, ${user.name}!`,
      student: {
        id: user.id,
        name: user.name,
        email: user.email,
        studentId: studentProfile.studentId,
        className: studentProfile.className || 'Not Assigned',
        section: studentProfile.section || 'N/A',
        rollNumber: studentProfile.rollNumber || 'N/A',
        role: user.role
      },
      modules: {
        attendance: { title: 'Attendance', status: 'Upcoming Feature' },
        homework: { title: 'Homework & Tasks', status: 'Upcoming Feature' },
        marks: { title: 'Academic Marks', status: 'Upcoming Feature' },
        announcements: { title: 'School Notices', status: 'Upcoming Feature' }
      }
    };

    return successResponse(res, 200, 'Student dashboard loaded successfully', dashboardData);

  } catch (error) {
    console.error('[Student Dashboard Error]:', error.message);
    return errorResponse(res, 500, 'Failed to load student dashboard');
  }
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  getStudentDashboard
};
