import { test, before, after } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SqliteAdapter } from '../src/db/connection.js';
import { runMigrations, runSeed } from '../src/db/migrations.js';
import { ClienteRepository } from '../src/repositories/cliente.repository.js';
import { VehiculoRepository } from '../src/repositories/vehiculo.repository.js';
import { CitaRepository } from '../src/repositories/cita.repository.js';

let db;
let tmpDir;

before(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'multra-test-'));
  db = new SqliteAdapter(path.join(tmpDir, 'test.db'));
  await runMigrations(db);
  await runSeed(db);
});

after(async () => {
  await db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('repos SQLite: clientes empty after seed (no MULTRA_SEED_DEMO)', async () => {
  const repo = new ClienteRepository(db);
  const list = await repo.findAll();
  assert.ok(Array.isArray(list));
  assert.equal(list.length, 0);
});

test('repos SQLite: insert cliente returns row with insertId', async () => {
  const repo = new ClienteRepository(db);
  const created = await repo.create({
    nombre: 'Juan Pérez',
    cedula: '1234567890',
    telefono: '3001234567',
    email: 'juan@example.com',
    direccion: 'Calle 1 #2-3',
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  });
  assert.ok(created);
  assert.equal(created.nombre, 'Juan Pérez');
  assert.equal(created.cedula, '1234567890');
  assert.ok(created.id > 0);
});

test('repos SQLite: search cliente by nombre', async () => {
  const repo = new ClienteRepository(db);
  const hits = await repo.search('juan');
  assert.ok(Array.isArray(hits));
  assert.ok(hits.length >= 1);
  assert.ok(hits[0].nombre.toLowerCase().includes('juan'));
});

test('repos SQLite: insert vehiculo referencing cliente', async () => {
  const clienteRepo = new ClienteRepository(db);
  const vehiculoRepo = new VehiculoRepository(db);
  const cli = await clienteRepo.create({
    nombre: 'Maria Lopez',
    cedula: '9876543210',
    telefono: '3009876543',
    email: null,
    direccion: null,
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  });
  const v = await vehiculoRepo.create({
    clienteId: cli.id,
    placa: 'ABC123',
    marca: 'Toyota',
    linea: 'Corolla',
    modelo: 2020,
    color: 'Blanco',
    clase: 'sedan',
    tipoVehiculo: 'liviano',
    cilindraje: 1800,
    combustible: 'gasolina',
    kilometraje: 50000,
    soatVence: '2026-12-31',
    tecnomecanicaVence: '2026-12-31',
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  });
  assert.ok(v);
  assert.ok(v.id > 0);
  assert.equal(v.placa, 'ABC123');
});

test('repos SQLite: cita create returns row with id', async () => {
  const clienteRepo = new ClienteRepository(db);
  const vehiculoRepo = new VehiculoRepository(db);
  const citaRepo = new CitaRepository(db);

  const cli = await clienteRepo.create({
    nombre: 'Pedro',
    cedula: '5555555',
    telefono: null,
    email: null,
    direccion: null,
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  });
  const v = await vehiculoRepo.create({
    clienteId: cli.id,
    placa: 'XYZ999',
    marca: 'Mazda',
    linea: '3',
    modelo: 2019,
    color: 'Rojo',
    clase: 'sedan',
    tipoVehiculo: 'liviano',
    cilindraje: 2000,
    combustible: 'gasolina',
    kilometraje: 30000,
    soatVence: null,
    tecnomecanicaVence: null,
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  });
  const c = await citaRepo.create({
    vehiculoId: v.id,
    clienteId: cli.id,
    servicioId: 'tecno_liviano',
    fecha: '2026-10-15',
    hora: '10:00',
    estado: 'agendada',
    tecnico: 'Por asignar',
    obs: '',
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  });
  assert.ok(c);
  assert.ok(c.id > 0);
  assert.equal(c.estado, 'agendada');
});

test('repos SQLite: dynamic update (cita.update builds SET)', async () => {
  const clienteRepo = new ClienteRepository(db);
  const vehiculoRepo = new VehiculoRepository(db);
  const citaRepo = new CitaRepository(db);

  const cli = await clienteRepo.create({
    nombre: 'Ana',
    cedula: '1111111',
    telefono: null,
    email: null,
    direccion: null,
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  });
  const v = await vehiculoRepo.create({
    clienteId: cli.id,
    placa: 'DEF456',
    marca: 'Renault',
    linea: 'Logan',
    modelo: 2021,
    color: 'Negro',
    clase: 'sedan',
    tipoVehiculo: 'liviano',
    cilindraje: 1600,
    combustible: 'gasolina',
    kilometraje: 10000,
    soatVence: null,
    tecnomecanicaVence: null,
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  });
  const c = await citaRepo.create({
    vehiculoId: v.id,
    clienteId: cli.id,
    servicioId: 'tecno_liviano',
    fecha: '2026-11-01',
    hora: '14:00',
    estado: 'agendada',
    tecnico: 'Por asignar',
    obs: '',
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  });

  const updated = await citaRepo.update(c.id, { estado: 'completada', obs: 'listo' });
  assert.equal(updated.estado, 'completada');
  assert.equal(updated.obs, 'listo');
});