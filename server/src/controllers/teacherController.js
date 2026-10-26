const { User, TeacherProfile } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Helper to get or lazily create a teacher profile
 */
const getTeacherProfileForUser = async (userId) => {
  let profile = await TeacherProfile.findOne({ where: { userId } });
  if (!profile) {
    const timestampPart = Date.now().toString().slice(-4);
    profile = await TeacherProfile.create({
      userId,
      teacherId: `TCH${String(userId).padStart(3, '0')}${timestampPart}`
    });
  }
  return profile;
};

/**
 * Get Authenticated Teacher Profile
 * @route GET /api/teacher/profile
 */
const getTeacherProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'role', 'phone', 'profileImage', 'isActive', 'createdAt']
    });

    if (!user) {
      return errorResponse(res, 404, 'Teacher user not found');
    }

    const teacherProfile = await getTeacherProfileForUser(userId);

    const parseSubjects = (raw) => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          return raw.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }
      return [];
    };

    const fullProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: teacherProfile.phone || user.phone || '',
      profileImage: user.profileImage || '',
      teacherId: teacherProfile.teacherId,
      department: teacherProfile.department || '',
      designation: teacherProfile.designation || '',
      subjects: parseSubjects(teacherProfile.subjects),
      className: teacherProfile.className || '',
      section: teacherProfile.section || '',
      qualification: teacherProfile.qualification || '',
      experience: teacherProfile.experience || '',
      createdAt: user.createdAt
    };

    return successResponse(res, 200, 'Teacher profile retrieved successfully', fullProfile);

  } catch (error) {
    console.error('[Get Teacher Profile Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve teacher profile');
  }
};

/**
 * Update Authenticated Teacher Profile
 * @route PUT /api/teacher/profile
 */
const updateTeacherProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      phone,
      department,
      designation,
      subjects,
      className,
      section,
      qualification,
      experience
    } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse(res, 404, 'Teacher user not found');
    }

    // 1. Update User level fields (name, phone)
    if (name !== undefined && name !== null) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return errorResponse(res, 400, 'Name must be at least 2 characters long');
      }
      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.phone = phone ? phone.trim() : '';
    }

    await user.save();

    // 2. Update TeacherProfile fields
    const teacherProfile = await getTeacherProfileForUser(userId);

    if (department !== undefined) teacherProfile.department = department ? department.trim() : '';
    if (designation !== undefined) teacherProfile.designation = designation ? designation.trim() : '';
    if (subjects !== undefined) {
      teacherProfile.subjects = Array.isArray(subjects)
        ? subjects
        : typeof subjects === 'string' && subjects.trim()
        ? subjects.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    }
    if (className !== undefined) teacherProfile.className = className ? className.trim() : '';
    if (section !== undefined) teacherProfile.section = section ? section.trim() : '';
    if (phone !== undefined) teacherProfile.phone = phone ? phone.trim() : '';
    if (qualification !== undefined) teacherProfile.qualification = qualification ? qualification.trim() : '';
    if (experience !== undefined) teacherProfile.experience = experience ? experience.trim() : '';

    await teacherProfile.save();

    const updatedProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: teacherProfile.phone,
      teacherId: teacherProfile.teacherId,
      department: teacherProfile.department,
      designation: teacherProfile.designation,
      subjects: teacherProfile.subjects,
      className: teacherProfile.className,
      section: teacherProfile.section,
      qualification: teacherProfile.qualification,
      experience: teacherProfile.experience
    };

    return successResponse(res, 200, 'Teacher profile updated successfully', updatedProfile);

  } catch (error) {
    console.error('[Update Teacher Profile Error]:', error.message);
    return errorResponse(res, 500, 'Failed to update teacher profile');
  }
};

/**
 * Get Teacher Dashboard Overview
 * @route GET /api/teacher/dashboard
 */
const getTeacherDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    const teacherProfile = await getTeacherProfileForUser(userId);

    const parseSubjects = (raw) => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          return raw.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }
      return [];
    };

    const dashboardData = {
      message: 'Welcome to EduSetu Teacher Portal',
      teacher: {
        id: user.id,
        name: user.name,
        email: user.email,
        teacherId: teacherProfile.teacherId,
        department: teacherProfile.department || 'Not Assigned',
        designation: teacherProfile.designation || 'Faculty Member',
        subjects: parseSubjects(teacherProfile.subjects),
        className: teacherProfile.className || 'Not Assigned',
        section: teacherProfile.section || ''
      },
      stats: {
        activeModules: ['Teacher Profile', 'Teacher Dashboard'],
        upcomingFeatures: ['My Students', 'Attendance Marking', 'Homework Management', 'Marks Entry']
      }
    };

    return successResponse(res, 200, 'Teacher dashboard data retrieved successfully', dashboardData);

  } catch (error) {
    console.error('[Get Teacher Dashboard Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve teacher dashboard');
  }
};

module.exports = {
  getTeacherProfile,
  updateTeacherProfile,
  getTeacherDashboard
};
