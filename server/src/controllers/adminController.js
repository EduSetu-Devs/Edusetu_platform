const { Op } = require('sequelize');
const {
  User,
  StudentProfile,
  TeacherProfile,
  ParentProfile,
  ParentStudent,
  AdminProfile,
  Class,
  Section,
  Subject,
  Attendance,
  Homework,
  HomeworkSubmission,
  Marks,
  AuditLog,
  sequelize
} = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { getStudentAge } = require('../utils/tutorAssignmentEligibility');

/**
 * Helper to record audit logs safely
 */
const recordAudit = async (adminUserId, action, entityType, entityId, details = '') => {
  try {
    await AuditLog.create({
      adminUserId,
      action,
      entityType,
      entityId: entityId ? Number(entityId) : null,
      details: typeof details === 'object' ? JSON.stringify(details) : String(details)
    });
  } catch (err) {
    console.error('[AuditLog Error]:', err.message);
  }
};

/**
 * Helper to resolve teacher profile by ID or teacherId string
 */
const findTeacherProfile = async (identifier) => {
  const isNumeric = !isNaN(Number(identifier));
  const whereClause = {};
  if (isNumeric) {
    whereClause[Op.or] = [{ id: Number(identifier) }, { teacherId: String(identifier) }];
  } else {
    whereClause.teacherId = String(identifier);
  }

  return await TeacherProfile.findOne({
    where: whereClause,
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'isActive'] }]
  });
};

/**
 * Helper to resolve student profile by ID or studentId string
 */
const findStudentProfile = async (identifier) => {
  const isNumeric = !isNaN(Number(identifier));
  const whereClause = {};
  if (isNumeric) {
    whereClause[Op.or] = [{ id: Number(identifier) }, { studentId: String(identifier) }];
  } else {
    whereClause.studentId = String(identifier);
  }

  return await StudentProfile.findOne({
    where: whereClause,
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'isActive'] }]
  });
};

/**
 * Helper to resolve parent profile by ID or parentId string
 */
const findParentProfile = async (identifier) => {
  const isNumeric = !isNaN(Number(identifier));
  const whereClause = {};
  if (isNumeric) {
    whereClause[Op.or] = [{ id: Number(identifier) }, { parentId: String(identifier) }];
  } else {
    whereClause.parentId = String(identifier);
  }

  return await ParentProfile.findOne({
    where: whereClause,
    include: [
      { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'isActive'] },
      {
        model: ParentStudent,
        as: 'parentStudents',
        include: [
          {
            model: StudentProfile,
            as: 'studentProfile',
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
          }
        ]
      }
    ]
  });
};

// ==========================================
// 1. DASHBOARD & SYSTEM METRICS
// ==========================================

/**
 * Get Comprehensive Admin System Dashboard Metrics
 * @route GET /api/admin/dashboard
 */
