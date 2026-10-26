const { Op } = require('sequelize');
const {
  User,
  ParentProfile,
  StudentProfile,
  ParentStudent,
  Attendance,
  Homework,
  HomeworkSubmission,
  Marks
} = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { calculatePercentage, calculateGrade } = require('../utils/gradeCalculator');

/**
 * Helper to retrieve parent profile for authenticated user
 */
const getParentProfileForUser = async (userId) => {
  let profile = await ParentProfile.findOne({ where: { userId } });
  if (!profile) {
    const timestampPart = Date.now().toString().slice(-4);
    profile = await ParentProfile.create({
      userId,
      parentId: `PAR${String(userId).padStart(3, '0')}${timestampPart}`
    });
  }
  return profile;
};

/**
 * Reusable helper to verify that a parent owns/is linked to a student
 */
const verifyParentOwnsStudent = async (parentProfileId, studentIdentifier) => {
  const isNumeric = !isNaN(Number(studentIdentifier));
  const whereClause = {};

  if (isNumeric) {
    whereClause[Op.or] = [{ id: Number(studentIdentifier) }, { studentId: String(studentIdentifier) }];
  } else {
    whereClause.studentId = String(studentIdentifier);
  }

  const student = await StudentProfile.findOne({
    where: whereClause,
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }]
  });

  if (!student) {
    return { student: null, authorized: false, mapping: null, reason: 'Student profile not found' };
  }

  const mapping = await ParentStudent.findOne({
    where: {
      parentProfileId,
      studentProfileId: student.id
    }
  });

  if (!mapping) {
    return {
      student,
      authorized: false,
      mapping: null,
      reason: 'This student is not associated with your parent account'
    };
  }

  return { student, authorized: true, mapping, reason: '' };
};

/**
 * Get Comprehensive Academic Overview for Linked Child
 * @route GET /api/parent/children/:studentId/overview
 */
const getAcademicOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;
    const parentProfile = await getParentProfileForUser(userId);

    const { student, authorized, mapping, reason } = await verifyParentOwnsStudent(
      parentProfile.id,
      studentId
    );

    if (!student) {
      return errorResponse(res, 404, reason || 'Student profile not found');
    }
    if (!authorized) {
      return errorResponse(res, 403, `Access denied. ${reason}`);
    }

    // 1. Calculate Attendance
    const attendanceRecords = await Attendance.findAll({
      where: { studentProfileId: student.id },
      attributes: ['status']
    });

    const totalClasses = attendanceRecords.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;

    attendanceRecords.forEach((rec) => {
      if (rec.status === 'present') present++;
      else if (rec.status === 'absent') absent++;
      else if (rec.status === 'late') late++;
      else if (rec.status === 'leave') leave++;
    });

    const attendancePercentage = totalClasses === 0 ? 0 : Math.round((present / totalClasses) * 100);

    // 2. Calculate Homework
    const homeworkWhere = { status: { [Op.ne]: 'draft' } };
    if (student.className && student.className.trim()) {
      homeworkWhere.className = student.className.trim();
    }

    const homeworks = await Homework.findAll({
      where: homeworkWhere,
      attributes: ['id', 'dueDate']
    });

    const homeworkIds = homeworks.map((h) => h.id);
    const submissions = await HomeworkSubmission.findAll({
      where: {
        homeworkId: { [Op.in]: homeworkIds.length > 0 ? homeworkIds : [0] },
        studentId: student.id
      }
    });

    const subMap = new Map();
    submissions.forEach((s) => subMap.set(s.homeworkId, s));

    let hwSubmitted = 0;
    let hwPending = 0;
    let hwLate = 0;

    const now = new Date();
    homeworks.forEach((hw) => {
      const sub = subMap.get(hw.id);
      if (sub) {
        if (sub.status === 'late') hwLate++;
        else hwSubmitted++;
      } else {
        const dueDateTime = new Date(`${hw.dueDate}T23:59:59`);
        if (now > dueDateTime) hwLate++;
        else hwPending++;
      }
    });

    // 3. Calculate Marks & Result
    const marksRecords = await Marks.findAll({
      where: { studentId: student.id },
      order: [['examDate', 'DESC']]
    });

    let totalMaxMarks = 0;
    let totalObtainedMarks = 0;

    marksRecords.forEach((m) => {
      totalMaxMarks += Number(m.maxMarks);
      totalObtainedMarks += Number(m.obtainedMarks);
    });

    const overallPercentage = calculatePercentage(totalObtainedMarks, totalMaxMarks);
    const overallGrade = calculateGrade(overallPercentage);
    const gpa = (overallPercentage / 10).toFixed(2);

    return successResponse(res, 200, 'Child academic overview retrieved successfully', {
      student: {
        studentProfileId: student.id,
        studentId: student.studentId,
        name: student.user?.name || '',
        email: student.user?.email || '',
        className: student.className,
        section: student.section,
        rollNumber: student.rollNumber,
        relationship: mapping.relationship || 'Child'
      },
      attendance: {
        total: totalClasses,
        totalClasses,
        present,
        absent,
        late,
        leave,
        percentage: attendancePercentage,
        attendancePercentage
      },
      homework: {
        total: homeworks.length,
        submitted: hwSubmitted,
        pending: hwPending,
        late: hwLate
      },
      marks: {
        totalExams: marksRecords.length,
        averagePercentage: overallPercentage,
        grade: overallGrade
      },
      result: {
        totalMaxMarks: Math.round(totalMaxMarks * 100) / 100,
        totalObtainedMarks: Math.round(totalObtainedMarks * 100) / 100,
        percentage: overallPercentage,
        grade: overallGrade,
        gpa,
        cgpa: gpa
      }
    });

  } catch (error) {
    console.error('[Get Parent Academic Overview Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve child academic overview');
  }
};

