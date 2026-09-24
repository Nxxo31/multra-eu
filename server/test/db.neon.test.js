import { test, after } from 'node:test';
import { strict as assert } from 'node:assert';

const DATABASE_URL = process.env.DATABASE_URL;
const HAS_NEON = !!DATABASE_URL && DATABASE_URL.startsWith('postgres');

if (HAS_NEON) {
  process.env.DB_TYPE = 'postgres';
  process.env.JWT_SECRET = 'a'.repeat(64);
}

const { NeonAdapter } = await import('../src/db/connection.js');
const { runMigrations, runSeed } = await import('../src/db/migrations.js');
const { ClienteRepository } = await import('../src/repositories/cliente.repository.js');
const { VehiculoRepository } = await import('../src/repositories/vehiculo.repository.js');
const { CitaRepository } = await import('../src/repositories/cita.repository.js');

if (!HAS_NEON) {
  test('Neon adapter: SKIPPED (no DATABASE_URL)', { skip: true }, () => {});
}

let db;
let lastInsertedClienteId = 0;
let initPromise = null;

const cleanupSchema = async () => {
  if (!db) return;
  await db.execute('DROP TABLE IF EXISTS inspections CASCADE');
  await db.execute('DROP TABLE IF EXISTS recordatorios CASCADE');
  await db.execute('DROP TABLE IF EXISTS pagos CASCADE');
  await db.execute('DROP TABLE IF EXISTS tramites CASCADE');
  await db.execute('DROP TABLE IF EXISTS citas CASCADE');
  await db.execute('DROP TABLE IF EXISTS polizas CASCADE');
  await db.execute('DROP TABLE IF EXISTS vehiculos CASCADE');
  await db.execute('DROP TABLE IF EXISTS clientes CASCADE');
  await db.execute('DROP TABLE IF EXISTS servicios CASCADE');
  await db.execute('DROP TABLE IF EXISTS users CASCADE');
};

const ensureInit = () => {
  if (!initPromise) {
    initPromise = (async () => {
      db = new NeonAdapter(DATABASE_URL);
      await db.initPromise;
      await cleanupSchema();
      await runMigrations(db);
      await runSeed(db);
      return db;
    })();
  }
  return initPromise;
};

// Top-level await for setup: ensures db is ready BEFORE any test runs.
if (HAS_NEON) {
  await ensureInit();
}

after(async () => {
  if (!HAS_NEON) return;
  await cleanupSchema();
  await db.close();
});

if (HAS_NEON) {
  test('Neon adapter: query returns rows array (not fullResults shape)', async () => {
    const rows = await db.query('SELECT id, username FROM users ORDER BY id ASC LIMIT 5');
    assert.ok(Array.isArray(rows));
    assert.ok(rows.length >= 1);
    assert.equal(typeof rows[0].username, 'string');
  });

  test('Neon adapter: getOne returns first row or null', async () => {
    const row = await db.getOne('SELECT username FROM users ORDER BY id ASC LIMIT 1');
    assert.ok(row);
    const none = await db.getOne('SELECT username FROM users WHERE id = ?', [999999]);
    assert.equal(none, null);
  });

  test('Neon adapter: execute INSERT returns insertId via RETURNING id', async () => {
    const r = await db.execute(
      'INSERT INTO clientes (nombre, cedula, telefono, email, direccion, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      ['Neon Test', 'NT' + Date.now(), null, null, null, new Date().toISOString().slice(0, 19).replace('T', ' ')]
    );
    assert.equal(typeof r.insertId, 'number');
    assert.ok(r.insertId > 0);
    assert.equal(r.changes, 1);
    lastInsertedClienteId = r.insertId;
  });

  test('Neon adapter: execute UPDATE returns changes count', async () => {
    await ensureInit();
    if (!lastInsertedClienteId) {
      const ins = await db.execute(
        'INSERT INTO clientes (nombre, cedula, telefono, email, direccion, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        ['For Update', 'UPD' + Date.now(), null, null, null, new Date().toISOString().slice(0, 19).replace('T', ' ')]
      );
      lastInsertedClienteId = ins.insertId;
    }
    const r = await db.execute('UPDATE clientes SET telefono = ? WHERE id = ?', ['3001112222', lastInsertedClienteId]);
    assert.ok(r.changes >= 1);
  });

  test('Neon adapter: repos create + read end-to-end (cliente → vehiculo → cita)', async () => {
    const clienteRepo = new ClienteRepository(db);
    const vehiculoRepo = new VehiculoRepository(db);
    const citaRepo = new CitaRepository(db);

    const cli = await clienteRepo.create({
      nombre: 'Neon E2E',
      cedula: 'NTE2E' + Date.now(),
      telefono: null,
      email: null,
      direccion: null,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });
    assert.ok(cli.id > 0);

    const v = await vehiculoRepo.create({
      clienteId: cli.id,
      placa: 'NEON' + Date.now().toString().slice(-6),
      marca: 'NeonMotors',
      linea: 'Test',
      modelo: 2026,
      color: 'Azul',
      clase: 'sedan',
      tipoVehiculo: 'liviano',
      cilindraje: 1500,
      combustible: 'electrico',
      kilometraje: 0,
      soatVence: null,
      tecnomecanicaVence: null,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });
    assert.ok(v.id > 0);

    const c = await citaRepo.create({
      vehiculoId: v.id,
      clienteId: cli.id,
      servicioId: 'tecno_liviano',
      fecha: '2026-12-01',
      hora: '09:00',
      estado: 'agendada',
      tecnico: 'Por asignar',
      obs: '',
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });
    assert.ok(c.id > 0);

    const fetched = await citaRepo.findById(c.id);
    assert.equal(fetched.id, c.id);
    assert.equal(fetched.estado, 'agendada');

    const updated = await citaRepo.update(c.id, { estado: 'completada', obs: 'neon ok' });
    assert.equal(updated.estado, 'completada');
    assert.equal(updated.obs, 'neon ok');
  });

  test('Neon adapter: count(*) query returns row with c column', async () => {
    const row = await db.getOne('SELECT COUNT(*)::int AS c FROM clientes');
    assert.ok(row);
    assert.equal(typeof row.c, 'number');
    assert.ok(row.c >= 0);
  });

  test('Neon adapter: unique constraint violation throws (cedula UNIQUE)', async () => {
    const dupCedula = 'DUP' + Date.now();
    await db.execute(
      'INSERT INTO clientes (nombre, cedula, telefono, email, direccion, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      ['First', dupCedula, null, null, null, new Date().toISOString().slice(0, 19).replace('T', ' ')]
    );
    await assert.rejects(
      db.execute(
        'INSERT INTO clientes (nombre, cedula, telefono, email, direccion, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        ['Second', dupCedula, null, null, null, new Date().toISOString().slice(0, 19).replace('T', ' ')]
      ),
      /unique|duplicate|23505/i
    );
  });
}