const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalParents,
      totalAdmins,
      totalClasses,
      totalSections,
      totalSubjects,
      totalAttendance,
      totalHomework,
      totalMarks,
      presentAttendance,
      absentAttendance,
      lateAttendance,
      leaveAttendance,
      activeHomework,
      totalSubmissions,
      onTimeSubmissions,
      lateSubmissions,
      gradeStats,
      classStats
    ] = await Promise.all([
      User.count(),
      User.count({ where: { role: 'student' } }),
      User.count({ where: { role: 'teacher' } }),
      User.count({ where: { role: 'parent' } }),
      User.count({ where: { role: 'admin' } }),
      Class.count(),
      Section.count(),
      Subject.count(),
      Attendance.count(),
      Homework.count(),
      Marks.count(),
      Attendance.count({ where: { status: 'present' } }),
      Attendance.count({ where: { status: 'absent' } }),
      Attendance.count({ where: { status: 'late' } }),
      Attendance.count({ where: { status: 'leave' } }),
      Homework.count({ where: { status: 'active' } }),
      HomeworkSubmission.count(),
      HomeworkSubmission.count({ where: { status: 'submitted' } }),
      HomeworkSubmission.count({ where: { status: 'late' } }),
      Marks.findAll({
        attributes: ['obtainedMarks', 'maxMarks'],
        raw: true
      }),
      StudentProfile.findAll({
        attributes: ['className', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['className'],
        raw: true
      })
    ]);

    const gradeDistribution = { 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, D: 0, F: 0 };
    gradeStats.forEach((m) => {
      const max = Number(m.maxMarks) || 100;
      const obt = Number(m.obtainedMarks) || 0;
      const pct = (obt / max) * 100;
      if (pct >= 90) gradeDistribution['A+']++;
      else if (pct >= 80) gradeDistribution['A']++;
      else if (pct >= 70) gradeDistribution['B+']++;
      else if (pct >= 60) gradeDistribution['B']++;
      else if (pct >= 50) gradeDistribution['C']++;
      else if (pct >= 40) gradeDistribution['D']++;
      else gradeDistribution['F']++;
    });

    const classDistribution = classStats.map((c) => ({
      className: c.className || 'Unassigned',
      count: Number(c.count)
    }));

    // Fetch recent users
    const recentUsers = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'name', 'email', 'role', 'isActive', 'createdAt']
    });

    // Fetch recent audit operations
    const recentAudits = await AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [{ model: User, as: 'adminUser', attributes: ['id', 'name', 'email'] }]
    });

    return successResponse(res, 200, 'Admin dashboard metrics retrieved', {
      stats: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalParents,
        totalAdmins,
        totalClasses,
        totalSections,
        totalSubjects,
        totalAttendance,
        totalHomework,
        totalMarks
      },
      analytics: {
        attendance: {
          present: presentAttendance,
          absent: absentAttendance,
          late: lateAttendance,
          leave: leaveAttendance,
          overallRate: totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0
        },
        homework: {
          active: activeHomework,
          totalSubmissions,
          onTimeSubmissions,
          lateSubmissions,
          completionRate: totalHomework > 0 ? Math.round((totalSubmissions / (totalHomework * (totalStudents || 1))) * 100) : 0
        },
        marks: {
          gradeDistribution
        },
        classDistribution
      },
      recentUsers,
      recentAudits
    });
  } catch (error) {
    console.error('[Admin Dashboard Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve admin dashboard metrics');
  }
};

// ==========================================
// 2. USER MANAGEMENT
// ==========================================

/**
 * Get Paginated User Directory with Search and Role/Status Filters
 * @route GET /api/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const whereClause = {};

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { name: { [Op.like]: q } },
        { email: { [Op.like]: q } },
        { phone: { [Op.like]: q } }
      ];
    }

    if (role && ['student', 'teacher', 'parent', 'admin'].includes(role.toLowerCase().trim())) {
      whereClause.role = role.toLowerCase().trim();
    }

    if (status !== undefined) {
      if (status === 'active' || status === true || status === 'true') {
        whereClause.isActive = true;
      } else if (status === 'inactive' || status === false || status === 'false') {
        whereClause.isActive = false;
      }
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'role', 'phone', 'isActive', 'createdAt', 'updatedAt'],
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC']
      ],
      limit: limitNum,
      offset
    });

    return successResponse(res, 200, 'Users retrieved successfully', {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum) || 1,
      users: rows
    });
  } catch (error) {
    console.error('[Get Admin Users Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve user directory');
  }
};

/**
 * Update User Active / Inactive Status
 * @route PATCH /api/admin/users/:userId/status
 */
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, isActive } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    let newStatus = true;
    if (typeof isActive === 'boolean') {
      newStatus = isActive;
    } else if (status !== undefined) {
      newStatus = status === 'active' || status === true || status === 'true';
    }

    // Admin Self-Protection: Admin cannot deactivate their own account
    if (Number(userId) === req.user.id && newStatus === false) {
      return errorResponse(res, 400, 'Security constraint: You cannot deactivate your own administrative account');
    }

    user.isActive = newStatus;
    await user.save();

    await recordAudit(req.user.id, 'UPDATE_USER_STATUS', 'User', user.id, {
      name: user.name,
      email: user.email,
      isActive: newStatus
    });

    return successResponse(res, 200, `User status updated to ${newStatus ? 'active' : 'inactive'}`, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('[Update User Status Error]:', error.message);
    return errorResponse(res, 500, 'Failed to update user status');
  }
};

