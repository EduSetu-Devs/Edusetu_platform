const { Op } = require('sequelize');
const {
  Course,
  CourseEnrollment,
  TeacherProfile,
  StudentProfile,
  ParentProfile,
  ParentStudent,
  User,
  Notification
} = require('../models');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Public/Authenticated: List all available courses
 * @route GET /api/courses
 */
const listCourses = async (req, res) => {
  try {
    const { search, subject, gradeLevel, status = 'active' } = req.query;

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (subject && subject.trim() && subject !== 'All') {
      where.subject = { [Op.like]: `%${subject.trim()}%` };
    }
    if (gradeLevel && gradeLevel.trim() && gradeLevel !== 'All') {
      where.gradeLevel = { [Op.like]: `%${gradeLevel.trim()}%` };
    }
    if (search && search.trim()) {
      const q = search.trim();
      where[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
        { subject: { [Op.like]: `%${q}%` } }
      ];
    }

    const courses = await Course.findAll({
      where,
      include: [
        {
          model: TeacherProfile,
          as: 'teacher',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'profileImage', 'email']
            }
          ]
        },
        {
          model: CourseEnrollment,
          as: 'enrollments',
          attributes: ['id', 'studentProfileId', 'status']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    let currentStudentId = null;
    if (req.user && req.user.role === 'student') {
      const sp = await StudentProfile.findOne({ where: { userId: req.user.id } });
      if (sp) currentStudentId = sp.id;
    }

    const formatted = courses.map((c) => {
      const plain = c.get({ plain: true });
      const enrollments = plain.enrollments || [];
      const isEnrolled = currentStudentId
        ? enrollments.some((e) => e.studentProfileId === currentStudentId && e.status === 'active')
        : false;

      return {
        id: plain.id,
        title: plain.title,
        description: plain.description,
        subject: plain.subject,
        gradeLevel: plain.gradeLevel,
        thumbnail: plain.thumbnail,
        price: Number(plain.price) || 0,
        durationWeeks: plain.durationWeeks,
        totalLessons: plain.totalLessons,
        schedule: plain.schedule,
        status: plain.status,
        enrolledCount: enrollments.filter((e) => e.status === 'active').length,
        isEnrolled,
        teacher: plain.teacher?.user ? {
          id: plain.teacher.id,
          name: plain.teacher.user.name,
          email: plain.teacher.user.email,
          profileImage: plain.teacher.user.profileImage,
          designation: plain.teacher.designation || 'Subject Faculty',
          department: plain.teacher.department || plain.subject
        } : {
          name: 'EduSetu Academic Faculty',
          designation: 'Senior Faculty',
          department: plain.subject
        }
      };
    });

    return successResponse(res, 200, 'Courses retrieved successfully', {
      total: formatted.length,
      courses: formatted
    });
  } catch (error) {
    console.error('[List Courses Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve courses');
  }
};

/**
 * Get Course Details by ID
 * @route GET /api/courses/:id
 */
const getCourseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id, {
      include: [
        {
          model: TeacherProfile,
          as: 'teacher',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'profileImage', 'email']
            }
          ]
        },
        {
          model: CourseEnrollment,
          as: 'enrollments',
          include: [
            {
              model: StudentProfile,
              as: 'studentProfile',
              include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profileImage'] }]
            }
          ]
        }
      ]
    });

    if (!course) {
      return errorResponse(res, 404, 'Course not found');
    }

    const plain = course.get({ plain: true });
    let currentEnrollment = null;

    if (req.user && req.user.role === 'student') {
      const sp = await StudentProfile.findOne({ where: { userId: req.user.id } });
      if (sp) {
        currentEnrollment = (plain.enrollments || []).find(
          (e) => e.studentProfileId === sp.id && e.status === 'active'
        );
      }
    }

    return successResponse(res, 200, 'Course details retrieved', {
      course: {
        id: plain.id,
        title: plain.title,
        description: plain.description,
        subject: plain.subject,
        gradeLevel: plain.gradeLevel,
        price: Number(plain.price) || 0,
        durationWeeks: plain.durationWeeks,
        totalLessons: plain.totalLessons,
        schedule: plain.schedule,
        status: plain.status,
        enrolledCount: (plain.enrollments || []).filter((e) => e.status === 'active').length,
        isEnrolled: !!currentEnrollment,
        currentEnrollment: currentEnrollment ? {
          enrolledAt: currentEnrollment.enrolledAt,
          progress: currentEnrollment.progress,
          completedLessons: currentEnrollment.completedLessons
        } : null,
        teacher: plain.teacher?.user ? {
          id: plain.teacher.id,
          name: plain.teacher.user.name,
          email: plain.teacher.user.email,
          profileImage: plain.teacher.user.profileImage,
          designation: plain.teacher.designation || 'Subject Faculty',
          department: plain.teacher.department || plain.subject
        } : null
      }
    });
  } catch (error) {
    console.error('[Get Course Details Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve course details');
  }
};

