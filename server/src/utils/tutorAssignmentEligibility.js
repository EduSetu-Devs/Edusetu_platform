const getStudentAge = (dateOfBirth, referenceDate = new Date()) => {
  if (typeof dateOfBirth !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return { age: null, reason: dateOfBirth ? 'dob_invalid' : 'dob_missing' };
  }

  const parsedDate = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== dateOfBirth) {
    return { age: null, reason: 'dob_invalid' };
  }

  const today = referenceDate.toISOString().slice(0, 10);
  if (dateOfBirth > today) return { age: null, reason: 'dob_invalid' };

  const [birthYear, birthMonth, birthDay] = dateOfBirth.split('-').map(Number);
  const [currentYear, currentMonth, currentDay] = today.split('-').map(Number);
  let age = currentYear - birthYear;
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) age -= 1;
  return { age, reason: null };
};

const getTutorAssignmentDecision = (student, requesterRole, referenceDate = new Date()) => {
  if (student?.ageVerificationStatus !== 'verified') {
    const statusReasons = {
      pending: 'age_verification_pending',
      rejected: 'age_verification_rejected',
      unverified: 'age_unverified'
    };
    return {
      canRequest: false,
      reason: statusReasons[student?.ageVerificationStatus] || 'age_unverified'
    };
  }

  const { age, reason } = getStudentAge(student.dateOfBirth, referenceDate);
  if (reason) return { canRequest: false, reason };

  if (requesterRole === 'student') {
    return age > 18
      ? { canRequest: true, reason: 'eligible' }
      : { canRequest: false, reason: 'parent_required' };
  }

  if (requesterRole === 'parent') {
    return age <= 18
      ? { canRequest: true, reason: 'eligible' }
      : { canRequest: false, reason: 'adult_student_must_request_independently' };
  }

  return { canRequest: false, reason: 'requester_not_allowed' };
};

module.exports = { getStudentAge, getTutorAssignmentDecision };