// ==========================================
// 3. TEACHER MANAGEMENT & ASSIGNMENTS
// ==========================================

/**
 * Get Teachers Roster
 * @route GET /api/admin/teachers
 */
const getTeachers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, department, className, section } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const profileWhere = {};
    const userWhere = {};

    if (department && department.trim()) {
      profileWhere.department = { [Op.like]: `%${department.trim()}%` };
    }
    if (className && className.trim()) {
      profileWhere.className = className.trim();
    }
    if (section && section.trim()) {
      profileWhere.section = section.trim();
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      userWhere[Op.or] = [
        { name: { [Op.like]: q } },
        { email: { [Op.like]: q } },
        { phone: { [Op.like]: q } }
      ];
    }

    const { count, rows } = await TeacherProfile.findAndCountAll({
      where: profileWhere,
      include: [
        {
          model: User,
          as: 'user',
          where: userWhere,
          attributes: ['id', 'name', 'email', 'phone', 'isActive']
        }
      ],
      order: [['id', 'DESC']],
      limit: limitNum,
      offset
    });

    const formattedTeachers = rows.map((tp) => ({
      id: tp.id,
      userId: tp.userId,
      teacherId: tp.teacherId,
      name: tp.user?.name || '',
      email: tp.user?.email || '',
      phone: tp.phone || tp.user?.phone || '',
      department: tp.department || '',
      designation: tp.designation || '',
      qualification: tp.qualification || '',
      experience: tp.experience || '',
      subjects: tp.subjects || [],
      className: tp.className || '',
      section: tp.section || '',
      isActive: tp.user?.isActive ?? true
    }));

    return successResponse(res, 200, 'Teachers directory retrieved', {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum) || 1,
      teachers: formattedTeachers
    });
  } catch (error) {
    console.error('[Get Admin Teachers Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve teachers');
  }
};

/**
 * Assign / Update Teacher Class, Section & Subjects
 * @route PUT /api/admin/teachers/:teacherId/assignment
 */
const updateTeacherAssignment = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { className, section, subjects, department, designation } = req.body;

    const teacher = await findTeacherProfile(teacherId);
    if (!teacher) {
      return errorResponse(res, 404, 'Teacher profile not found');
    }

    if (className !== undefined) teacher.className = className ? className.trim() : '';
    if (section !== undefined) teacher.section = section ? section.trim().toUpperCase() : '';
    if (subjects !== undefined) {
      teacher.subjects = Array.isArray(subjects)
        ? subjects.map((s) => String(s).trim())
        : subjects
        ? [String(subjects).trim()]
        : [];
    }
    if (department !== undefined) teacher.department = department.trim();
    if (designation !== undefined) teacher.designation = designation.trim();

    await teacher.save();

    await recordAudit(req.user.id, 'ASSIGN_TEACHER', 'TeacherProfile', teacher.id, {
      teacherId: teacher.teacherId,
      className: teacher.className,
      section: teacher.section,
      subjects: teacher.subjects
    });

    return successResponse(res, 200, 'Teacher assignment updated successfully', {
      id: teacher.id,
      teacherId: teacher.teacherId,
      name: teacher.user?.name,
      email: teacher.user?.email,
      className: teacher.className,
      section: teacher.section,
      subjects: teacher.subjects,
      department: teacher.department,
      designation: teacher.designation
    });
  } catch (error) {
    console.error('[Update Teacher Assignment Error]:', error.message);
    return errorResponse(res, 500, 'Failed to update teacher assignment');
  }
};

// ==========================================
// 4. STUDENT MANAGEMENT & ASSIGNMENTS
// ==========================================

/**
 * Get Students Directory
 * @route GET /api/admin/students
 */
