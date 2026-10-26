const { Op } = require('sequelize');
const { User, StudentProfile, TeacherProfile, Attendance, sequelize } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { notifyForAttendance } = require('../services/notificationService');

const VALID_STATUSES = ['present', 'absent', 'late', 'leave'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Helper to retrieve teacher profile
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
 * Helper to authorize a student against teacher's assigned class & section
 */
const authorizeStudentForTeacher = async (teacherProfile, studentIdParam) => {
  const isNumeric = !isNaN(Number(studentIdParam));

  const whereClause = {};
  if (isNumeric) {
    whereClause[Op.or] = [
      { id: Number(studentIdParam) },
      { studentId: String(studentIdParam) }
    ];
  } else {
    whereClause.studentId = String(studentIdParam);
  }

  const studentProfile = await StudentProfile.findOne({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'phone']
      }
    ]
  });

  if (!studentProfile) {
    return { authorized: false, notFound: true, studentProfile: null };
  }

  if (teacherProfile.className && teacherProfile.className.trim()) {
    if (studentProfile.className !== teacherProfile.className.trim()) {
      return { authorized: false, notFound: false, studentProfile };
    }
  }

  if (teacherProfile.section && teacherProfile.section.trim()) {
    if (studentProfile.section !== teacherProfile.section.trim()) {
      return { authorized: false, notFound: false, studentProfile };
    }
  }

  return { authorized: true, notFound: false, studentProfile };
};

/**
 * Get Class Students for Attendance on a Specific Date and Subject
 * @route GET /api/teacher/attendance
 * @query date (YYYY-MM-DD), subject
 */
const getClassAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);

    const { date, subject } = req.query;

    if (date && !DATE_REGEX.test(date)) {
      return errorResponse(res, 400, 'Invalid date format. Use YYYY-MM-DD');
    }

    const queryDate = date || new Date().toISOString().split('T')[0];

    // Build Student Filter
    const studentWhere = {};
    if (teacherProfile.className && teacherProfile.className.trim()) {
      studentWhere.className = teacherProfile.className.trim();
    }
    if (teacherProfile.section && teacherProfile.section.trim()) {
      studentWhere.section = teacherProfile.section.trim();
    }

    const students = await StudentProfile.findAll({
      where: studentWhere,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [
        ['rollNumber', 'ASC'],
        ['studentId', 'ASC']
      ]
    });

    const studentIds = students.map((s) => s.id);

    // Fetch existing attendance records for this date (and subject if provided)
    const attendanceWhere = {
      studentProfileId: { [Op.in]: studentIds },
      date: queryDate
    };
    if (subject && subject.trim()) {
      attendanceWhere.subject = subject.trim();
    }

    const existingAttendance = await Attendance.findAll({
      where: attendanceWhere
    });

    const attendanceMap = new Map();
    existingAttendance.forEach((att) => {
      attendanceMap.set(att.studentProfileId, att);
    });

    const studentRoster = students.map((sp) => {
      const existing = attendanceMap.get(sp.id);
      return {
        id: sp.id,
        studentId: sp.studentId,
        name: sp.user?.name || '',
        email: sp.user?.email || '',
        rollNumber: sp.rollNumber || '',
        className: sp.className || '',
        section: sp.section || '',
        attendanceId: existing ? existing.id : null,
        status: existing ? existing.status : 'unmarked',
        subject: existing ? existing.subject : subject || '',
        remarks: existing ? existing.remarks : ''
      };
    });

    return successResponse(res, 200, 'Class attendance roster retrieved successfully', {
      date: queryDate,
      subject: subject || '',
      className: teacherProfile.className || 'All Classes',
      section: teacherProfile.section || 'All Sections',
      students: studentRoster,
      totalCount: studentRoster.length
    });

  } catch (error) {
    console.error('[Get Class Attendance Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve class attendance roster');
  }
};

/**
 * Mark Single Student Attendance
 * @route POST /api/teacher/attendance
 */
const markAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);

    const { studentId, date, subject, status, remarks } = req.body;

    // 1. Validation
    if (!studentId) {
      return errorResponse(res, 400, 'Student ID is required');
    }
    if (!date || !DATE_REGEX.test(date)) {
      return errorResponse(res, 400, 'Valid date (YYYY-MM-DD) is required');
    }
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return errorResponse(res, 400, 'Subject is required');
    }
    if (!status || !VALID_STATUSES.includes(status.toLowerCase())) {
      return errorResponse(res, 400, `Status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    // 2. Authorize student under teacher's class/section
    const { authorized, notFound, studentProfile } = await authorizeStudentForTeacher(
      teacherProfile,
      studentId
    );

    if (notFound) {
      return errorResponse(res, 404, 'Student profile not found');
    }
    if (!authorized) {
      return errorResponse(res, 403, 'Access denied. Student is not in your authorized class or section.');
    }

    const normalizedStatus = status.toLowerCase();
    const cleanSubject = subject.trim();

    // 3. Upsert record (check composite unique [studentProfileId, date, subject])
    let attendanceRecord = await Attendance.findOne({
      where: {
        studentProfileId: studentProfile.id,
        date,
        subject: cleanSubject
      }
    });

    if (attendanceRecord) {
      attendanceRecord.status = normalizedStatus;
      attendanceRecord.remarks = remarks !== undefined ? remarks : attendanceRecord.remarks;
      attendanceRecord.markedBy = userId;
      await attendanceRecord.save();
    } else {
      attendanceRecord = await Attendance.create({
        studentProfileId: studentProfile.id,
        date,
        subject: cleanSubject,
        status: normalizedStatus,
        remarks: remarks || '',
        markedBy: userId
      });
    }

    // Trigger notification asynchronously
    notifyForAttendance(attendanceRecord, studentProfile).catch((err) =>
      console.error('[Notification Error on markAttendance]:', err.message)
    );

    return successResponse(res, 200, 'Attendance marked successfully', {
      attendance: attendanceRecord,
      student: {
        studentId: studentProfile.studentId,
        name: studentProfile.user?.name
      }
    });

  } catch (error) {
    console.error('[Mark Attendance Error]:', error.message);
    return errorResponse(res, 500, 'Failed to mark attendance');
  }
};

/**
 * Bulk Mark Attendance for a Class
 * @route POST /api/teacher/attendance/bulk
 */
const bulkMarkAttendance = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);

    const { date, subject, records } = req.body;

    // 1. Validation
    if (!date || !DATE_REGEX.test(date)) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Valid date (YYYY-MM-DD) is required');
    }
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Subject is required');
    }
    if (!Array.isArray(records) || records.length === 0) {
      await transaction.rollback();
      return errorResponse(res, 400, 'A non-empty records array is required');
    }

    const cleanSubject = subject.trim();
    const processedRecords = [];

    // 2. Validate and authorize each student record
    for (const item of records) {
      if (!item.studentId) {
        await transaction.rollback();
        return errorResponse(res, 400, 'Each record must include studentId');
      }

      const itemStatus = (item.status || '').toLowerCase();
      if (!VALID_STATUSES.includes(itemStatus)) {
        await transaction.rollback();
        return errorResponse(res, 400, `Invalid status '${item.status}' for student ${item.studentId}`);
      }

      const { authorized, notFound, studentProfile } = await authorizeStudentForTeacher(
        teacherProfile,
        item.studentId
      );

      if (notFound) {
        await transaction.rollback();
        return errorResponse(res, 404, `Student ${item.studentId} not found`);
      }
      if (!authorized) {
        await transaction.rollback();
        return errorResponse(res, 403, `Unauthorized: Student ${item.studentId} is not in your assigned class or section.`);
      }

      // Upsert within transaction
      let attendanceRecord = await Attendance.findOne({
        where: {
          studentProfileId: studentProfile.id,
          date,
          subject: cleanSubject
        },
        transaction
      });

      if (attendanceRecord) {
        attendanceRecord.status = itemStatus;
        if (item.remarks !== undefined) attendanceRecord.remarks = item.remarks;
        attendanceRecord.markedBy = userId;
        await attendanceRecord.save({ transaction });
      } else {
        attendanceRecord = await Attendance.create(
          {
            studentProfileId: studentProfile.id,
            date,
            subject: cleanSubject,
            status: itemStatus,
            remarks: item.remarks || '',
            markedBy: userId
          },
          { transaction }
        );
      }

      processedRecords.push({
        studentId: studentProfile.studentId,
        status: itemStatus
      });
    }

    await transaction.commit();

    return successResponse(res, 200, `Successfully saved attendance for ${processedRecords.length} students`, {
      date,
      subject: cleanSubject,
      count: processedRecords.length,
      records: processedRecords
    });

  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('[Bulk Mark Attendance Error]:', error.message);
    return errorResponse(res, 500, 'Failed to save bulk attendance');
  }
};

/**
 * Update Existing Attendance Record by ID
 * @route PUT /api/teacher/attendance/:id
 */
const updateAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (status && !VALID_STATUSES.includes(status.toLowerCase())) {
      return errorResponse(res, 400, `Status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const attendanceRecord = await Attendance.findByPk(id, {
      include: [
        {
          model: StudentProfile,
          as: 'studentProfile',
          include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
        }
      ]
    });

    if (!attendanceRecord) {
      return errorResponse(res, 404, 'Attendance record not found');
    }

    // Verify teacher authorization on this student
    const student = attendanceRecord.studentProfile;
    if (teacherProfile.className && teacherProfile.className.trim()) {
      if (student.className !== teacherProfile.className.trim()) {
        return errorResponse(res, 403, 'Access denied. You cannot modify attendance for this student.');
      }
    }
    if (teacherProfile.section && teacherProfile.section.trim()) {
      if (student.section !== teacherProfile.section.trim()) {
        return errorResponse(res, 403, 'Access denied. You cannot modify attendance for this student.');
      }
    }

    if (status) attendanceRecord.status = status.toLowerCase();
    if (remarks !== undefined) attendanceRecord.remarks = remarks;
    attendanceRecord.markedBy = userId;
    await attendanceRecord.save();

    return successResponse(res, 200, 'Attendance record updated successfully', attendanceRecord);

  } catch (error) {
    console.error('[Update Attendance Error]:', error.message);
    return errorResponse(res, 500, 'Failed to update attendance record');
  }
};

