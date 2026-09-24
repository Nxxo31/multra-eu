import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { SqliteAdapter } from '../src/db/connection.js';

const mkAdapter = () => new SqliteAdapter(':memory:');

test('SqliteAdapter: open + close', async () => {
  const db = mkAdapter();
  await db.close();
});

test('SqliteAdapter: query returns rows array', async () => {
  const db = mkAdapter();
  try {
    await db.execute('CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT)');
    await db.execute('INSERT INTO t (v) VALUES (?)', ['a']);
    await db.execute('INSERT INTO t (v) VALUES (?)', ['b']);
    const rows = await db.query('SELECT v FROM t ORDER BY id');
    assert.ok(Array.isArray(rows));
    assert.equal(rows.length, 2);
    assert.equal(rows[0].v, 'a');
    assert.equal(rows[1].v, 'b');
  } finally {
    await db.close();
  }
});

test('SqliteAdapter: getOne returns first row or null', async () => {
  const db = mkAdapter();
  try {
    await db.execute('CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT)');
    await db.execute('INSERT INTO t (v) VALUES (?)', ['x']);
    const row = await db.getOne('SELECT v FROM t WHERE id = ?', [1]);
    assert.ok(row);
    assert.equal(row.v, 'x');
    const none = await db.getOne('SELECT v FROM t WHERE id = ?', [999]);
    assert.equal(none, null);
  } finally {
    await db.close();
  }
});

test('SqliteAdapter: execute returns insertId + changes', async () => {
  const db = mkAdapter();
  try {
    await db.execute('CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT, v TEXT)');
    const r1 = await db.execute('INSERT INTO t (v) VALUES (?)', ['one']);
    assert.equal(typeof r1.insertId, 'number');
    assert.equal(r1.changes, 1);
    const r2 = await db.execute('INSERT INTO t (v) VALUES (?)', ['two']);
    assert.ok(r2.insertId > r1.insertId);
  } finally {
    await db.close();
  }
});

test('SqliteAdapter: positional ? placeholders', async () => {
  const db = mkAdapter();
  try {
    await db.execute('CREATE TABLE t (id INTEGER PRIMARY KEY, a TEXT, b INTEGER)');
    await db.execute('INSERT INTO t (a, b) VALUES (?, ?)', ['foo', 42]);
    const row = await db.getOne('SELECT a, b FROM t WHERE id = ?', [1]);
    assert.equal(row.a, 'foo');
    assert.equal(row.b, 42);
  } finally {
    await db.close();
  }
});

test('SqliteAdapter: transaction wrapper executes fn', async () => {
  const db = mkAdapter();
  try {
    await db.execute('CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT)');
    let receivedCtx;
    const result = await db.transaction(async (ctx) => {
      receivedCtx = ctx;
      await ctx.execute('INSERT INTO t (v) VALUES (?)', ['in-tx']);
      const rows = await ctx.query('SELECT COUNT(*) AS c FROM t');
      return rows[0].c;
    });
    assert.ok(receivedCtx);
    assert.equal(result, 1);
    const persisted = await db.getOne('SELECT v FROM t WHERE id = ?', [1]);
    assert.equal(persisted.v, 'in-tx');
  } finally {
    await db.close();
  }
});