/**
 * Enroll in a course (Student or Parent on behalf of child)
 * @route POST /api/courses/:id/enroll
 */
const enrollCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const course = await Course.findByPk(courseId, {
      include: [
        {
          model: TeacherProfile,
          as: 'teacher',
          include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
        }
      ]
    });

    if (!course) {
      return errorResponse(res, 404, 'Course not found');
    }

    let targetStudentProfileId = null;
    let studentUser = null;

    if (req.user.role === 'student') {
      let sp = await StudentProfile.findOne({ where: { userId: req.user.id } });
      if (!sp) {
        const timestampPart = Date.now().toString().slice(-4);
        sp = await StudentProfile.create({
          userId: req.user.id,
          studentId: `STU${String(req.user.id).padStart(3, '0')}${timestampPart}`,
          className: course.gradeLevel || 'Class 10'
        });
      }
      targetStudentProfileId = sp.id;
      studentUser = req.user;
    } else if (req.user.role === 'parent') {
      const parent = await ParentProfile.findOne({ where: { userId: req.user.id } });
      if (!parent) {
        return errorResponse(res, 404, 'Parent profile not found');
      }

      const { studentProfileId } = req.body;
      let link;
      if (studentProfileId) {
        link = await ParentStudent.findOne({
          where: { parentProfileId: parent.id, studentProfileId: Number(studentProfileId) },
          include: [{ model: StudentProfile, as: 'studentProfile', include: [{ model: User, as: 'user' }] }]
        });
      } else {
        link = await ParentStudent.findOne({
          where: { parentProfileId: parent.id },
          include: [{ model: StudentProfile, as: 'studentProfile', include: [{ model: User, as: 'user' }] }]
        });
      }

      if (!link || !link.studentProfile) {
        return errorResponse(res, 400, 'No linked child found to enroll in this course');
      }

      targetStudentProfileId = link.studentProfile.id;
      studentUser = link.studentProfile.user;
    } else {
      return errorResponse(res, 403, 'Only students and parents can enroll in courses');
    }

    // Check existing enrollment
    const existing = await CourseEnrollment.findOne({
      where: { courseId, studentProfileId: targetStudentProfileId }
    });

    if (existing) {
      if (existing.status === 'active') {
        return successResponse(res, 200, 'Student is already actively enrolled in this course', {
          enrollment: existing,
          alreadyEnrolled: true
        });
      }
      existing.status = 'active';
      existing.enrolledAt = new Date();
      await existing.save();
      return successResponse(res, 200, 'Course enrollment re-activated successfully', {
        enrollment: existing,
        alreadyEnrolled: false
      });
    }

    // Create new enrollment
    const enrollment = await CourseEnrollment.create({
      courseId,
      studentProfileId: targetStudentProfileId,
      status: 'active',
      progress: 0,
      completedLessons: 0,
      enrolledAt: new Date()
    });

    // 1. Notify Student
    try {
      if (studentUser) {
        await Notification.create({
          recipientUserId: studentUser.id,
          title: `Enrolled: ${course.title}`,
          message: `Congratulations! You are now enrolled in ${course.title} (${course.subject}). Classes schedule: ${course.schedule || 'TBA'}.`,
          type: 'GENERAL',
          isRead: false
        });
      }
    } catch (nErr) {
      console.warn('[Notification student error]:', nErr.message);
    }

    // 2. Notify Teacher
    try {
      if (course.teacher?.user?.id) {
        await Notification.create({
          recipientUserId: course.teacher.user.id,
          title: `New Student Enrolled in ${course.title}`,
          message: `${studentUser?.name || 'A new student'} has enrolled in your course batch: ${course.title}.`,
          type: 'GENERAL',
          isRead: false
        });
      }
    } catch (nErr) {
      console.warn('[Notification teacher error]:', nErr.message);
    }

    // 3. Notify Linked Parents
    try {
      const parentLinks = await ParentStudent.findAll({
        where: { studentProfileId: targetStudentProfileId },
        include: [{ model: ParentProfile, as: 'parentProfile', include: [{ model: User, as: 'user' }] }]
      });
      for (const pl of parentLinks) {
        if (pl.parentProfile?.user?.id) {
          await Notification.create({
            recipientUserId: pl.parentProfile.user.id,
            title: `Child Enrolled: ${course.title}`,
            message: `Your child ${studentUser?.name || 'Student'} was successfully enrolled in ${course.title} (${course.subject}).`,
            type: 'GENERAL',
            isRead: false
          });
        }
      }
    } catch (nErr) {
      console.warn('[Notification parent error]:', nErr.message);
    }

    return successResponse(res, 201, `Successfully enrolled in ${course.title}!`, {
      enrollment,
      alreadyEnrolled: false
    });
  } catch (error) {
    console.error('[Enroll Course Error]:', error);
    return errorResponse(res, 500, 'Failed to process course enrollment');
  }
};

