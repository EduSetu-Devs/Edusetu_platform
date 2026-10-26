const assert = require('node:assert/strict');
const { getStudentAge, getTutorAssignmentDecision } = require('./src/utils/tutorAssignmentEligibility');

const today = new Date('2026-10-21T12:00:00.000Z');
const dobForAge = (age, birthdayPassed = true) =>
  `${today.getUTCFullYear() - age}-${birthdayPassed ? '01-01' : '12-31'}`;

assert.equal(getStudentAge(dobForAge(17), today).age, 17);
const verifiedStudent = age => ({
  dateOfBirth: dobForAge(age),
  ageVerificationStatus: 'verified'
});

assert.deepEqual(getTutorAssignmentDecision(verifiedStudent(17), 'student', today), {
  canRequest: false,
  reason: 'parent_required'
});
assert.equal(getTutorAssignmentDecision(verifiedStudent(17), 'parent', today).canRequest, true);

assert.equal(getStudentAge(dobForAge(18), today).age, 18);
assert.equal(getTutorAssignmentDecision(verifiedStudent(18), 'student', today).canRequest, false);
assert.equal(getTutorAssignmentDecision(verifiedStudent(18), 'parent', today).canRequest, true);

assert.equal(getStudentAge(dobForAge(19), today).age, 19);
assert.equal(getTutorAssignmentDecision(verifiedStudent(19), 'student', today).canRequest, true);
assert.deepEqual(getTutorAssignmentDecision(verifiedStudent(19), 'parent', today), {
  canRequest: false,
  reason: 'adult_student_must_request_independently'
});

assert.deepEqual(getStudentAge(null, today), { age: null, reason: 'dob_missing' });
assert.deepEqual(getStudentAge('not-a-date', today), { age: null, reason: 'dob_invalid' });
assert.deepEqual(getStudentAge('2026-02-30', today), { age: null, reason: 'dob_invalid' });
assert.deepEqual(getStudentAge('2027-01-01', today), { age: null, reason: 'dob_invalid' });

const beforeBirthday = new Date('2026-10-21T12:00:00.000Z');
assert.equal(getStudentAge('2007-10-22', beforeBirthday).age, 18);
assert.equal(getStudentAge('2007-10-21', beforeBirthday).age, 19);
const eighteenthBirthdayDob = '2008-10-22';
const dayBeforeEighteenthBirthday = new Date('2026-10-21T12:00:00.000Z');
const eighteenthBirthday = new Date('2026-10-22T12:00:00.000Z');
const nineteenthBirthday = new Date('2027-10-22T12:00:00.000Z');
const birthdayStudent = {
  ageVerificationStatus: 'verified',
  dateOfBirth: eighteenthBirthdayDob
};
assert.equal(getStudentAge(eighteenthBirthdayDob, dayBeforeEighteenthBirthday).age, 17);
assert.equal(getStudentAge(eighteenthBirthdayDob, eighteenthBirthday).age, 18);
assert.equal(getTutorAssignmentDecision(birthdayStudent, 'student', eighteenthBirthday).reason, 'parent_required');
assert.equal(getTutorAssignmentDecision(birthdayStudent, 'parent', eighteenthBirthday).canRequest, true);
assert.equal(getTutorAssignmentDecision(birthdayStudent, 'student', nineteenthBirthday).canRequest, true);

const verifiedAdult = {
  dateOfBirth: '2000-01-01',
  ageVerificationStatus: 'verified'
};
assert.equal(getTutorAssignmentDecision(verifiedAdult, 'student', today).canRequest, true);
assert.equal(getTutorAssignmentDecision(verifiedAdult, 'parent', today).reason,
  'adult_student_must_request_independently');

const editableAdultDobWithoutVerification = {
  dateOfBirth: '2000-01-01',
  ageVerificationStatus: 'pending'
};
assert.equal(getTutorAssignmentDecision(editableAdultDobWithoutVerification, 'student', today).reason,
  'age_verification_pending');
assert.equal(getTutorAssignmentDecision(editableAdultDobWithoutVerification, 'parent', today).canRequest, false);

for (const [status, expectedReason] of [
  ['unverified', 'age_unverified'],
  ['pending', 'age_verification_pending'],
  ['rejected', 'age_verification_rejected']
]) {
  assert.deepEqual(getTutorAssignmentDecision({
    dateOfBirth: '2000-01-01',
    ageVerificationStatus: status
  }, 'student', today), { canRequest: false, reason: expectedReason });
  assert.deepEqual(getTutorAssignmentDecision({
    dateOfBirth: '2008-01-01',
    ageVerificationStatus: status
  }, 'parent', today), { canRequest: false, reason: expectedReason });
}

assert.deepEqual(getTutorAssignmentDecision({
  ageVerificationStatus: 'verified',
  dateOfBirth: null
}, 'student', today), { canRequest: false, reason: 'dob_missing' });
assert.deepEqual(getTutorAssignmentDecision({
  ageVerificationStatus: 'verified',
  dateOfBirth: 'not-a-date'
}, 'student', today), { canRequest: false, reason: 'dob_invalid' });

console.log('Tutor assignment age eligibility tests passed.');
