process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.JWT_SECRET = 'test-jwt-secret-value-that-is-long-enough-123456';
process.env.OTP_HASH_SECRET = 'test-otp-secret-value-that-is-long-enough-123456';
process.env.ADMIN_VERIFICATION_PASSWORD = 'test-admin-password-123456';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.AUTH_EXPOSE_TOKEN = 'true';

const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

require('./src/models');
const { connectDB } = require('./src/config/db');
const app = require('./src/app');

before(async () => {
  await connectDB();
});

test('integration: health live returns 200', async () => {
  const res = await request(app).get('/api/health/live');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'alive');
});

test('integration: health ready returns 200 when DB is connected', async () => {
  const res = await request(app).get('/api/health/ready');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ready');
});

test('integration: health returns 200', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
});

test('integration: invalid login returns a 4xx, not 5xx', async () => {
  const res = await request(app).post('/api/auth/login').send({
    email: 'nobody@example.com',
    password: 'wrong-password'
  });
  assert.ok(res.status >= 400 && res.status < 500, `expected 4xx, got ${res.status}: ${JSON.stringify(res.body)}`);
});

test('integration: CSRF token endpoint returns 200', async () => {
  const res = await request(app).get('/api/auth/csrf');
  assert.equal(res.status, 200);
  assert.ok(res.body && res.body.success !== false);
});

test('integration: /auth/me without token returns 401', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.equal(res.status, 401);
});

test('integration: account export without auth returns 401', async () => {
  const res = await request(app).get('/api/account/export');
  assert.equal(res.status, 401);
});

test('integration: send-otp with invalid payload returns 4xx', async () => {
  const res = await request(app).post('/api/auth/send-otp').send({ email: 'not-an-email' });
  assert.ok(res.status >= 400 && res.status < 500, `expected 4xx, got ${res.status}`);
});

test('integration: AI study plan unauthenticated returns 401', async () => {
  const res = await request(app).post('/api/student/ai/study-plan').send({ subject: 'Math', topic: 'Algebra', availableDays: 3 });
  assert.equal(res.status, 401);
});

test('integration: admin users endpoint requires auth', async () => {
  const res = await request(app).get('/api/admin/users');
  assert.equal(res.status, 401);
});

test('integration: paid course enrollment returns 402', async () => {
  const { Course } = require('./src/models');
  const course = await Course.create({ title: 'Paid Course', subject: 'Math', gradeLevel: 'Class 10', price: 999 });

  const email = `paidstudent${Date.now()}@example.com`;
  const regRes = await request(app).post('/api/auth/register').send({
    name: 'Paid Student', email, password: 'password123', role: 'student'
  });
  assert.ok(regRes.status >= 200 && regRes.status < 300, `register failed: ${regRes.status}`);

  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
  assert.equal(loginRes.status, 200);
  const token = loginRes.body?.data?.token;
  assert.ok(token, 'login did not return a token');

  const res = await request(app)
    .post(`/api/courses/${course.id}/enroll`)
    .set('Authorization', `Bearer ${token}`)
    .send({});
  assert.equal(res.status, 402);
});