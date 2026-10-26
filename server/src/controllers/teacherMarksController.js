const { Op } = require('sequelize');
const { User, StudentProfile, TeacherProfile, Marks, sequelize } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { calculatePercentage, calculateGrade } = require('../utils/gradeCalculator');
const { notifyForMarks } = require('../services/notificationService');

const ALLOWED_EXAM_TYPES = ['unit_test', 'mid_term', 'final_exam', 'assignment', 'practical', 'quiz'];

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
 * Helper to resolve student profile and verify class/section authorization
 */
const findAndAuthorizeStudent = async (studentIdentifier, teacherProfile) => {
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
    return { student: null, authorized: false, reason: 'Student profile not found' };
  }

  const teacherClass = teacherProfile.className ? teacherProfile.className.trim() : '';
  const teacherSection = teacherProfile.section ? teacherProfile.section.trim() : '';
  const studentClass = student.className ? student.className.trim() : '';
  const studentSection = student.section ? student.section.trim() : '';

  if (teacherClass && studentClass !== teacherClass) {
    return { student, authorized: false, reason: 'Student belongs to a different class' };
  }

  if (teacherSection && studentSection !== teacherSection) {
    return { student, authorized: false, reason: 'Student belongs to a different section' };
  }

  return { student, authorized: true };
};

/**
 * Get Class Marks Roster for a Given Subject & Examination
 * @route GET /api/teacher/marks
 */
const getClassMarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);

    const { subject, examType, examName, semester, academicYear } = req.query;

    const targetSubject = subject && subject.trim()
      ? subject.trim()
      : Array.isArray(teacherProfile.subjects) && teacherProfile.subjects.length > 0
      ? teacherProfile.subjects[0]
      : 'Mathematics';

    const targetExamType = examType && ALLOWED_EXAM_TYPES.includes(examType.toLowerCase().trim())
      ? examType.toLowerCase().trim()
      : 'mid_term';

    const targetExamName = examName && examName.trim()
      ? examName.trim()
      : 'Mid Term Exam';

    // Query enrolled students for this teacher's class & section
    const studentWhere = {};
    if (teacherProfile.className && teacherProfile.className.trim()) {
      studentWhere.className = teacherProfile.className.trim();
    }
    if (teacherProfile.section && teacherProfile.section.trim()) {
      studentWhere.section = teacherProfile.section.trim();
    }

    const students = await StudentProfile.findAll({
      where: studentWhere,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['rollNumber', 'ASC'], ['studentId', 'ASC']]
    });

    // Query existing marks for these students
    const studentIds = students.map((s) => s.id);
    const existingMarks = await Marks.findAll({
      where: {
        studentId: { [Op.in]: studentIds.length > 0 ? studentIds : [0] },
        subject: targetSubject,
        examType: targetExamType,
        examName: targetExamName
      }
    });

    const marksMap = new Map();
    existingMarks.forEach((m) => {
      marksMap.set(m.studentId, m);
    });

    const studentRoster = students.map((s) => {
      const markRecord = marksMap.get(s.id);
      if (markRecord) {
        const max = Number(markRecord.maxMarks);
        const obtained = Number(markRecord.obtainedMarks);
        const percentage = calculatePercentage(obtained, max);
        const grade = calculateGrade(percentage);

        return {
          studentProfileId: s.id,
          studentId: s.studentId,
          name: s.user?.name || '',
          rollNumber: s.rollNumber || '',
          marksId: markRecord.id,
          maxMarks: max,
          obtainedMarks: obtained,
          percentage,
          grade,
          examDate: markRecord.examDate,
          remarks: markRecord.remarks || '',
          isMarked: true
        };
      }

      return {
        studentProfileId: s.id,
        studentId: s.studentId,
        name: s.user?.name || '',
        rollNumber: s.rollNumber || '',
        marksId: null,
        maxMarks: 100,
        obtainedMarks: null,
        percentage: null,
        grade: 'N/A',
        examDate: null,
        remarks: '',
        isMarked: false
      };
    });

    return successResponse(res, 200, 'Class marks roster retrieved successfully', {
      subject: targetSubject,
      examType: targetExamType,
      examName: targetExamName,
      className: teacherProfile.className || 'Class 10',
      section: teacherProfile.section || 'A',
      totalStudents: students.length,
      markedStudents: existingMarks.length,
      students: studentRoster
    });

  } catch (error) {
    console.error('[Get Class Marks Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve class marks');
  }
};

/**
 * Create or Update Single Mark for a Student
 * @route POST /api/teacher/marks
 */
const createMarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);

    const { studentId, subject, examType, examName, maxMarks, obtainedMarks, marks, examDate, remarks } = req.body;

    // 1. Validate inputs
    if (!studentId) {
      return errorResponse(res, 400, 'Student ID is required');
    }
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return errorResponse(res, 400, 'Subject is required');
    }
    if (!examName || typeof examName !== 'string' || !examName.trim()) {
      return errorResponse(res, 400, 'Exam name is required');
    }

    const cleanExamType = examType && ALLOWED_EXAM_TYPES.includes(examType.toLowerCase().trim())
      ? examType.toLowerCase().trim()
      : 'mid_term';

    const maxVal = Number(maxMarks !== undefined ? maxMarks : 100);
    const obtainedVal = Number(obtainedMarks !== undefined ? obtainedMarks : marks);

    if (isNaN(maxVal) || maxVal <= 0) {
      return errorResponse(res, 400, 'Maximum marks must be a valid number greater than 0');
    }
    if (isNaN(obtainedVal) || obtainedVal < 0) {
      return errorResponse(res, 400, 'Obtained marks cannot be negative and must be a valid number');
    }
    if (obtainedVal > maxVal) {
      return errorResponse(res, 400, 'Obtained marks cannot exceed maximum marks');
    }

    // 2. Authorize student
    const { student, authorized, reason } = await findAndAuthorizeStudent(studentId, teacherProfile);
    if (!student) {
      return errorResponse(res, 404, reason || 'Student not found');
    }
    if (!authorized) {
      return errorResponse(res, 403, `Access denied. ${reason}`);
    }

    // 3. Upsert record
    let record = await Marks.findOne({
      where: {
        studentId: student.id,
        subject: subject.trim(),
        examType: cleanExamType,
        examName: examName.trim()
      }
    });

    if (record) {
      record.maxMarks = maxVal;
      record.obtainedMarks = obtainedVal;
      record.examDate = examDate || record.examDate;
      record.remarks = remarks !== undefined ? remarks : record.remarks;
      record.markedBy = userId;
      await record.save();
    } else {
      record = await Marks.create({
        studentId: student.id,
        subject: subject.trim(),
        examType: cleanExamType,
        examName: examName.trim(),
        maxMarks: maxVal,
        obtainedMarks: obtainedVal,
        examDate: examDate || new Date().toISOString().split('T')[0],
        remarks: remarks || '',
        markedBy: userId
      });
    }

    const percentage = calculatePercentage(obtainedVal, maxVal);
    const grade = calculateGrade(percentage);

    // Notify student and parent asynchronously
    notifyForMarks({ ...record.toJSON(), percentage, grade }, student).catch((err) =>
      console.error('[Notification Error on createMarks]:', err.message)
    );

    return successResponse(res, 200, 'Marks saved successfully', {
      id: record.id,
      studentId: student.studentId,
      subject: record.subject,
      examType: record.examType,
      examName: record.examName,
      maxMarks: maxVal,
      obtainedMarks: obtainedVal,
      percentage,
      grade,
      examDate: record.examDate,
      remarks: record.remarks
    });

  } catch (error) {
    console.error('[Create Single Mark Error]:', error.message);
    return errorResponse(res, 500, 'Failed to save marks');
  }
};

/**
 * Bulk Create or Update Marks for Multiple Students
 * @route POST /api/teacher/marks/bulk
 */
