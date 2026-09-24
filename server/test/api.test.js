import { test, before, after } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

process.env.NODE_ENV = 'test';
process.env.PORT = '3939';
process.env.DB_TYPE = 'sqlite';
process.env.SQLITE_PATH = path.join(os.tmpdir(), 'multra-api-test-' + Date.now() + '.db');
process.env.JWT_SECRET = 'a'.repeat(64);
process.env.ADMIN_USER = 'apitest_admin';
process.env.ADMIN_PASS = 'ApiTest2026Pass';
process.env.CORS_ORIGINS = '*';

const { createDatabase } = await import('../src/db/connection.js');
const { initDatabase } = await import('../src/db/migrations.js');
const { buildContainer } = await import('../src/container.js');
const { createApp } = await import('../src/app.js');

let server;
let baseUrl;

before(async () => {
  const db = await createDatabase();
  await initDatabase(db);
  const { controllers } = buildContainer(db);
  const app = createApp(controllers);
  await new Promise((resolve) => {
    server = app.listen(parseInt(process.env.PORT, 10), '127.0.0.1', () => resolve());
  });
  baseUrl = `http://127.0.0.1:${process.env.PORT}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  try {
    fs.rmSync(process.env.SQLITE_PATH, { force: true });
    fs.rmSync(process.env.SQLITE_PATH + '-wal', { force: true });
    fs.rmSync(process.env.SQLITE_PATH + '-shm', { force: true });
  } catch {}
});

const json = async (res) => {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
};

test('API: GET /api/health', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const body = await json(res);
  assert.equal(body.ok, true);
  assert.equal(body.service, 'multra-eu-backend');
});

test('API: GET /api/servicios returns array', async () => {
  const res = await fetch(`${baseUrl}/api/servicios`);
  assert.equal(res.status, 200);
  const body = await json(res);
  assert.ok(Array.isArray(body));
  assert.ok(body.length >= 1);
});

test('API: POST /api/auth/login returns token for admin', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'apitest_admin', password: 'ApiTest2026Pass' }),
  });
  assert.equal(res.status, 200);
  const body = await json(res);
  assert.ok(body.token);
  assert.ok(body.user);
  assert.equal(body.user.username, 'apitest_admin');
});

test('API: POST /api/auth/login fails with bad password', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'apitest_admin', password: 'wrongpass123' }),
  });
  assert.equal(res.status, 401);
});

test('API: GET /api/clientes without auth returns 401', async () => {
  const res = await fetch(`${baseUrl}/api/clientes`);
  assert.equal(res.status, 401);
});

test('API: full flow (login → create cliente → list)', async () => {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'apitest_admin', password: 'ApiTest2026Pass' }),
  });
  const { token } = await json(loginRes);

  const createRes = await fetch(`${baseUrl}/api/clientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      nombre: 'API E2E Test',
      cedula: '9999999',
      telefono: '3001112233',
      email: 'e2e@example.com',
      direccion: 'Test 123',
    }),
  });
  assert.equal(createRes.status, 201);
  const created = await json(createRes);
  assert.equal(created.nombre, 'API E2E Test');
  assert.ok(created.id);

  const listRes = await fetch(`${baseUrl}/api/clientes`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  assert.equal(listRes.status, 200);
  const list = await json(listRes);
  assert.ok(Array.isArray(list));
  assert.ok(list.some(c => c.id === created.id));
});