/**
 * Get Enrolled Courses for authenticated Student
 * @route GET /api/student/enrolled-courses
 */
const getStudentEnrolledCourses = async (req, res) => {
  try {
    const sp = await StudentProfile.findOne({ where: { userId: req.user.id } });
    if (!sp) {
      return successResponse(res, 200, 'No enrolled courses found', { courses: [], total: 0 });
    }

    const enrollments = await CourseEnrollment.findAll({
      where: { studentProfileId: sp.id, status: 'active' },
      include: [
        {
          model: Course,
          as: 'course',
          include: [
            {
              model: TeacherProfile,
              as: 'teacher',
              include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profileImage', 'email'] }]
            }
          ]
        }
      ],
      order: [['enrolledAt', 'DESC']]
    });

    const courses = enrollments.map((e) => {
      const c = e.course;
      return {
        enrollmentId: e.id,
        courseId: c.id,
        title: c.title,
        description: c.description,
        subject: c.subject,
        gradeLevel: c.gradeLevel,
        schedule: c.schedule,
        totalLessons: c.totalLessons,
        completedLessons: e.completedLessons,
        progress: e.progress,
        status: e.status,
        enrolledAt: e.enrolledAt,
        teacher: c.teacher?.user ? {
          name: c.teacher.user.name,
          email: c.teacher.user.email,
          profileImage: c.teacher.user.profileImage,
          designation: c.teacher.designation || 'Course Faculty'
        } : {
          name: 'EduSetu Academic Faculty',
          designation: 'Senior Faculty'
        }
      };
    });

    return successResponse(res, 200, 'Enrolled courses retrieved', {
      total: courses.length,
      courses
    });
  } catch (error) {
    console.error('[Student Enrolled Courses Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve enrolled courses');
  }
};

/**
 * Get Teacher's Courses and Enrolled Students
 * @route GET /api/teacher/courses
 */