const getAgeVerificationRequests = async (req, res, next) => {
  try {
    const profiles = await StudentProfile.findAll({
      where: { ageVerificationStatus: 'pending' },
      attributes: ['id', 'studentId', 'className', 'dateOfBirth', 'ageVerificationStatus', 'updatedAt'],
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      order: [['updatedAt', 'ASC']],
      limit: 100
    });
    return res.status(200).json({
      success: true,
      data: profiles.map(profile => ({
        id: profile.id,
        studentId: profile.studentId,
        name: profile.user?.name || 'Student',
        className: profile.className || '',
        dateOfBirth: profile.dateOfBirth,
        ageVerificationStatus: profile.ageVerificationStatus,
        submittedAt: profile.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

const updateStudentAgeVerification = async (req, res, next) => {
  try {
    const decision = typeof req.body?.decision === 'string' ? req.body.decision.toLowerCase() : '';
    const reviewedDateOfBirth = req.body?.reviewedDateOfBirth;
    if (!['verified', 'rejected'].includes(decision) ||
        req.body?.independentlyReviewed !== true ||
        typeof reviewedDateOfBirth !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Confirm that the age record was independently reviewed and provide a valid decision'
      });
    }

    const studentProfile = await sequelize.transaction(async transaction => {
      const profile = await StudentProfile.findByPk(req.params.studentId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!profile) {
        const error = new Error('Student profile not found');
        error.status = 404;
        throw error;
      }
      if (profile.ageVerificationStatus !== 'pending') {
        const error = new Error('Only pending age-verification records can be reviewed');
        error.status = 409;
        throw error;
      }
      if (profile.dateOfBirth !== reviewedDateOfBirth) {
        const error = new Error('The student date of birth changed after review began. Refresh the pending request before deciding');
        error.status = 409;
        throw error;
      }
      if (!profile.dateOfBirth || getStudentAge(profile.dateOfBirth).reason) {
        const error = new Error('A valid profile date of birth is required before age verification');
        error.status = 400;
        throw error;
      }

      await profile.update({
        ageVerificationStatus: decision,
        ageVerifiedAt: decision === 'verified' ? new Date() : null,
        ageVerifiedByUserId: decision === 'verified' ? req.user.id : null
      }, { transaction });
      await AuditLog.create({
        adminUserId: req.user.id,
        action: decision === 'verified' ? 'VERIFY_STUDENT_AGE' : 'REJECT_STUDENT_AGE',
        entityType: 'student_profile',
        entityId: profile.id,
        details: 'Independent age eligibility review completed; no evidence documents retained'
      }, { transaction });
      return profile;
    });

    return res.status(200).json({
      success: true,
      message: decision === 'verified' ? 'Student age record verified' : 'Student age verification rejected',
      data: {
        studentProfileId: studentProfile.id,
        ageVerificationStatus: studentProfile.ageVerificationStatus
      }
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, className, section } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const profileWhere = {};
    const userWhere = {};

    if (className && className.trim()) {
      profileWhere.className = className.trim();
    }
    if (section && section.trim()) {
      profileWhere.section = section.trim();
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      userWhere[Op.or] = [
        { name: { [Op.like]: q } },
        { email: { [Op.like]: q } },
        { phone: { [Op.like]: q } }
      ];
    }

    const { count, rows } = await StudentProfile.findAndCountAll({
      where: profileWhere,
      include: [
        {
          model: User,
          as: 'user',
          where: userWhere,
          attributes: ['id', 'name', 'email', 'phone', 'isActive']
        }
      ],
      order: [['id', 'DESC']],
      limit: limitNum,
      offset
    });

    const formattedStudents = rows.map((sp) => ({
      id: sp.id,
      userId: sp.userId,
      studentId: sp.studentId,
      name: sp.user?.name || '',
      email: sp.user?.email || '',
      phone: sp.phone || sp.user?.phone || '',
      rollNumber: sp.rollNumber || '',
      className: sp.className || '',
      section: sp.section || '',
      dateOfBirth: sp.dateOfBirth,
      address: sp.address || '',
      isActive: sp.user?.isActive ?? true
    }));

    return successResponse(res, 200, 'Students directory retrieved', {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum) || 1,
      students: formattedStudents
    });
  } catch (error) {
    console.error('[Get Admin Students Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve students');
  }
};

/**
 * Assign / Update Student Class, Section & Roll Number
 * @route PUT /api/admin/students/:studentId/assignment
 */
const updateStudentAssignment = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { className, section, rollNumber } = req.body;

    const student = await findStudentProfile(studentId);
    if (!student) {
      return errorResponse(res, 404, 'Student profile not found');
    }

    if (className !== undefined) student.className = className ? className.trim() : '';
    if (section !== undefined) student.section = section ? section.trim().toUpperCase() : '';
    if (rollNumber !== undefined) student.rollNumber = rollNumber ? String(rollNumber).trim() : '';

    await student.save();

    await recordAudit(req.user.id, 'ASSIGN_STUDENT', 'StudentProfile', student.id, {
      studentId: student.studentId,
      className: student.className,
      section: student.section,
      rollNumber: student.rollNumber
    });

    return successResponse(res, 200, 'Student assignment updated successfully', {
      id: student.id,
      studentId: student.studentId,
      name: student.user?.name,
      email: student.user?.email,
      className: student.className,
      section: student.section,
      rollNumber: student.rollNumber
    });
  } catch (error) {
    console.error('[Update Student Assignment Error]:', error.message);
    return errorResponse(res, 500, 'Failed to update student assignment');
  }
};

// ==========================================
// 5. PARENT MANAGEMENT & CHILD LINKING
// ==========================================

/**
 * Get Parents Directory with Linked Children
 * @route GET /api/admin/parents
 */
const getParents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const userWhere = {};
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      userWhere[Op.or] = [
        { name: { [Op.like]: q } },
        { email: { [Op.like]: q } },
        { phone: { [Op.like]: q } }
      ];
    }

    const { count, rows } = await ParentProfile.findAndCountAll({
      include: [
        {
          model: User,
          as: 'user',
          where: userWhere,
          attributes: ['id', 'name', 'email', 'phone', 'isActive']
        },
        {
          model: ParentStudent,
          as: 'parentStudents',
          include: [
            {
              model: StudentProfile,
              as: 'studentProfile',
              include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
            }
          ]
        }
      ],
      order: [['id', 'DESC']],
      limit: limitNum,
      offset
    });

    const formattedParents = rows.map((pp) => ({
      id: pp.id,
      userId: pp.userId,
      parentId: pp.parentId,
      name: pp.user?.name || '',
      email: pp.user?.email || '',
      phone: pp.phone || pp.user?.phone || '',
      relationship: pp.relationship || 'Parent',
      occupation: pp.occupation || '',
      address: pp.address || '',
      isActive: pp.user?.isActive ?? true,
      children: (pp.parentStudents || []).map((ps) => ({
        id: ps.studentProfile?.id,
        studentId: ps.studentProfile?.studentId,
        name: ps.studentProfile?.user?.name || '',
        className: ps.studentProfile?.className || '',
        section: ps.studentProfile?.section || '',
        relationship: ps.relationship
      }))
    }));

    return successResponse(res, 200, 'Parents directory retrieved', {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum) || 1,
      parents: formattedParents
    });
  } catch (error) {
    console.error('[Get Admin Parents Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve parents');
  }
};