const bulkCreateMarks = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);

    const { subject, examType, examName, maxMarks, examDate, records } = req.body;

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Subject is required');
    }
    if (!examName || typeof examName !== 'string' || !examName.trim()) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Exam name is required');
    }
    if (!Array.isArray(records) || records.length === 0) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Records array is required and cannot be empty');
    }

    const cleanExamType = examType && ALLOWED_EXAM_TYPES.includes(examType.toLowerCase().trim())
      ? examType.toLowerCase().trim()
      : 'mid_term';

    const maxVal = Number(maxMarks !== undefined ? maxMarks : 100);
    if (isNaN(maxVal) || maxVal <= 0) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Maximum marks must be a valid number greater than 0');
    }

    const savedRecords = [];

    for (const rec of records) {
      if (!rec.studentId && !rec.studentProfileId) {
        await transaction.rollback();
        return errorResponse(res, 400, 'Each record must contain a valid studentId or studentProfileId');
      }

      const identifier = rec.studentProfileId || rec.studentId;
      const { student, authorized, reason } = await findAndAuthorizeStudent(identifier, teacherProfile);

      if (!student) {
        await transaction.rollback();
        return errorResponse(res, 404, reason || `Student ${identifier} not found`);
      }
      if (!authorized) {
        await transaction.rollback();
        return errorResponse(res, 403, `Access denied for student ${identifier}. ${reason}`);
      }

      const obtainedVal = Number(rec.obtainedMarks !== undefined ? rec.obtainedMarks : rec.marks);
      if (isNaN(obtainedVal) || obtainedVal < 0) {
        await transaction.rollback();
        return errorResponse(res, 400, `Invalid marks for student ${student.studentId}. Cannot be negative.`);
      }
      if (obtainedVal > maxVal) {
        await transaction.rollback();
        return errorResponse(res, 400, `Marks for student ${student.studentId} (${obtainedVal}) cannot exceed maximum marks (${maxVal})`);
      }

      let existingRecord = await Marks.findOne({
        where: {
          studentId: student.id,
          subject: subject.trim(),
          examType: cleanExamType,
          examName: examName.trim()
        },
        transaction
      });

      if (existingRecord) {
        existingRecord.maxMarks = maxVal;
        existingRecord.obtainedMarks = obtainedVal;
        existingRecord.examDate = examDate || existingRecord.examDate;
        existingRecord.remarks = rec.remarks !== undefined ? rec.remarks : existingRecord.remarks;
        existingRecord.markedBy = userId;
        await existingRecord.save({ transaction });
        savedRecords.push(existingRecord);
      } else {
        const newRecord = await Marks.create(
          {
            studentId: student.id,
            subject: subject.trim(),
            examType: cleanExamType,
            examName: examName.trim(),
            maxMarks: maxVal,
            obtainedMarks: obtainedVal,
            examDate: examDate || new Date().toISOString().split('T')[0],
            remarks: rec.remarks || '',
            markedBy: userId
          },
          { transaction }
        );
        savedRecords.push(newRecord);
      }
    }

    await transaction.commit();

    return successResponse(res, 200, `Successfully saved marks for ${savedRecords.length} students`, {
      count: savedRecords.length,
      subject: subject.trim(),
      examType: cleanExamType,
      examName: examName.trim()
    });

  } catch (error) {
    await transaction.rollback();
    console.error('[Bulk Create Marks Error]:', error.message);
    return errorResponse(res, 500, 'Failed to save bulk marks');
  }
};

/**
 * Update Existing Marks Record
 * @route PUT /api/teacher/marks/:id
 */
const updateMarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const teacherProfile = await getTeacherProfileForUser(userId);

    const mark = await Marks.findByPk(id, {
      include: [{ model: StudentProfile, as: 'studentProfile' }]
    });

    if (!mark) {
      return errorResponse(res, 404, 'Marks record not found');
    }

    // Verify teacher authorization for this student
    const teacherClass = teacherProfile.className ? teacherProfile.className.trim() : '';
    const teacherSection = teacherProfile.section ? teacherProfile.section.trim() : '';
    const studentClass = mark.studentProfile?.className ? mark.studentProfile.className.trim() : '';
    const studentSection = mark.studentProfile?.section ? mark.studentProfile.section.trim() : '';

    if (teacherClass && studentClass !== teacherClass) {
      return errorResponse(res, 403, 'Access denied. Student belongs to a different class.');
    }
    if (teacherSection && studentSection !== teacherSection) {
      return errorResponse(res, 403, 'Access denied. Student belongs to a different section.');
    }

    const { obtainedMarks, marks, maxMarks, remarks, examDate } = req.body;

    if (maxMarks !== undefined) {
      const maxVal = Number(maxMarks);
      if (isNaN(maxVal) || maxVal <= 0) return errorResponse(res, 400, 'Maximum marks must be greater than 0');
      mark.maxMarks = maxVal;
    }

    if (obtainedMarks !== undefined || marks !== undefined) {
      const obtainedVal = Number(obtainedMarks !== undefined ? obtainedMarks : marks);
      if (isNaN(obtainedVal) || obtainedVal < 0) return errorResponse(res, 400, 'Obtained marks cannot be negative');
      if (obtainedVal > Number(mark.maxMarks)) return errorResponse(res, 400, 'Obtained marks cannot exceed maximum marks');
      mark.obtainedMarks = obtainedVal;
    }

    if (remarks !== undefined) mark.remarks = remarks;
    if (examDate !== undefined) mark.examDate = examDate;

    mark.markedBy = userId;
    await mark.save();

    const percentage = calculatePercentage(Number(mark.obtainedMarks), Number(mark.maxMarks));
    const grade = calculateGrade(percentage);

    return successResponse(res, 200, 'Marks record updated successfully', {
      id: mark.id,
      subject: mark.subject,
      examType: mark.examType,
      examName: mark.examName,
      maxMarks: Number(mark.maxMarks),
      obtainedMarks: Number(mark.obtainedMarks),
      percentage,
      grade,
      examDate: mark.examDate,
      remarks: mark.remarks
    });

  } catch (error) {
    console.error('[Update Marks Error]:', error.message);
    return errorResponse(res, 500, 'Failed to update marks record');
  }
};