const getTeacherCourses = async (req, res) => {
  try {
    const tp = await TeacherProfile.findOne({ where: { userId: req.user.id } });
    if (!tp) {
      return successResponse(res, 200, 'No courses found', { courses: [], totalStudents: 0 });
    }

    const courses = await Course.findAll({
      where: { teacherProfileId: tp.id },
      include: [
        {
          model: CourseEnrollment,
          as: 'enrollments',
          where: { status: 'active' },
          required: false,
          include: [
            {
              model: StudentProfile,
              as: 'studentProfile',
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'name', 'email', 'phone', 'profileImage']
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    let totalStudents = 0;
    const formatted = courses.map((c) => {
      const plain = c.get({ plain: true });
      const enrollments = plain.enrollments || [];
      totalStudents += enrollments.length;

      return {
        id: plain.id,
        title: plain.title,
        description: plain.description,
        subject: plain.subject,
        gradeLevel: plain.gradeLevel,
        price: Number(plain.price) || 0,
        schedule: plain.schedule,
        totalLessons: plain.totalLessons,
        status: plain.status,
        enrolledCount: enrollments.length,
        students: enrollments.map((e) => ({
          enrollmentId: e.id,
          studentId: e.studentProfile?.studentId || 'N/A',
          name: e.studentProfile?.user?.name || 'Student',
          email: e.studentProfile?.user?.email || '',
          phone: e.studentProfile?.user?.phone || '',
          className: e.studentProfile?.className || plain.gradeLevel,
          section: e.studentProfile?.section || 'A',
          rollNumber: e.studentProfile?.rollNumber || '',
          progress: e.progress,
          enrolledAt: e.enrolledAt
        }))
      };
    });

    return successResponse(res, 200, 'Teacher courses retrieved', {
      courses: formatted,
      totalCourses: formatted.length,
      totalEnrolledStudents: totalStudents
    });
  } catch (error) {
    console.error('[Get Teacher Courses Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve teacher courses');
  }
};

/**
 * Teacher Creates a New Course / Academic Batch
 * @route POST /api/teacher/courses
 */
const createTeacherCourse = async (req, res) => {
  try {
    const tp = await TeacherProfile.findOne({ where: { userId: req.user.id } });
    if (!tp) {
      return errorResponse(res, 404, 'Teacher profile not found');
    }

    const {
      title,
      description,
      subject,
      gradeLevel = 'Class 10',
      price = 0,
      durationWeeks = 12,
      totalLessons = 24,
      schedule = 'Mon, Wed, Fri · 5:00 PM'
    } = req.body;

    if (!title || !title.trim()) {
      return errorResponse(res, 400, 'Course title is required');
    }
    if (!subject || !subject.trim()) {
      return errorResponse(res, 400, 'Course subject is required');
    }

    const course = await Course.create({
      teacherProfileId: tp.id,
      title: title.trim(),
      description: description?.trim() || '',
      subject: subject.trim(),
      gradeLevel: gradeLevel.trim(),
      price: Number(price) || 0,
      durationWeeks: Number(durationWeeks) || 12,
      totalLessons: Number(totalLessons) || 24,
      schedule: schedule.trim(),
      status: 'active'
    });

    return successResponse(res, 201, 'Course created successfully', { course });
  } catch (error) {
    console.error('[Create Teacher Course Error]:', error);
    return errorResponse(res, 500, 'Failed to create course');
  }
};

/**
 * Get Parent's Child's Enrolled Courses
 * @route GET /api/parent/children/:studentId/courses
 */
const getChildEnrolledCourses = async (req, res) => {
  try {
    const parent = await ParentProfile.findOne({ where: { userId: req.user.id } });
    if (!parent) {
      return errorResponse(res, 404, 'Parent profile not found');
    }

    const { studentId } = req.params;
    let studentProfile = null;

    if (!isNaN(Number(studentId))) {
      studentProfile = await StudentProfile.findOne({
        where: { [Op.or]: [{ id: Number(studentId) }, { studentId: String(studentId) }] }
      });
    } else {
      studentProfile = await StudentProfile.findOne({ where: { studentId: String(studentId) } });
    }

    if (!studentProfile) {
      return errorResponse(res, 404, 'Child profile not found');
    }

    // Verify parent-student relationship
    const link = await ParentStudent.findOne({
      where: { parentProfileId: parent.id, studentProfileId: studentProfile.id }
    });

    if (!link) {
      return errorResponse(res, 403, 'Unauthorized access to this student profile');
    }

    const enrollments = await CourseEnrollment.findAll({
      where: { studentProfileId: studentProfile.id, status: 'active' },
      include: [
        {
          model: Course,
          as: 'course',
          include: [
            {
              model: TeacherProfile,
              as: 'teacher',
              include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profileImage', 'email'] }]
            }
          ]
        }
      ],
      order: [['enrolledAt', 'DESC']]
    });

    const courses = enrollments.map((e) => {
      const c = e.course;
      return {
        enrollmentId: e.id,
        courseId: c.id,
        title: c.title,
        subject: c.subject,
        gradeLevel: c.gradeLevel,
        schedule: c.schedule,
        progress: e.progress,
        completedLessons: e.completedLessons,
        totalLessons: c.totalLessons,
        enrolledAt: e.enrolledAt,
        teacher: c.teacher?.user ? {
          name: c.teacher.user.name,
          email: c.teacher.user.email,
          designation: c.teacher.designation || 'Course Faculty'
        } : {
          name: 'EduSetu Academic Faculty',
          designation: 'Senior Faculty'
        }
      };
    });

    return successResponse(res, 200, "Child's enrolled courses retrieved", {
      studentId: studentProfile.studentId,
      total: courses.length,
      courses
    });
  } catch (error) {
    console.error('[Get Child Enrolled Courses Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve child enrolled courses');
  }
};

/**
 * Admin Overview of Courses and Enrollments
 * @route GET /api/admin/courses/overview
 */
const getAdminCoursesOverview = async (req, res) => {
  try {
    const totalCourses = await Course.count();
    const activeCourses = await Course.count({ where: { status: 'active' } });
    const totalEnrollments = await CourseEnrollment.count({ where: { status: 'active' } });

    const courses = await Course.findAll({
      include: [
        {
          model: TeacherProfile,
          as: 'teacher',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
        },
        {
          model: CourseEnrollment,
          as: 'enrollments',
          where: { status: 'active' },
          required: false,
          include: [
            {
              model: StudentProfile,
              as: 'studentProfile',
              include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formatted = courses.map((c) => {
      const plain = c.get({ plain: true });
      const enrollments = plain.enrollments || [];
      return {
        id: plain.id,
        title: plain.title,
        subject: plain.subject,
        gradeLevel: plain.gradeLevel,
        price: Number(plain.price) || 0,
        status: plain.status,
        schedule: plain.schedule,
        enrolledCount: enrollments.length,
        teacherName: plain.teacher?.user?.name || 'Unassigned',
        enrolledStudents: enrollments.map((e) => ({
          studentId: e.studentProfile?.studentId,
          name: e.studentProfile?.user?.name || 'Student',
          email: e.studentProfile?.user?.email || '',
          enrolledAt: e.enrolledAt,
          progress: e.progress
        }))
      };
    });

    return successResponse(res, 200, 'Admin course overview retrieved', {
      metrics: {
        totalCourses,
        activeCourses,
        totalEnrollments
      },
      courses: formatted
    });
  } catch (error) {
    console.error('[Get Admin Courses Overview Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve admin course overview');
  }
};

module.exports = {
  listCourses,
  getCourseDetails,
  enrollCourse,
  getStudentEnrolledCourses,
  getTeacherCourses,
  createTeacherCourse,
  getChildEnrolledCourses,
  getAdminCoursesOverview
};