/**
 * Link Parent to Student (Admin)
 * @route POST /api/admin/parents/:parentId/children
 */
const linkParentChild = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { studentId, relationship } = req.body;

    if (!studentId) {
      return errorResponse(res, 400, 'Student ID is required');
    }

    const parent = await findParentProfile(parentId);
    if (!parent) {
      return errorResponse(res, 404, 'Parent profile not found');
    }

    const student = await findStudentProfile(studentId);
    if (!student) {
      return errorResponse(res, 404, 'Student profile not found');
    }

    // Check for existing link
    const existing = await ParentStudent.findOne({
      where: {
        parentProfileId: parent.id,
        studentProfileId: student.id
      }
    });

    if (existing) {
      return successResponse(res, 200, 'Child is already linked to this parent', {
        parentId: parent.parentId,
        studentId: student.studentId,
        relationship: existing.relationship
      });
    }

    const newLink = await ParentStudent.create({
      parentProfileId: parent.id,
      studentProfileId: student.id,
      relationship: relationship || parent.relationship || 'Child'
    });

    await recordAudit(req.user.id, 'LINK_PARENT', 'ParentStudent', newLink.id, {
      parentId: parent.parentId,
      studentId: student.studentId
    });

    return successResponse(res, 201, 'Parent and student linked successfully', {
      parentId: parent.parentId,
      studentId: student.studentId,
      studentName: student.user?.name,
      relationship: newLink.relationship
    });
  } catch (error) {
    console.error('[Link Parent Child Error]:', error.message);
    return errorResponse(res, 500, 'Failed to link parent and student');
  }
};

