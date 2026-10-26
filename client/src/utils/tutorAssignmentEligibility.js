export const getTutorAssignmentMessage = (reason) => {
  switch (reason) {
    case 'dob_missing':
      return 'A valid date of birth is required before a tutor request can be made. Complete the student profile first.';
    case 'dob_invalid':
      return 'The date of birth on this student profile is invalid. Update the profile before requesting a tutor.';
    case 'age_unverified':
      return 'Age eligibility has not been verified. Tutor requests remain unavailable until an administrator reviews the age record.';
    case 'age_verification_pending':
      return 'Age eligibility is pending administrator review. Tutor requests remain unavailable until a decision is made.';
    case 'age_verification_rejected':
      return 'Age eligibility was not verified. Update the date of birth if needed and contact the administrator to request a new review.';
    case 'parent_required':
      return 'Students aged 18 or younger must ask a linked parent or guardian to select and request a tutor.';
    case 'adult_student_must_request_independently':
      return 'Adult students must select and request tutors from their own account.';
    case 'eligible':
      return 'Tutor requests are available for this account.';
    default:
      return 'Tutor requests are not available for this account.';
  }
};

export const getParentAssignmentSummary = (eligibility) => {
  const children = eligibility?.children || [];
  const eligibleCount = children.filter(child => child.canRequest).length;
  if (!children.length) return 'Link a child to your parent account before requesting a tutor.';
  if (!eligibleCount) return getTutorAssignmentMessage(children[0].reason);
  return `${eligibleCount} linked child(ren) can receive parent-managed tutor requests. Adult students must make their own requests.`;
};
