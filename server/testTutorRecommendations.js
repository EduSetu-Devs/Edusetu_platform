const test = require('node:test');
const assert = require('node:assert/strict');
const models = require('./src/models');
const { getRecommendedTutors } = require('./src/controllers/tutorDiscoveryController');
const { scoreTutorRecommendations } = require('./src/utils/tutorRecommendationScoring');

const tutor = {
  id: 20,
  city: 'Kota',
  area: 'Talwandi',
  headline: 'Experienced Teacher',
  hourlyRate: 500,
  rating: 4.8,
  reviewsCount: 10,
  verificationStatus: 'verified',
  teachingMode: 'both',
  user: { name: 'Sunita' },
  subjects: [{ subjectName: 'Mathematics', gradeLevels: ['Class 10', 'Class 11'] }],
  availabilities: [{ isSlotActive: true, dayOfWeek: 'monday' }],
  languages: ['English', 'Hindi']
};

const tutorBengaluru = {
  id: 21,
  city: 'Bengaluru',
  area: 'Indiranagar',
  headline: 'Coding Expert',
  hourlyRate: 800,
  rating: 4.9,
  reviewsCount: 20,
  verificationStatus: 'verified',
  teachingMode: 'both',
  user: { name: 'Rahul' },
  subjects: [{ subjectName: 'Computer Science', gradeLevels: ['Class 11', 'Class 12'] }],
  availabilities: [{ isSlotActive: true, dayOfWeek: 'monday' }],
  languages: ['English']
};

const tutorKotaCommerce = {
  id: 22,
  city: 'Kota',
  area: 'Vigyan Nagar',
  headline: 'Commerce Specialist',
  hourlyRate: 450,
  rating: 4.7,
  reviewsCount: 8,
  verificationStatus: 'verified',
  teachingMode: 'both',
  user: { name: 'Rajesh' },
  subjects: [{ subjectName: 'Accountancy', gradeLevels: ['Class 11', 'Class 12'] }],
  availabilities: [{ isSlotActive: true, dayOfWeek: 'monday' }],
  languages: ['Hindi']
};

const eligibleStudent = (id = 1) => ({
  id,
  className: 'Class 10',
  dateOfBirth: '2005-01-01',
  ageVerificationStatus: 'verified'
});

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

test('recommendation scoring ranks actual preference matches, location and explains them', () => {
  const ranked = scoreTutorRecommendations([tutor], {
    subject: 'Mathematics',
    city: 'Kota',
    area: 'Talwandi',
    budget: 600,
    language: 'English',
    availability: 'monday'
  }, 'Class 10');

  assert.equal(ranked[0].id, 20);
  assert.ok(ranked[0].score >= 80);
  assert.ok(ranked[0].matchingReasons.includes('Matches your Mathematics subject'));
  assert.ok(ranked[0].matchingReasons.includes('Located in Kota'));
  assert.ok(ranked[0].matchingReasons.includes('In your locality (Talwandi)'));
});

test('scoreTutorRecommendations strictly excludes tutors outside the searched city', () => {
  const candidates = [tutor, tutorBengaluru];
  const ranked = scoreTutorRecommendations(candidates, { city: 'Kota' });

  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].id, 20);
  assert.equal(ranked[0].city, 'Kota');
});

test('scoreTutorRecommendations strictly excludes tutors who do not teach the searched subject', () => {
  const candidates = [tutor, tutorKotaCommerce];
  const ranked = scoreTutorRecommendations(candidates, { subject: 'Maths' });

  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].id, 20);
  assert.ok(ranked[0].subjects.includes('Mathematics'));
});

test('scoreTutorRecommendations strictly enforces both city and subject together', () => {
  const candidates = [tutor, tutorBengaluru, tutorKotaCommerce];
  const ranked = scoreTutorRecommendations(candidates, { city: 'Kota', subject: 'Maths' });

  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].id, 20);
});

test('scoreTutorRecommendations prioritizes exact area matches within a city', () => {
  const candidates = [tutorKotaCommerce, tutor]; // tutor is in Talwandi, tutorKotaCommerce is in Vigyan Nagar
  const ranked = scoreTutorRecommendations(candidates, { city: 'Kota', area: 'Talwandi' });

  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].id, 20); // Talwandi tutor must rank first
  assert.equal(ranked[1].id, 22);
});

test('recommendations use authenticated student profile and return recommendations', async t => {
  t.mock.method(models.StudentProfile, 'findOne', async () => eligibleStudent());
  t.mock.method(models.TutorProfile, 'findAll', async () => [{ get: () => tutor }]);

  const res = makeResponse();
  await getRecommendedTutors({ user: { id: 10, role: 'student' }, query: { subject: 'Mathematics' } }, res, error => { throw error; });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.recommendations[0].id, 20);
  assert.ok(res.body.data.recommendations[0].matchingReasons.includes('Supports Class 10'));
});

test('recommendations allow browsing for students without blocking age errors', async t => {
  t.mock.method(models.StudentProfile, 'findOne', async () => ({
    ...eligibleStudent(),
    dateOfBirth: '2010-01-01'
  }));
  t.mock.method(models.TutorProfile, 'findAll', async () => [{ get: () => tutor }]);

  const res = makeResponse();
  await getRecommendedTutors({ user: { id: 11, role: 'student' }, query: {} }, res, error => { throw error; });

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.data.recommendations.length >= 1);
});

test('parent recommendations are limited to their linked child', async t => {
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
