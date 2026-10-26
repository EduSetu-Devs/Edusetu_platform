const { Op } = require('sequelize');
const { StudentProfile, Attendance } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Validates a YYYY-MM-DD date string
 */
const isValidDateString = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parsed = new Date(dateStr);
  return !isNaN(parsed.getTime());
};

/**
 * Get Authenticated Student Attendance Records (with optional filters)
 * @route GET /api/student/attendance
 * @query subject (optional)
 * @query startDate (optional YYYY-MM-DD)
 * @query endDate (optional YYYY-MM-DD)
 */
const getStudentAttendance = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Locate Student Profile
    const studentProfile = await StudentProfile.findOne({ where: { userId } });
    if (!studentProfile) {
      return successResponse(res, 200, 'No attendance records found', []);
    }

    const { subject, startDate, endDate } = req.query;

    // 2. Validate Date Filters
    if (startDate && !isValidDateString(startDate)) {
      return errorResponse(res, 400, 'Invalid startDate format. Expected YYYY-MM-DD');
    }
    if (endDate && !isValidDateString(endDate)) {
      return errorResponse(res, 400, 'Invalid endDate format. Expected YYYY-MM-DD');
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return errorResponse(res, 400, 'startDate cannot be after endDate');
    }

    // 3. Build Query Condition
    const whereClause = {
      studentProfileId: studentProfile.id
    };

    if (subject && subject.trim()) {
      whereClause.subject = {
        [Op.like]: `%${subject.trim()}%`
      };
    }

    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      whereClause.date = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      whereClause.date = {
        [Op.lte]: endDate
      };
    }

    // 4. Fetch Attendance History
    const attendances = await Attendance.findAll({
      where: whereClause,
      order: [
        ['date', 'DESC'],
        ['id', 'DESC']
      ],
      attributes: ['id', 'date', 'subject', 'status', 'remarks']
    });

    return successResponse(res, 200, 'Attendance records retrieved successfully', attendances);

  } catch (error) {
    console.error('[Get Student Attendance Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve attendance records');
  }
};

/**
 * Get Authenticated Student Attendance Summary Statistics
 * @route GET /api/student/attendance/summary
 * @query subject (optional)
 * @query startDate (optional YYYY-MM-DD)
 * @query endDate (optional YYYY-MM-DD)
 */
const getAttendanceSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Locate Student Profile
    const studentProfile = await StudentProfile.findOne({ where: { userId } });
    if (!studentProfile) {
      return successResponse(res, 200, 'Attendance summary retrieved', {
        totalClasses: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        attendancePercentage: 0
      });
    }

    const { subject, startDate, endDate } = req.query;

    // 2. Validate Date Filters
    if (startDate && !isValidDateString(startDate)) {
      return errorResponse(res, 400, 'Invalid startDate format. Expected YYYY-MM-DD');
    }
    if (endDate && !isValidDateString(endDate)) {
      return errorResponse(res, 400, 'Invalid endDate format. Expected YYYY-MM-DD');
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return errorResponse(res, 400, 'startDate cannot be after endDate');
    }

    // 3. Build Query Condition
    const whereClause = {
      studentProfileId: studentProfile.id
    };

    if (subject && subject.trim()) {
      whereClause.subject = {
        [Op.like]: `%${subject.trim()}%`
      };
    }

    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      whereClause.date = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      whereClause.date = {
        [Op.lte]: endDate
      };
    }

    // 4. Fetch All Matching Records for Calculation
    const records = await Attendance.findAll({
      where: whereClause,
      attributes: ['status']
    });

    const totalClasses = records.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;

    records.forEach((rec) => {
      if (rec.status === 'present') present++;
      else if (rec.status === 'absent') absent++;
      else if (rec.status === 'late') late++;
      else if (rec.status === 'leave') leave++;
    });

    // Attendance percentage = (present / totalClasses) * 100
    const attendancePercentage = totalClasses === 0 ? 0 : Math.round((present / totalClasses) * 100);

    const summaryData = {
      totalClasses,
      present,
      absent,
      late,
      leave,
      attendancePercentage
    };

    return successResponse(res, 200, 'Attendance summary retrieved successfully', summaryData);

  } catch (error) {
    console.error('[Get Attendance Summary Error]:', error.message);
    return errorResponse(res, 500, 'Failed to calculate attendance summary');
  }
};

module.exports = {
  getStudentAttendance,
  getAttendanceSummary
};