/**
 * Unlink Parent from Student (Admin)
 * @route DELETE /api/admin/parents/:parentId/children/:studentId
 */
const unlinkParentChild = async (req, res) => {
  try {
    const { parentId, studentId } = req.params;

    const parent = await findParentProfile(parentId);
    if (!parent) {
      return errorResponse(res, 404, 'Parent profile not found');
    }

    const student = await findStudentProfile(studentId);
    if (!student) {
      return errorResponse(res, 404, 'Student profile not found');
    }

    const link = await ParentStudent.findOne({
      where: {
        parentProfileId: parent.id,
        studentProfileId: student.id
      }
    });

    if (!link) {
      return errorResponse(res, 404, 'Relationship link not found');
    }

    await link.destroy();

    await recordAudit(req.user.id, 'UNLINK_PARENT', 'ParentStudent', null, {
      parentId: parent.parentId,
      studentId: student.studentId
    });

    return successResponse(res, 200, 'Parent and student unlinked successfully');
  } catch (error) {
    console.error('[Unlink Parent Child Error]:', error.message);
    return errorResponse(res, 500, 'Failed to unlink parent and student');
  }
};

// ==========================================
// 6. CLASS MANAGEMENT
// ==========================================

/**
 * Get All Classes (with Sections)
 * @route GET /api/admin/classes
 */
const getClasses = async (req, res) => {
  try {
    const classes = await Class.findAll({
      include: [{ model: Section, as: 'sections' }],
      order: [['name', 'ASC']]
    });

    return successResponse(res, 200, 'Classes retrieved successfully', classes);
  } catch (error) {
    console.error('[Get Classes Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve classes');
  }
};

/**
 * Create New Class
 * @route POST /api/admin/classes
 */
const createClass = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return errorResponse(res, 400, 'Class name is required');
    }

    const cleanName = name.trim();
    const existing = await Class.findOne({ where: { name: cleanName } });
    if (existing) {
      return errorResponse(res, 409, `Class '${cleanName}' already exists`);
    }

    const newClass = await Class.create({
      name: cleanName,
      description: description ? description.trim() : '',
      status: 'active'
    });

    await recordAudit(req.user.id, 'CREATE_CLASS', 'Class', newClass.id, { name: newClass.name });

    return successResponse(res, 201, 'Class created successfully', newClass);
  } catch (error) {
    console.error('[Create Class Error]:', error.message);
    return errorResponse(res, 500, 'Failed to create class');
  }
};

/**
 * Update Class
 * @route PUT /api/admin/classes/:id
 */
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const classRecord = await Class.findByPk(id);
    if (!classRecord) {
      return errorResponse(res, 404, 'Class not found');
    }

    if (name && name.trim()) {
      const cleanName = name.trim();
      if (cleanName !== classRecord.name) {
        const existing = await Class.findOne({ where: { name: cleanName } });
        if (existing) {
          return errorResponse(res, 409, `Class '${cleanName}' already exists`);
        }
        classRecord.name = cleanName;
      }
    }

    if (description !== undefined) classRecord.description = description.trim();
    if (status !== undefined) classRecord.status = status.trim();

    await classRecord.save();

    await recordAudit(req.user.id, 'UPDATE_CLASS', 'Class', classRecord.id, { name: classRecord.name });

    return successResponse(res, 200, 'Class updated successfully', classRecord);
  } catch (error) {
    console.error('[Update Class Error]:', error.message);
    return errorResponse(res, 500, 'Failed to update class');
  }
};

