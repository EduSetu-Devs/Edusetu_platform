const { Op } = require('sequelize');
const { User, StudentProfile, TeacherProfile, Attendance, Marks, Homework, HomeworkSubmission, Course, CourseEnrollment } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { calculatePercentage, calculateGrade } = require('../utils/gradeCalculator');

/**
 * Helper to retrieve teacher profile and ensure teacher exists
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
 * Helper to find and authorize student under teacher's assigned class/section
 */
const getAuthorizedStudentProfile = async (teacherProfile, studentIdParam) => {
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
        attributes: ['id', 'name', 'email', 'phone', 'profileImage', 'isActive']
      }
    ]
  });

  if (!studentProfile) {
    return { authorized: false, notFound: true };
  }

  // Authorization Check: Student must match teacher's assigned class/section OR be enrolled in teacher's course
  let matchesClassSection = true;
  if (teacherProfile.className && teacherProfile.className.trim()) {
    if (studentProfile.className !== teacherProfile.className.trim()) {
      matchesClassSection = false;
    }
  }

  if (teacherProfile.section && teacherProfile.section.trim()) {
    if (studentProfile.section !== teacherProfile.section.trim()) {
      matchesClassSection = false;
    }
  }

  if (!matchesClassSection) {
    // Check if student is actively enrolled in one of this teacher's courses
    const teacherCourseIds = await Course.findAll({
      where: { teacherProfileId: teacherProfile.id },
      attributes: ['id']
    });
    if (teacherCourseIds.length > 0) {
      const isEnrolledInCourse = await CourseEnrollment.findOne({
        where: {
          courseId: teacherCourseIds.map(c => c.id),
          studentProfileId: studentProfile.id,
          status: 'active'
        }
      });
      if (isEnrolledInCourse) {
        return { authorized: true, notFound: false, studentProfile };
      }
    }
    return { authorized: false, notFound: false, studentProfile };
  }

  return { authorized: true, notFound: false, studentProfile };
};

/**
 * Get Students Assigned to Teacher's Class/Section with Search & Filter
 * @route GET /api/teacher/students
 * @query search (optional: name, studentId, email)
 */
const getMyStudents = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);

    const { search } = req.query;

    // 1. Build Base Filter for Teacher's Class & Section
    const studentWhereClause = {};
    if (teacherProfile.className && teacherProfile.className.trim()) {
      studentWhereClause.className = teacherProfile.className.trim();
    }
    if (teacherProfile.section && teacherProfile.section.trim()) {
      studentWhereClause.section = teacherProfile.section.trim();
    }

    // Also find students enrolled in any of this teacher's active courses
    let enrolledStudentIds = [];
    const teacherCourses = await Course.findAll({
      where: { teacherProfileId: teacherProfile.id },
      attributes: ['id']
    });
    if (teacherCourses.length > 0) {
      const enrollments = await CourseEnrollment.findAll({
        where: {
          courseId: teacherCourses.map((c) => c.id),
          status: 'active'
        },
        attributes: ['studentProfileId']
      });
      enrolledStudentIds = enrollments.map((e) => e.studentProfileId);
    }

    let combinedStudentFilter = {};
    const hasClassSectionFilter = Object.keys(studentWhereClause).length > 0;

    if (hasClassSectionFilter && enrolledStudentIds.length > 0) {
      combinedStudentFilter = {
        [Op.or]: [
          studentWhereClause,
          { id: enrolledStudentIds }
        ]
      };
    } else if (hasClassSectionFilter) {
      combinedStudentFilter = studentWhereClause;
    } else if (enrolledStudentIds.length > 0) {
      combinedStudentFilter = { id: enrolledStudentIds };
    }

    const userWhereClause = {};

    // 2. Handle Search Query
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchOr = [
        { studentId: { [Op.like]: `%${searchTerm}%` } },
        { '$user.name$': { [Op.like]: `%${searchTerm}%` } },
        { '$user.email$': { [Op.like]: `%${searchTerm}%` } }
      ];
      if (Object.keys(combinedStudentFilter).length > 0) {
        combinedStudentFilter = {
          [Op.and]: [combinedStudentFilter, { [Op.or]: searchOr }]
        };
      } else {
        combinedStudentFilter = { [Op.or]: searchOr };
      }
    }

    // 3. Fetch Authorized Students
    const students = await StudentProfile.findAll({
      where: combinedStudentFilter,
      include: [
        {
          model: User,
          as: 'user',
          where: userWhereClause,
          attributes: ['id', 'name', 'email', 'phone', 'profileImage', 'isActive']
        }
      ],
      order: [
        ['rollNumber', 'ASC'],
        ['studentId', 'ASC']
      ]
    });

    const formattedStudents = students.map((sp) => ({
      id: sp.id,
      studentId: sp.studentId,
      name: sp.user?.name || '',
      email: sp.user?.email || '',
      phone: sp.phone || sp.user?.phone || '',
      className: sp.className || '',
      section: sp.section || '',
      rollNumber: sp.rollNumber || '',
      gender: sp.gender || '',
      dateOfBirth: sp.dateOfBirth || null,
      address: sp.address || ''
    }));

    return successResponse(res, 200, 'Assigned students retrieved successfully', {
      teacher: {
        teacherId: teacherProfile.teacherId,
        className: teacherProfile.className || 'All Classes',
        section: teacherProfile.section || 'All Sections'
      },
      students: formattedStudents,
      count: formattedStudents.length
    });

  } catch (error) {
    console.error('[Get Teacher Students Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve students list');
  }
};