/**
 * Get Child Attendance Summary
 * @route GET /api/parent/children/:studentId/attendance
 */
const getAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;
    const parentProfile = await getParentProfileForUser(userId);

    const { student, authorized, reason } = await verifyParentOwnsStudent(
      parentProfile.id,
      studentId
    );

    if (!student) {
      return errorResponse(res, 404, reason || 'Student profile not found');
    }
    if (!authorized) {
      return errorResponse(res, 403, `Access denied. ${reason}`);
    }

    const records = await Attendance.findAll({
      where: { studentProfileId: student.id },
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

    const attendancePercentage = totalClasses === 0 ? 0 : Math.round((present / totalClasses) * 100);

    return successResponse(res, 200, 'Child attendance summary retrieved successfully', {
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.user?.name || '',
        className: student.className,
        section: student.section
      },
      totalClasses,
      present,
      absent,
      late,
      leave,
      attendancePercentage,
      percentage: attendancePercentage
    });

  } catch (error) {
    console.error('[Get Parent Child Attendance Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve attendance summary');
  }
};

/**
 * Get Child Attendance Detailed History Log
 * @route GET /api/parent/children/:studentId/attendance/history
 */
const getAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;
    const parentProfile = await getParentProfileForUser(userId);

    const { student, authorized, reason } = await verifyParentOwnsStudent(
      parentProfile.id,
      studentId
    );

    if (!student) {
      return errorResponse(res, 404, reason || 'Student profile not found');
    }
    if (!authorized) {
      return errorResponse(res, 403, `Access denied. ${reason}`);
    }

    const attendances = await Attendance.findAll({
      where: { studentProfileId: student.id },
      order: [
        ['date', 'DESC'],
        ['id', 'DESC']
      ],
      attributes: ['id', 'date', 'subject', 'status', 'remarks']
    });

    return successResponse(res, 200, 'Child attendance history retrieved successfully', {
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.user?.name || ''
      },
      count: attendances.length,
      history: attendances
    });

  } catch (error) {
    console.error('[Get Parent Child Attendance History Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve attendance history');
  }
};

/**
 * Get Child Homework Summary
 * @route GET /api/parent/children/:studentId/homework
 */
