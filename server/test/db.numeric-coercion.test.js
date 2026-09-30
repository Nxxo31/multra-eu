import { test } from 'node:test';
import { strict as assert } from 'node:assert';

const { SCHEMA_NUMERIC_COLS, buildNumericAliases, mapRowKeys } = await import('../src/db/connection.js');

test('SCHEMA_NUMERIC_COLS incluye columnas NUMERIC del schema postgres', () => {
  assert.ok(SCHEMA_NUMERIC_COLS.has('precio'));
  assert.ok(SCHEMA_NUMERIC_COLS.has('prima'));
  assert.ok(SCHEMA_NUMERIC_COLS.has('monto'));
  assert.ok(!SCHEMA_NUMERIC_COLS.has('nombre'));
});

test('mapRowKeys coerciona columnas NUMERIC de string a number', () => {
  const row = { precio: '327700.00', nombre: 'RTM', aplicA: undefined };
  const out = mapRowKeys(row, new Map(), SCHEMA_NUMERIC_COLS);
  assert.strictEqual(out.precio, 327700);
  assert.strictEqual(out.nombre, 'RTM');
});

test('mapRowKeys coerciona alias calificado (s.precio AS servicioPrecio)', () => {
  const sql = 'SELECT c.id, s.nombre AS servicioNombre, s.precio AS servicioPrecio FROM citas c JOIN servicios s ON s.id = c.servicioId';
  const keys = new Set([...SCHEMA_NUMERIC_COLS, ...buildNumericAliases(sql, SCHEMA_NUMERIC_COLS)]);
  const qm = new Map([['servicionombre', 'servicioNombre'], ['servicioprecio', 'servicioPrecio']]);
  const out = mapRowKeys({ servicionombre: 'RTM Livianos', servicioprecio: '327700.00' }, qm, keys);
  assert.strictEqual(out.servicioPrecio, 327700);
  assert.strictEqual(out.servicioNombre, 'RTM Livianos');
});

test('mapRowKeys coerciona agregados (COUNT(*) AS c, SUM(monto) AS total)', () => {
  const sql = 'SELECT COUNT(*) AS c, SUM(monto) AS total FROM pagos';
  const keys = new Set([...SCHEMA_NUMERIC_COLS, ...buildNumericAliases(sql, SCHEMA_NUMERIC_COLS)]);
  const out = mapRowKeys({ c: '20', total: '445000.00' }, new Map(), keys);
  assert.strictEqual(out.c, 20);
  assert.strictEqual(out.total, 445000);
});

test('mapRowKeys no toca strings no numéricos en columnas NUMERIC', () => {
  const out = mapRowKeys({ precio: 'consultar' }, new Map(), SCHEMA_NUMERIC_COLS);
  assert.strictEqual(out.precio, 'consultar');
});