/**
 * Get Student Subject-wise and Exam-wise Marks History
 * @route GET /api/teacher/marks/student/:studentId
 */
const getStudentMarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;
    const teacherProfile = await getTeacherProfileForUser(userId);

    const { student, authorized, reason } = await findAndAuthorizeStudent(studentId, teacherProfile);
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

    const formattedMarks = marksRecords.map((m) => {
      const max = Number(m.maxMarks);
      const obtained = Number(m.obtainedMarks);
      const percentage = calculatePercentage(obtained, max);
      const grade = calculateGrade(percentage);

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

    return successResponse(res, 200, 'Student marks retrieved successfully', {
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.user?.name || '',
        email: student.user?.email || '',
        rollNumber: student.rollNumber || '',
        className: student.className,
        section: student.section
      },
      count: formattedMarks.length,
      marks: formattedMarks
    });

  } catch (error) {
    console.error('[Get Student Marks Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve student marks');
  }
};

/**
 * Get Student Cumulative Academic Result and Performance Analytics
 * @route GET /api/teacher/marks/student/:studentId/result
 */
const getStudentResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;
    const teacherProfile = await getTeacherProfileForUser(userId);

    const { student, authorized, reason } = await findAndAuthorizeStudent(studentId, teacherProfile);
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
      return successResponse(res, 200, 'Student performance summary retrieved', {
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

    return successResponse(res, 200, 'Student result calculated successfully', {
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
      overallGrade,
      gpa,
      subjects
    });

  } catch (error) {
    console.error('[Get Student Result Error]:', error.message);
    return errorResponse(res, 500, 'Failed to calculate student result');
  }
};

/**
 * Get Class Result Summary for Given Subject & Exam
 * @route GET /api/teacher/marks/summary
 */
const getClassResultSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);

    const { subject, examType, examName } = req.query;

    const targetSubject = subject && subject.trim()
      ? subject.trim()
      : Array.isArray(teacherProfile.subjects) && teacherProfile.subjects.length > 0
      ? teacherProfile.subjects[0]
      : 'Mathematics';

    const targetExamType = examType && ALLOWED_EXAM_TYPES.includes(examType.toLowerCase().trim())
      ? examType.toLowerCase().trim()
      : 'mid_term';

    const targetExamName = examName && examName.trim()
      ? examName.trim()
      : 'Mid Term Exam';

    // Query enrolled students
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

    const studentIds = students.map((s) => s.id);
    const marksRecords = await Marks.findAll({
      where: {
        studentId: { [Op.in]: studentIds.length > 0 ? studentIds : [0] },
        subject: targetSubject,
        examType: targetExamType,
        examName: targetExamName
      }
    });

    const totalStudents = students.length;
    const studentsWithMarks = marksRecords.length;

    if (studentsWithMarks === 0) {
      return successResponse(res, 200, 'Class result summary retrieved', {
        subject: targetSubject,
        examType: targetExamType,
        examName: targetExamName,
        totalStudents,
        studentsWithMarks: 0,
        classAverage: 0,
        highestMarks: 0,
        lowestMarks: 0,
        passCount: 0,
        failCount: 0
      });
    }

    let totalMarksSum = 0;
    let highestMarks = 0;
    let lowestMarks = Infinity;
    let passCount = 0;
    let failCount = 0;

    marksRecords.forEach((m) => {
      const max = Number(m.maxMarks);
      const obtained = Number(m.obtainedMarks);
      const percentage = calculatePercentage(obtained, max);

      totalMarksSum += obtained;
      if (obtained > highestMarks) highestMarks = obtained;
      if (obtained < lowestMarks) lowestMarks = obtained;

      if (percentage >= 40) {
        passCount += 1;
      } else {
        failCount += 1;
      }
    });

    const classAverage = Math.round((totalMarksSum / studentsWithMarks) * 100) / 100;

    return successResponse(res, 200, 'Class result summary retrieved successfully', {
      subject: targetSubject,
      examType: targetExamType,
      examName: targetExamName,
      totalStudents,
      studentsWithMarks,
      classAverage,
      highestMarks,
      lowestMarks: lowestMarks === Infinity ? 0 : lowestMarks,
      passCount,
      failCount
    });

  } catch (error) {
    console.error('[Get Class Result Summary Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve class result summary');
  }
};

module.exports = {
  getClassMarks,
  createMarks,
  bulkCreateMarks,
  updateMarks,
  getStudentMarks,
  getStudentResult,
  getClassResultSummary
};