const getHomework = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;
    const parentProfile = await getParentProfileForUser(userId);

    const { student, authorized, reason } = await verifyParentOwnsStudent(
      parentProfile.id,
      studentId
    );

    if (!student) {
      return errorResponse(res, 404, reason || 'Student profile not found');
    }
    if (!authorized) {
      return errorResponse(res, 403, `Access denied. ${reason}`);
    }

    const whereClause = { status: { [Op.ne]: 'draft' } };
    if (student.className && student.className.trim()) {
      whereClause.className = student.className.trim();
    }

    const homeworks = await Homework.findAll({
      where: whereClause,
      order: [['dueDate', 'DESC'], ['id', 'DESC']]
    });

    const homeworkIds = homeworks.map((hw) => hw.id);
    const submissions = await HomeworkSubmission.findAll({
      where: {
        homeworkId: { [Op.in]: homeworkIds.length > 0 ? homeworkIds : [0] },
        studentId: student.id
      }
    });

    const subMap = new Map();
    submissions.forEach((s) => subMap.set(s.homeworkId, s));

    let submittedCount = 0;
    let pendingCount = 0;
    let lateCount = 0;

    const now = new Date();
    const enrichedList = homeworks.map((hw) => {
      const sub = subMap.get(hw.id);
      let submissionStatus = 'pending';
      let submittedAt = null;

      if (sub) {
        submissionStatus = sub.status;
        submittedAt = sub.submittedAt;
        if (sub.status === 'late') lateCount++;
        else submittedCount++;
      } else {
        const dueDateTime = new Date(`${hw.dueDate}T23:59:59`);
        if (now > dueDateTime) {
          submissionStatus = 'late';
          lateCount++;
        } else {
          pendingCount++;
        }
      }

      return {
        id: hw.id,
        title: hw.title,
        description: hw.description,
        subject: hw.subject,
        className: hw.className,
        section: hw.section,
        assignedDate: hw.assignedDate,
        dueDate: hw.dueDate,
        status: hw.status,
        attachmentUrl: hw.attachmentUrl || '',
        submissionStatus,
        submittedAt
      };
    });

    return successResponse(res, 200, 'Child homework retrieved successfully', {
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.user?.name || ''
      },
      total: homeworks.length,
      submitted: submittedCount,
      pending: pendingCount,
      late: lateCount,
      recentHomework: enrichedList.slice(0, 5)
    });

  } catch (error) {
    console.error('[Get Parent Child Homework Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve child homework summary');
  }
};

/**
 * Get Child Homework Complete History Log
 * @route GET /api/parent/children/:studentId/homework/history
 */
const getHomeworkHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;
    const parentProfile = await getParentProfileForUser(userId);

    const { student, authorized, reason } = await verifyParentOwnsStudent(
      parentProfile.id,
      studentId
    );

    if (!student) {
      return errorResponse(res, 404, reason || 'Student profile not found');
    }
    if (!authorized) {
      return errorResponse(res, 403, `Access denied. ${reason}`);
    }

    const whereClause = { status: { [Op.ne]: 'draft' } };
    if (student.className && student.className.trim()) {
      whereClause.className = student.className.trim();
    }

    const homeworks = await Homework.findAll({
      where: whereClause,
      order: [['dueDate', 'DESC'], ['id', 'DESC']]
    });

    const homeworkIds = homeworks.map((hw) => hw.id);
    const submissions = await HomeworkSubmission.findAll({
      where: {
        homeworkId: { [Op.in]: homeworkIds.length > 0 ? homeworkIds : [0] },
        studentId: student.id
      }
    });

    const subMap = new Map();
    submissions.forEach((s) => subMap.set(s.homeworkId, s));

    const now = new Date();
    const historyList = homeworks.map((hw) => {
      const sub = subMap.get(hw.id);
      let submissionStatus = 'pending';
      let submittedAt = null;

      if (sub) {
        submissionStatus = sub.status;
        submittedAt = sub.submittedAt;
      } else {
        const dueDateTime = new Date(`${hw.dueDate}T23:59:59`);
        if (now > dueDateTime) submissionStatus = 'late';
      }

      return {
        id: hw.id,
        title: hw.title,
        description: hw.description,
        subject: hw.subject,
        className: hw.className,
        section: hw.section || '',
        assignedDate: hw.assignedDate,
        dueDate: hw.dueDate,
        status: hw.status,
        attachmentUrl: hw.attachmentUrl || '',
        submissionStatus,
        submittedAt
      };
    });

    return successResponse(res, 200, 'Child homework history retrieved successfully', {
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.user?.name || ''
      },
      count: historyList.length,
      history: historyList
    });

  } catch (error) {
    console.error('[Get Parent Child Homework History Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve child homework history');
  }
};

/**
 * Get Child Marks and Subject-Wise Evaluation
 * @route GET /api/parent/children/:studentId/marks
 */
const getMarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;
    const parentProfile = await getParentProfileForUser(userId);

    const { student, authorized, reason } = await verifyParentOwnsStudent(
      parentProfile.id,
      studentId
    );

    if (!student) {
      return errorResponse(res, 404, reason || 'Student profile not found');
    }
    if (!authorized) {
      return errorResponse(res, 403, `Access denied. ${reason}`);
    }

    const marksRecords = await Marks.findAll({
      where: { studentId: student.id },
      order: [['examDate', 'DESC'], ['id', 'DESC']]
    });

    let totalMaxMarks = 0;
    let totalObtainedMarks = 0;
    const subjectMap = new Map();

    const formattedMarks = marksRecords.map((m) => {
      const max = Number(m.maxMarks);
      const obtained = Number(m.obtainedMarks);
      const percentage = calculatePercentage(obtained, max);
      const grade = calculateGrade(percentage);

      totalMaxMarks += max;
      totalObtainedMarks += obtained;

      const subName = m.subject;
      if (!subjectMap.has(subName)) {
        subjectMap.set(subName, {
          subject: subName,
          totalExams: 0,
          totalMaxMarks: 0,
          totalObtainedMarks: 0
        });
      }

      const curSub = subjectMap.get(subName);
      curSub.totalExams += 1;
      curSub.totalMaxMarks += max;
      curSub.totalObtainedMarks += obtained;

      return {
        id: m.id,
        subject: m.subject,
        examType: m.examType,
        examName: m.examName,
        maxMarks: max,
        obtainedMarks: obtained,
        percentage,
        grade,
        examDate: m.examDate,
        remarks: m.remarks || ''
      };
    });

    const overallPercentage = calculatePercentage(totalObtainedMarks, totalMaxMarks);
    const overallGrade = calculateGrade(overallPercentage);

    const subjectWise = Array.from(subjectMap.values()).map((sub) => {
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

    return successResponse(res, 200, 'Child marks retrieved successfully', {
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.user?.name || '',
        className: student.className,
        section: student.section
      },
      totalExams: marksRecords.length,
      overallPercentage,
      overallGrade,
      subjectWise,
      marks: formattedMarks
    });

  } catch (error) {
    console.error('[Get Parent Child Marks Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve child marks');
  }
};

/**
 * Get Child Cumulative Result and GPA Analytics
 * @route GET /api/parent/children/:studentId/result
 */
const getResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;
    const parentProfile = await getParentProfileForUser(userId);

    const { student, authorized, reason } = await verifyParentOwnsStudent(
      parentProfile.id,
      studentId
    );

    if (!student) {
      return errorResponse(res, 404, reason || 'Student profile not found');
    }
    if (!authorized) {
      return errorResponse(res, 403, `Access denied. ${reason}`);
    }

    const allMarks = await Marks.findAll({
      where: { studentId: student.id },
      order: [['subject', 'ASC']]
    });

    if (allMarks.length === 0) {
      return successResponse(res, 200, 'Child result calculated', {
        student: {
          id: student.id,
          studentId: student.studentId,
          name: student.user?.name || '',
          className: student.className,
          section: student.section
        },
        totalExams: 0,
        totalMaxMarks: 0,
        totalObtainedMarks: 0,
        overallPercentage: 0,
        overallGrade: 'N/A',
        gpa: '0.00',
        cgpa: '0.00',
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

      const cur = subjectMap.get(subName);
      cur.totalExams += 1;
      cur.totalMaxMarks += max;
      cur.totalObtainedMarks += obtained;
    });

    const overallPercentage = calculatePercentage(totalObtainedMarks, totalMaxMarks);
    const overallGrade = calculateGrade(overallPercentage);
    const gpa = (overallPercentage / 10).toFixed(2);

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

    return successResponse(res, 200, 'Child result calculated successfully', {
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.user?.name || '',
        className: student.className,
        section: student.section
      },
      totalExams: allMarks.length,
      totalMaxMarks: Math.round(totalMaxMarks * 100) / 100,
      totalObtainedMarks: Math.round(totalObtainedMarks * 100) / 100,
      overallPercentage,
      percentage: overallPercentage,
      overallGrade,
      grade: overallGrade,
      gpa,
      cgpa: gpa,
      subjects
    });

  } catch (error) {
    console.error('[Get Parent Child Result Error]:', error.message);
    return errorResponse(res, 500, 'Failed to calculate child result');
  }
};

module.exports = {
  getAcademicOverview,
  getAttendance,
  getAttendanceHistory,
  getHomework,
  getHomeworkHistory,
  getMarks,
  getResult
};
