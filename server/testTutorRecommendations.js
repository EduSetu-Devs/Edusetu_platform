const test = require('node:test');
const assert = require('node:assert/strict');
const models = require('./src/models');
const { getRecommendedTutors } = require('./src/controllers/tutorDiscoveryController');
const { scoreTutorRecommendations } = require('./src/utils/tutorRecommendationScoring');

const makeResponse = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

const eligibleStudent = (id = 5) => ({
  id,
  className: 'Class 10',
  ageVerificationStatus: 'verified',
  dateOfBirth: '2000-01-01'
});

const tutor = {
  id: 20,
  user: { name: 'Teacher One', profileImage: null },
  headline: 'Math tutor',
  experienceYears: 5,
  hourlyRate: '500',
  rating: '4.5',
  reviewsCount: 8,
  verificationStatus: 'verified',
  subjects: [{ subjectName: 'Mathematics', gradeLevels: ['10'], hourlyRate: '450' }],
  languages: ['Hindi'],
  availabilities: [{ isSlotActive: true, dayOfWeek: 'monday' }]
};

test('recommendation scoring ranks actual preference matches and explains them', () => {
  const [matched, other] = scoreTutorRecommendations(
    [
      tutor,
      { ...tutor, id: 21, hourlyRate: '700', subjects: [], languages: [], availabilities: [], verificationStatus: 'pending', rating: '0', reviewsCount: 0 }
    ],
    { subject: 'Mathematics', budget: 500, language: 'Hindi', availability: 'monday' },
    'Class 10'
  );

  assert.equal(matched.id, 20);
  assert.deepEqual(matched.matchingReasons, [
    'Matches your Mathematics subject',
    'Supports Class 10',
    'Within your budget',
    'Speaks Hindi',
    'Available on monday',
    'Verified teacher profile',
    'Rated 4.5 by students'
  ]);
  assert.deepEqual(other.matchingReasons, []);
});

test('recommendations use only the authenticated eligible student profile', async t => {
  t.mock.method(models.StudentProfile, 'findOne', async ({ where }) => {
    assert.deepEqual(where, { userId: 11 });
    return eligibleStudent();
  });
  t.mock.method(models.TutorProfile, 'findAll', async () => [{
    get: () => tutor
  }]);

  const res = makeResponse();
  await getRecommendedTutors({
    user: { id: 11, role: 'student' },
    query: { subject: 'Mathematics', budget: '500', language: 'Hindi', availability: 'monday' }
  }, res, error => { throw error; });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.recommendations[0].id, 20);
  assert.ok(res.body.data.recommendations[0].matchingReasons.includes('Supports Class 10'));
});

test('recommendations reject students whose age-based assignment eligibility is not met', async t => {
  t.mock.method(models.StudentProfile, 'findOne', async () => ({
    ...eligibleStudent(),
    dateOfBirth: '2010-01-01'
  }));
  const findTutors = t.mock.method(models.TutorProfile, 'findAll', async () => []);

  const res = makeResponse();
  await getRecommendedTutors({ user: { id: 11, role: 'student' }, query: {} }, res, error => { throw error; });

  assert.equal(res.statusCode, 403);
  assert.equal(findTutors.mock.callCount(), 0);
});

test('parent recommendations are limited to their linked eligible child', async t => {
  t.mock.method(models.ParentProfile, 'findOne', async () => ({ id: 3 }));
  t.mock.method(models.ParentStudent, 'findAll', async ({ where }) => {
    assert.deepEqual(where, { parentProfileId: 3, studentProfileId: 5 });
    return [{
      studentProfile: {
        ...eligibleStudent(5),
        dateOfBirth: '2010-01-01'
      }
    }];
  });
  t.mock.method(models.TutorProfile, 'findAll', async () => [{ get: () => tutor }]);

  const res = makeResponse();
  await getRecommendedTutors({
    user: { id: 12, role: 'parent' },
    query: { studentProfileId: '5', subject: 'Mathematics' }
  }, res, error => { throw error; });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.recommendations[0].id, 20);
});

test('parent cannot receive recommendations for an unlinked child', async t => {
  t.mock.method(models.ParentProfile, 'findOne', async () => ({ id: 3 }));
  t.mock.method(models.ParentStudent, 'findAll', async () => []);
  const findTutors = t.mock.method(models.TutorProfile, 'findAll', async () => []);

  const res = makeResponse();
  await getRecommendedTutors({
    user: { id: 12, role: 'parent' },
    query: { studentProfileId: '99' }
  }, res, error => { throw error; });

  assert.equal(res.statusCode, 403);
  assert.equal(findTutors.mock.callCount(), 0);
});