/**
 * Get Specific Student Details by ID
 * @route GET /api/teacher/students/:studentId
 */
const getStudentDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);
    const { studentId } = req.params;

    const { authorized, notFound, studentProfile } = await getAuthorizedStudentProfile(
      teacherProfile,
      studentId
    );

    if (notFound) {
      return errorResponse(res, 404, 'Student profile not found');
    }

    if (!authorized) {
      return errorResponse(res, 403, 'Access denied. This student is not in your assigned class or section.');
    }

    const safeStudent = {
      id: studentProfile.id,
      studentId: studentProfile.studentId,
      name: studentProfile.user?.name || '',
      email: studentProfile.user?.email || '',
      phone: studentProfile.phone || studentProfile.user?.phone || '',
      className: studentProfile.className || '',
      section: studentProfile.section || '',
      rollNumber: studentProfile.rollNumber || '',
      gender: studentProfile.gender || '',
      dateOfBirth: studentProfile.dateOfBirth || null,
      address: studentProfile.address || '',
      createdAt: studentProfile.createdAt
    };

    return successResponse(res, 200, 'Student details retrieved successfully', safeStudent);

  } catch (error) {
    console.error('[Get Student Details Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve student details');
  }
};

/**
 * Get Student Attendance Summary for Teacher
 * @route GET /api/teacher/students/:studentId/attendance
 */
const getStudentAttendanceSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);
    const { studentId } = req.params;

    const { authorized, notFound, studentProfile } = await getAuthorizedStudentProfile(
      teacherProfile,
      studentId
    );

    if (notFound) {
      return errorResponse(res, 404, 'Student profile not found');
    }

    if (!authorized) {
      return errorResponse(res, 403, 'Access denied. This student is not in your assigned class or section.');
    }

    // Query all attendance records for this student
    const attendances = await Attendance.findAll({
      where: { studentProfileId: studentProfile.id }
    });

    const totalClasses = attendances.length;
    const present = attendances.filter((a) => a.status === 'present').length;
    const absent = attendances.filter((a) => a.status === 'absent').length;
    const late = attendances.filter((a) => a.status === 'late').length;
    const leave = attendances.filter((a) => a.status === 'leave').length;

    const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;

    return successResponse(res, 200, 'Student attendance summary retrieved successfully', {
      studentId: studentProfile.studentId,
      studentName: studentProfile.user?.name || '',
      totalClasses,
      present,
      absent,
      late,
      leave,
      percentage,
      attendancePercentage: percentage
    });

  } catch (error) {
    console.error('[Teacher Student Attendance Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve student attendance summary');
  }
};

/**
 * Get Student Marks & Academic Performance Summary for Teacher
 * @route GET /api/teacher/students/:studentId/marks
 */
const getStudentMarksSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);
    const { studentId } = req.params;

    const { authorized, notFound, studentProfile } = await getAuthorizedStudentProfile(
      teacherProfile,
      studentId
    );

    if (notFound) {
      return errorResponse(res, 404, 'Student profile not found');
    }

    if (!authorized) {
      return errorResponse(res, 403, 'Access denied. This student is not in your assigned class or section.');
    }

    const marksRecords = await Marks.findAll({
      where: { studentId: studentProfile.id },
      order: [['examDate', 'DESC'], ['id', 'DESC']]
    });

    if (marksRecords.length === 0) {
      return successResponse(res, 200, 'No marks records available', {
        studentId: studentProfile.studentId,
        studentName: studentProfile.user?.name || '',
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

    marksRecords.forEach((mark) => {
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

    return successResponse(res, 200, 'Student marks summary retrieved successfully', {
      studentId: studentProfile.studentId,
      studentName: studentProfile.user?.name || '',
      totalExams: marksRecords.length,
      totalMaxMarks: Math.round(totalMaxMarks * 100) / 100,
      totalObtainedMarks: Math.round(totalObtainedMarks * 100) / 100,
      overallPercentage,
      overallGrade,
      subjects
    });

  } catch (error) {
    console.error('[Teacher Student Marks Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve student marks summary');
  }
};

/**
 * Get Student Homework & Submission Summary for Teacher
 * @route GET /api/teacher/students/:studentId/homework
 */
const getStudentHomeworkSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const teacherProfile = await getTeacherProfileForUser(userId);
    const { studentId } = req.params;

    const { authorized, notFound, studentProfile } = await getAuthorizedStudentProfile(
      teacherProfile,
      studentId
    );

    if (notFound) {
      return errorResponse(res, 404, 'Student profile not found');
    }

    if (!authorized) {
      return errorResponse(res, 403, 'Access denied. This student is not in your assigned class or section.');
    }

    // Fetch all active/closed homework for the student's class
    const homeworkWhere = {
      status: { [Op.ne]: 'draft' }
    };
    if (studentProfile.className && studentProfile.className.trim()) {
      homeworkWhere.className = studentProfile.className.trim();
    }

    const homeworks = await Homework.findAll({
      where: homeworkWhere,
      order: [['dueDate', 'DESC']]
    });

    const homeworkIds = homeworks.map((h) => h.id);

    // Fetch submissions for this student
    const submissions = await HomeworkSubmission.findAll({
      where: {
        homeworkId: { [Op.in]: homeworkIds },
        studentId: studentProfile.id
      },
      include: [
        {
          model: Homework,
          as: 'homework',
          attributes: ['id', 'title', 'subject', 'dueDate']
        }
      ],
      order: [['submittedAt', 'DESC']]
    });

    const totalAssignments = homeworks.length;
    const submittedCount = submissions.filter((s) => s.status === 'submitted').length;
    const lateCount = submissions.filter((s) => s.status === 'late').length;
    const reviewedCount = submissions.filter((s) => s.status === 'reviewed').length;
    const pendingCount = Math.max(0, totalAssignments - (submittedCount + lateCount + reviewedCount));

    const recentSubmissions = submissions.slice(0, 5).map((s) => ({
      id: s.id,
      homeworkId: s.homeworkId,
      homeworkTitle: s.homework?.title || 'Assignment',
      subject: s.homework?.subject || '',
      status: s.status,
      submittedAt: s.submittedAt
    }));

    return successResponse(res, 200, 'Student homework summary retrieved successfully', {
      studentId: studentProfile.studentId,
      studentName: studentProfile.user?.name || '',
      totalAssignments,
      submitted: submittedCount,
      late: lateCount,
      reviewed: reviewedCount,
      pending: pendingCount,
      recentSubmissions
    });

  } catch (error) {
    console.error('[Teacher Student Homework Error]:', error.message);
    return errorResponse(res, 500, 'Failed to retrieve student homework summary');
  }
};

module.exports = {
  getMyStudents,
  getStudentDetails,
  getStudentAttendanceSummary,
  getStudentMarksSummary,
  getStudentHomeworkSummary
};
