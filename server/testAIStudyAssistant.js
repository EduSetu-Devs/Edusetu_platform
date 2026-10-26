const test = require('node:test');
const assert = require('node:assert/strict');
const { AIChatHistory } = require('./src/models');
const { askDoubt } = require('./src/controllers/aiController');

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

test('study assistant rejects empty and oversized questions', async () => {
  for (const question of ['', '   ', 'a'.repeat(2001)]) {
    const res = makeResponse();
    await askDoubt({ body: { question }, user: { id: 10 } }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
  }
});

test('study assistant reports missing LLM configuration without returning a mock answer', async (t) => {
  const originalProvider = process.env.AI_PROVIDER;
  const originalKey = process.env.AI_API_KEY;
  t.after(() => {
    if (originalProvider === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = originalProvider;
    if (originalKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = originalKey;
  });
  process.env.AI_PROVIDER = 'mock';
  delete process.env.AI_API_KEY;

  const res = makeResponse();
  await askDoubt({ body: { question: 'What is photosynthesis?' }, user: { id: 10 } }, res);
  assert.equal(res.statusCode, 503);
  assert.match(res.body.message, /not configured/);
});

test('study assistant returns and persists a configured LLM answer', async (t) => {
  const originalProvider = process.env.AI_PROVIDER;
  const originalKey = process.env.AI_API_KEY;
  const originalModel = process.env.AI_MODEL;
  t.after(() => {
    if (originalProvider === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = originalProvider;
    if (originalKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.AI_MODEL;
    else process.env.AI_MODEL = originalModel;
  });
  process.env.AI_PROVIDER = 'openai';
  process.env.AI_API_KEY = 'test-key';
  process.env.AI_MODEL = 'test-model';

  const answer = {
    explanation: 'Plants use sunlight to make food.',
    steps: ['Leaves take in light.', 'The plant uses light to make sugar.'],
    summary: 'Photosynthesis is how plants make food using light.'
  };
  t.mock.method(global, 'fetch', async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.model, 'test-model');
    assert.match(request.messages[1].content, /simple Hindi or English/);
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(answer) } }] })
    };
  });
  t.mock.method(AIChatHistory, 'create', async (record) => record);

  const res = makeResponse();
  await askDoubt({ body: { question: 'What is photosynthesis?' }, user: { id: 10 } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.data, answer);
  assert.equal(AIChatHistory.create.mock.calls.length, 1);
  assert.equal(AIChatHistory.create.mock.calls[0].arguments[0].userId, 10);
});

test('study assistant logs provider status and safe error codes without response secrets', async (t) => {
  const originalProvider = process.env.AI_PROVIDER;
  const originalKey = process.env.AI_API_KEY;
  t.after(() => {
    if (originalProvider === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = originalProvider;
    if (originalKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = originalKey;
  });
  process.env.AI_PROVIDER = 'openai';
  process.env.AI_API_KEY = 'test-secret';

  t.mock.method(global, 'fetch', async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: { code: 'invalid_api_key', type: 'authentication_error', message: 'rejected test-secret' } })
  }));
  const log = t.mock.method(console, 'error', () => {});
  const res = makeResponse();
  await askDoubt({ body: { question: 'What is photosynthesis?' }, user: { id: 10 } }, res);

  assert.equal(res.statusCode, 503);
  assert.deepEqual(log.mock.calls[0].arguments[1], {
    status: 401,
    providerCode: 'invalid_api_key',
    providerType: 'authentication_error'
  });
  assert.doesNotMatch(JSON.stringify(log.mock.calls), /test-secret|rejected/);
});