/**
 * Delete Class (Safe Deletion)
 * @route DELETE /api/admin/classes/:id
 */
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const classRecord = await Class.findByPk(id);
    if (!classRecord) {
      return errorResponse(res, 404, 'Class not found');
    }

    await classRecord.destroy();

    await recordAudit(req.user.id, 'DELETE_CLASS', 'Class', id, { name: classRecord.name });

    return successResponse(res, 200, 'Class deleted successfully');
  } catch (error) {
    console.error('[Delete Class Error]:', error.message);
    return errorResponse(res, 500, 'Failed to delete class');
  }
};

// ==========================================
// 7. SECTION MANAGEMENT
// ==========================================

/**
 * Get All Sections
 * @route GET /api/admin/sections
 */
const getSections = async (req, res) => {
  try {
    const { classId } = req.query;
    const whereClause = {};
    if (classId) whereClause.classId = Number(classId);

    const sections = await Section.findAll({
      where: whereClause,
      include: [{ model: Class, as: 'class', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']]
    });

    return successResponse(res, 200, 'Sections retrieved successfully', sections);
  } catch (error) {
    console.error('[Get Sections Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve sections');
  }
};

/**
 * Create Section
 * @route POST /api/admin/sections
 */
const createSection = async (req, res) => {
  try {
    const { classId, name } = req.body;

    if (!classId) {
      return errorResponse(res, 400, 'Class ID is required');
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return errorResponse(res, 400, 'Section name is required');
    }

    const classExists = await Class.findByPk(classId);
    if (!classExists) {
      return errorResponse(res, 404, 'Associated class does not exist');
    }

    const cleanName = name.trim().toUpperCase();
    const existing = await Section.findOne({
      where: {
        classId: Number(classId),
        name: cleanName
      }
    });

    if (existing) {
      return errorResponse(res, 409, `Section '${cleanName}' already exists in this class`);
    }

    const newSection = await Section.create({
      classId: Number(classId),
      name: cleanName,
      status: 'active'
    });

    await recordAudit(req.user.id, 'CREATE_SECTION', 'Section', newSection.id, {
      className: classExists.name,
      sectionName: newSection.name
    });

    return successResponse(res, 201, 'Section created successfully', newSection);
  } catch (error) {
    console.error('[Create Section Error]:', error.message);
    return errorResponse(res, 500, 'Failed to create section');
  }
};

/**
 * Update Section
 * @route PUT /api/admin/sections/:id
 */
const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const sectionRecord = await Section.findByPk(id);
    if (!sectionRecord) {
      return errorResponse(res, 404, 'Section not found');
    }

    if (name && name.trim()) {
      const cleanName = name.trim().toUpperCase();
      if (cleanName !== sectionRecord.name) {
        const existing = await Section.findOne({
          where: {
            classId: sectionRecord.classId,
            name: cleanName
          }
        });
        if (existing) {
          return errorResponse(res, 409, `Section '${cleanName}' already exists in this class`);
        }
        sectionRecord.name = cleanName;
      }
    }

    if (status !== undefined) sectionRecord.status = status.trim();
    await sectionRecord.save();

    await recordAudit(req.user.id, 'UPDATE_SECTION', 'Section', sectionRecord.id, {
      name: sectionRecord.name
    });

    return successResponse(res, 200, 'Section updated successfully', sectionRecord);
  } catch (error) {
    console.error('[Update Section Error]:', error.message);
    return errorResponse(res, 500, 'Failed to update section');
  }
};

/**
 * Delete Section
 * @route DELETE /api/admin/sections/:id
 */
