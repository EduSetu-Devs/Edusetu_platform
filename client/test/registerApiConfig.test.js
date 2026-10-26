import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const clientDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDirectory = path.resolve(clientDirectory, '..');

test('registration API base URL points to the configured backend', () => {
  const clientEnv = loadEnv('development', clientDirectory, 'VITE_');
  const serverEnv = readFileSync(path.join(repositoryDirectory, 'server', '.env'), 'utf8');
  const backendPort = serverEnv.match(/^PORT=(.+)$/m)?.[1] || '5000';
  const apiUrl = new URL(clientEnv.VITE_API_BASE_URL);

  assert.equal(apiUrl.port || (apiUrl.protocol === 'https:' ? '443' : '80'), backendPort);
  assert.equal(apiUrl.pathname.replace(/\/$/, ''), '/api');
});
