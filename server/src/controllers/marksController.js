const { Op } = require('sequelize');
const { Marks, StudentProfile, User } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { calculatePercentage, calculateGrade } = require('../utils/gradeCalculator');

const ALLOWED_EXAM_TYPES = ['unit_test', 'mid_term', 'final_exam', 'assignment', 'practical', 'quiz'];

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
 * Helper to get student profile from authenticated user
 */
const getStudentProfileForUser = async (userId) => {
  let profile = await StudentProfile.findOne({ where: { userId } });
  if (!profile) {
    const timestampPart = Date.now().toString().slice(-4);
    profile = await StudentProfile.create({
      userId,
      studentId: `STU${String(userId).padStart(3, '0')}${timestampPart}`
    });
  }
  return profile;
};

/**
 * Format a single Marks record with calculated percentage and grade
 */
const formatMarksRecord = (mark) => {
  const max = Number(mark.maxMarks);
  const obtained = Number(mark.obtainedMarks);
  const percentage = calculatePercentage(obtained, max);
  const grade = calculateGrade(percentage);

  return {
    id: mark.id,
    subject: mark.subject,
    examType: mark.examType,
    examName: mark.examName,
    maxMarks: max,
    obtainedMarks: obtained,
    percentage,
    grade,
    examDate: mark.examDate,
    remarks: mark.remarks || ''
  };
};

/**
 * Get Authenticated Student Marks List with Filters
 * @route GET /api/student/marks
 * @query subject (optional)
 * @query examType (optional)
 * @query examName (optional)
 * @query search (optional)
 * @query startDate (optional YYYY-MM-DD)
 * @query endDate (optional YYYY-MM-DD)
 */
const getStudentMarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const studentProfile = await getStudentProfileForUser(userId);

    const { subject, examType, examName, search, startDate, endDate } = req.query;

    // 1. Validate Filters
    if (examType && !ALLOWED_EXAM_TYPES.includes(examType.toLowerCase().trim())) {
      return errorResponse(
        res,
        400,
        `Invalid examType filter. Allowed values: ${ALLOWED_EXAM_TYPES.join(', ')}`
      );
    }

    if (startDate && !isValidDateString(startDate)) {
      return errorResponse(res, 400, 'Invalid startDate format. Expected YYYY-MM-DD');
    }

    if (endDate && !isValidDateString(endDate)) {
      return errorResponse(res, 400, 'Invalid endDate format. Expected YYYY-MM-DD');
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return errorResponse(res, 400, 'startDate cannot be after endDate');
    }

    // 2. Build Where Clause
    const whereClause = {
      studentId: studentProfile.id
    };

    if (subject && subject.trim()) {
      whereClause.subject = {
        [Op.like]: `%${subject.trim()}%`
      };
    }

    if (examType && examType.trim()) {
      whereClause.examType = examType.toLowerCase().trim();
    }

    if (examName && examName.trim()) {
      whereClause.examName = {
        [Op.like]: `%${examName.trim()}%`
      };
    }

    if (search && search.trim()) {
      whereClause[Op.or] = [
        { subject: { [Op.like]: `%${search.trim()}%` } },
        { examName: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    if (startDate && endDate) {
      whereClause.examDate = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      whereClause.examDate = { [Op.gte]: startDate };
    } else if (endDate) {
      whereClause.examDate = { [Op.lte]: endDate };
    }

    // 3. Query Marks
    const marksRecords = await Marks.findAll({
      where: whereClause,
      order: [
        ['examDate', 'DESC'],
        ['id', 'DESC']
      ]
    });

    const formattedData = marksRecords.map(formatMarksRecord);

    return successResponse(res, 200, 'Marks list retrieved successfully', formattedData);

  } catch (error) {
    console.error('[Get Student Marks Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve marks');
  }
};

/**
 * Get Specific Mark by ID
 * @route GET /api/student/marks/:id
 */
const getMarksById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const studentProfile = await getStudentProfileForUser(userId);

    const mark = await Marks.findOne({
      where: {
        id,
        studentId: studentProfile.id
      }
    });

    if (!mark) {
      return errorResponse(res, 404, 'Marks record not found');
    }

    return successResponse(res, 200, 'Marks details retrieved successfully', formatMarksRecord(mark));

  } catch (error) {
    console.error('[Get Marks By ID Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve marks details');
  }
};

/**
 * Get Overall Student Performance & Subject-Wise Analytics
 * @route GET /api/student/performance
 */
const getStudentPerformance = async (req, res) => {
  try {
    const userId = req.user.id;
    const studentProfile = await getStudentProfileForUser(userId);

    const allMarks = await Marks.findAll({
      where: {
        studentId: studentProfile.id
      },
      order: [['subject', 'ASC']]
    });

    if (allMarks.length === 0) {
      return successResponse(res, 200, 'Performance summary retrieved', {
        totalExams: 0,
        totalMaxMarks: 0,
        totalObtainedMarks: 0,
        overallPercentage: 0,
        overallGrade: 'N/A',
        subjects: []
      });
    }

    let totalMaxMarks = 0;
    let totalObtainedMarks = 0;
    const subjectMap = new Map();

    allMarks.forEach((mark) => {
      const max = Number(mark.maxMarks);
      const obtained = Number(mark.obtainedMarks);

      totalMaxMarks += max;
      totalObtainedMarks += obtained;

      const subName = mark.subject;
      if (!subjectMap.has(subName)) {
        subjectMap.set(subName, {
          subject: subName,
          totalExams: 0,
          totalMaxMarks: 0,
          totalObtainedMarks: 0
        });
      }

      const currentSub = subjectMap.get(subName);
      currentSub.totalExams += 1;
      currentSub.totalMaxMarks += max;
      currentSub.totalObtainedMarks += obtained;
    });

    // Calculate Overall Percentage and Grade (totalObtainedMarks / totalMaxMarks * 100)
    const overallPercentage = calculatePercentage(totalObtainedMarks, totalMaxMarks);
    const overallGrade = calculateGrade(overallPercentage);

    // Calculate Subject-Wise Percentages and Grades
    const subjects = Array.from(subjectMap.values()).map((sub) => {
      const subPercentage = calculatePercentage(sub.totalObtainedMarks, sub.totalMaxMarks);
      const subGrade = calculateGrade(subPercentage);

      return {
        subject: sub.subject,
        totalExams: sub.totalExams,
        totalMaxMarks: Math.round(sub.totalMaxMarks * 100) / 100,
        totalObtainedMarks: Math.round(sub.totalObtainedMarks * 100) / 100,
        percentage: subPercentage,
        grade: subGrade
      };
    });

    return successResponse(res, 200, 'Performance summary retrieved successfully', {
      totalExams: allMarks.length,
      totalMaxMarks: Math.round(totalMaxMarks * 100) / 100,
      totalObtainedMarks: Math.round(totalObtainedMarks * 100) / 100,
      overallPercentage,
      overallGrade,
      subjects
    });

  } catch (error) {
    console.error('[Get Student Performance Error]:', error.message);
    return errorResponse(res, 500, 'Failed to calculate academic performance');
  }
};

module.exports = {
  getStudentMarks,
  getMarksById,
  getStudentPerformance
};