const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    const sectionRecord = await Section.findByPk(id);
    if (!sectionRecord) {
      return errorResponse(res, 404, 'Section not found');
    }

    await sectionRecord.destroy();

    await recordAudit(req.user.id, 'DELETE_SECTION', 'Section', id, { name: sectionRecord.name });

    return successResponse(res, 200, 'Section deleted successfully');
  } catch (error) {
    console.error('[Delete Section Error]:', error.message);
    return errorResponse(res, 500, 'Failed to delete section');
  }
};

// ==========================================
// 8. SUBJECT MANAGEMENT
// ==========================================

/**
 * Get All Subjects
 * @route GET /api/admin/subjects
 */
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      order: [['name', 'ASC']]
    });

    return successResponse(res, 200, 'Subjects retrieved successfully', subjects);
  } catch (error) {
    console.error('[Get Subjects Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve subjects');
  }
};

/**
 * Create Subject
 * @route POST /api/admin/subjects
 */
const createSubject = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return errorResponse(res, 400, 'Subject name is required');
    }
    if (!code || typeof code !== 'string' || !code.trim()) {
      return errorResponse(res, 400, 'Subject code is required');
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Subject.findOne({ where: { code: cleanCode } });
    if (existing) {
      return errorResponse(res, 409, `Subject code '${cleanCode}' already exists`);
    }

    const newSubject = await Subject.create({
      name: name.trim(),
      code: cleanCode,
      description: description ? description.trim() : '',
      status: 'active'
    });

    await recordAudit(req.user.id, 'CREATE_SUBJECT', 'Subject', newSubject.id, {
      name: newSubject.name,
      code: newSubject.code
    });

    return successResponse(res, 201, 'Subject created successfully', newSubject);
  } catch (error) {
    console.error('[Create Subject Error]:', error.message);
    return errorResponse(res, 500, 'Failed to create subject');
  }
};

/**
 * Update Subject
 * @route PUT /api/admin/subjects/:id
 */
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, status } = req.body;

    const subjectRecord = await Subject.findByPk(id);
    if (!subjectRecord) {
      return errorResponse(res, 404, 'Subject not found');
    }

    if (code && code.trim()) {
      const cleanCode = code.trim().toUpperCase();
      if (cleanCode !== subjectRecord.code) {
        const existing = await Subject.findOne({ where: { code: cleanCode } });
        if (existing) {
          return errorResponse(res, 409, `Subject code '${cleanCode}' already exists`);
        }
        subjectRecord.code = cleanCode;
      }
    }

    if (name && name.trim()) subjectRecord.name = name.trim();
    if (description !== undefined) subjectRecord.description = description.trim();
    if (status !== undefined) subjectRecord.status = status.trim();

    await subjectRecord.save();

    await recordAudit(req.user.id, 'UPDATE_SUBJECT', 'Subject', subjectRecord.id, {
      name: subjectRecord.name,
      code: subjectRecord.code
    });

    return successResponse(res, 200, 'Subject updated successfully', subjectRecord);
  } catch (error) {
    console.error('[Update Subject Error]:', error.message);
    return errorResponse(res, 500, 'Failed to update subject');
  }
};

/**
 * Delete Subject
 * @route DELETE /api/admin/subjects/:id
 */
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subjectRecord = await Subject.findByPk(id);
    if (!subjectRecord) {
      return errorResponse(res, 404, 'Subject not found');
    }

    await subjectRecord.destroy();

    await recordAudit(req.user.id, 'DELETE_SUBJECT', 'Subject', id, {
      name: subjectRecord.name,
      code: subjectRecord.code
    });

    return successResponse(res, 200, 'Subject deleted successfully');
  } catch (error) {
    console.error('[Delete Subject Error]:', error.message);
    return errorResponse(res, 500, 'Failed to delete subject');
  }
};

module.exports = {
  getAdminDashboard,
  getUsers,
  updateUserStatus,
  getTeachers,
  updateTeacherAssignment,
  getStudents,
  getAgeVerificationRequests,
  updateStudentAgeVerification,
  updateStudentAssignment,
  getParents,
  linkParentChild,
  unlinkParentChild,
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject
};