/**
 * Get Class Attendance Summary for Date and Subject
 * @route GET /api/teacher/attendance/summary
 */
const getClassAttendanceSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);

    const { date, subject } = req.query;

    if (date && !DATE_REGEX.test(date)) {
      return errorResponse(res, 400, 'Invalid date format. Use YYYY-MM-DD');
    }

    const queryDate = date || new Date().toISOString().split('T')[0];

    // Find all students in teacher's class
    const studentWhere = {};
    if (teacherProfile.className && teacherProfile.className.trim()) {
      studentWhere.className = teacherProfile.className.trim();
    }
    if (teacherProfile.section && teacherProfile.section.trim()) {
      studentWhere.section = teacherProfile.section.trim();
    }

    const students = await StudentProfile.findAll({
      where: studentWhere,
      attributes: ['id']
    });

    const totalStudents = students.length;
    const studentIds = students.map((s) => s.id);

    const attendanceWhere = {
      studentProfileId: { [Op.in]: studentIds },
      date: queryDate
    };
    if (subject && subject.trim()) {
      attendanceWhere.subject = subject.trim();
    }

    const records = await Attendance.findAll({
      where: attendanceWhere
    });

    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const leave = records.filter((r) => r.status === 'leave').length;
    const unmarked = Math.max(0, totalStudents - (present + absent + late + leave));

    const attendancePercentage =
      totalStudents > 0
        ? Math.round(((present + (late > 0 ? 0.5 * late : 0)) / totalStudents) * 100 * 100) / 100
        : 0;

    // Direct present percentage as standard
    const purePresentPercentage =
      totalStudents > 0 ? Math.round((present / totalStudents) * 100 * 100) / 100 : 0;

    return successResponse(res, 200, 'Class attendance summary retrieved successfully', {
      date: queryDate,
      subject: subject || 'All Subjects',
      className: teacherProfile.className || 'All Classes',
      section: teacherProfile.section || 'All Sections',
      totalStudents,
      present,
      absent,
      late,
      leave,
      unmarked,
      attendancePercentage: purePresentPercentage
    });

  } catch (error) {
    console.error('[Get Class Attendance Summary Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve class attendance summary');
  }
};

/**
 * Get Specific Student Attendance Summary
 * @route GET /api/teacher/attendance/student/:studentId
 */
const getStudentAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);
    const { studentId } = req.params;

    const { authorized, notFound, studentProfile } = await authorizeStudentForTeacher(
      teacherProfile,
      studentId
    );

    if (notFound) {
      return errorResponse(res, 404, 'Student profile not found');
    }
    if (!authorized) {
      return errorResponse(res, 403, 'Access denied. Student is not in your authorized class or section.');
    }

    const records = await Attendance.findAll({
      where: { studentProfileId: studentProfile.id },
      order: [['date', 'DESC']]
    });

    const totalClasses = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const leave = records.filter((r) => r.status === 'leave').length;

    const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100 * 100) / 100 : 0;

    return successResponse(res, 200, 'Student attendance retrieved successfully', {
      studentId: studentProfile.studentId,
      name: studentProfile.user?.name || '',
      totalClasses,
      present,
      absent,
      late,
      leave,
      percentage,
      records: records.slice(0, 10)
    });

  } catch (error) {
    console.error('[Get Student Attendance Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve student attendance');
  }
};

module.exports = {
  getClassAttendance,
  markAttendance,
  bulkMarkAttendance,
  updateAttendance,
  getClassAttendanceSummary,
  getStudentAttendance
};
