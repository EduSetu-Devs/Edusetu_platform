const hasTeacherClassAssignment = (teacher, student) => {
  if (!teacher || !student) return false;
  const teacherClass = teacher.className?.trim();
  const teacherSection = teacher.section?.trim();

  if (!teacherClass) return false;
  if (teacherClass && student.className?.trim() !== teacherClass) return false;
  if (teacherSection && student.section?.trim() !== teacherSection) return false;
  return true;
};

const isTeacherAssignedToStudent = async (teacher, student, TutorRequest) => {
  if (!teacher || !student || !TutorRequest) return false;
  if (hasTeacherClassAssignment(teacher, student)) return true;

  return Boolean(await TutorRequest.findOne({
    where: {
      tutorUserId: teacher.userId,
      studentProfileId: student.id,
      status: 'accepted'
    },
    attributes: ['id']
  }));
};

const isParentLinkedToStudent = (parentProfileId, studentProfileId, link) =>
  Boolean(link && link.parentProfileId === parentProfileId && link.studentProfileId === studentProfileId);

const normalizeChatMessage = (message) => {
  if (typeof message !== 'string') return { valid: false, error: 'Message text is required and cannot be empty' };

  const text = message.trim();
  if (!text) return { valid: false, error: 'Message text is required and cannot be empty' };
  if (text.length > 2000) return { valid: false, error: 'Message exceeds the maximum limit of 2000 characters' };
  return { valid: true, text };
};

module.exports = {
  hasTeacherClassAssignment,
  isTeacherAssignedToStudent,
  isParentLinkedToStudent,
  normalizeChatMessage
};
