import bcrypt from 'bcryptjs';
import { SCHEMA_SQL } from './schema.js';
import { SCHEMA_POSTGRES_SQL } from './schema.postgres.js';
import {
  SERVICIOS_SEED,
  buildClientesSeed,
  buildVehiculosSeed,
  buildPolizasSeed,
  buildCitasSeed,
  buildTramitesSeed,
  buildPagosSeed,
} from './seed-data.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const dateOffset = (baseDate) => (n) => {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const splitSqlStatements = (raw) => {
  const stripped = raw
    .split('\n')
    .map(line => line.replace(/--.*$/, ''))
    .join('\n');
  return stripped
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
};

export const runMigrations = async (db) => {
  const sql = env.DB_TYPE === 'postgres' ? SCHEMA_POSTGRES_SQL : SCHEMA_SQL;
  const statements = splitSqlStatements(sql);

  for (const stmt of statements) {
    await db.execute(stmt);
  }
  logger.info({ driver: env.DB_TYPE, statements: statements.length }, 'Esquema aplicado');
};

export const runSeed = async (db) => {
  const nowSql = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const d = dateOffset(new Date());
  const isEmpty = async (sql) => {
    const r = await db.getOne(sql);
    if (!r) return true;
    const n = Number(r.c);
    return !Number.isFinite(n) || n === 0;
  };

  if (await isEmpty('SELECT COUNT(*) AS c FROM servicios')) {
    for (const s of SERVICIOS_SEED) {
      await db.execute(
        'INSERT INTO servicios (id,nombre,tipo,descripcion,precio,duracionMin,aplica,fuente) VALUES (?,?,?,?,?,?,?,?)',
        [s.id, s.nombre, s.tipo, s.descripcion, s.precio, s.duracionMin, s.aplica, s.fuente]
      );
    }
    logger.info({ count: SERVICIOS_SEED.length }, 'Servicios sembrados');
  }

  if (await isEmpty('SELECT COUNT(*) AS c FROM users')) {
    const hash = bcrypt.hashSync(env.ADMIN_PASS, env.BCRYPT_ROUNDS);
    await db.execute(
      'INSERT INTO users (username,passwordHash,role,name,email,createdAt) VALUES (?,?,?,?,?,?)',
      [env.ADMIN_USER, hash, 'admin', env.ADMIN_USER, 'admin@multra.com.co', nowSql]
    );
    logger.info({ user: env.ADMIN_USER }, 'Usuario admin creado');
  }

  if (process.env.MULTRA_SEED_DEMO !== '1') {
    logger.info('Seed demo desactivado (MULTRA_SEED_DEMO!=1). Solo servicios + admin sembrados.');
    return;
  }

  if (await isEmpty('SELECT COUNT(*) AS c FROM clientes')) {
    const clientes = buildClientesSeed(nowSql);
    for (const c of clientes) {
      await db.execute(
        'INSERT INTO clientes (nombre,cedula,telefono,email,direccion,createdAt) VALUES (?,?,?,?,?,?)',
        [c.nombre, c.cedula, c.telefono, c.email, c.direccion, c.createdAt]
      );
    }

    const vehiculos = buildVehiculosSeed(nowSql, d);
    for (const v of vehiculos) {
      await db.execute(
        `INSERT INTO vehiculos (clienteId,placa,marca,linea,modelo,color,clase,tipoVehiculo,cilindraje,combustible,kilometraje,soatVence,tecnomecanicaVence,createdAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [v.clienteId, v.placa, v.marca, v.linea, v.modelo, v.color, v.clase, v.tipoVehiculo, v.cilindraje, v.combustible, v.kilometraje, v.soatVence, v.tecnomecanicaVence, v.createdAt]
      );
    }

    const polizas = buildPolizasSeed(nowSql, d);
    for (const p of polizas) {
      await db.execute(
        'INSERT INTO polizas (vehiculoId,clienteId,tipo,aseguradora,numero,inicio,fin,prima,estado,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [p.vehiculoId, p.clienteId, p.tipo, p.aseguradora, p.numero, p.inicio, p.fin, p.prima, p.estado, p.createdAt]
      );
    }

    const citas = buildCitasSeed(nowSql, d);
    for (const c of citas) {
      await db.execute(
        'INSERT INTO citas (vehiculoId,clienteId,servicioId,fecha,hora,estado,tecnico,obs,createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
        [c.vehiculoId, c.clienteId, c.servicioId, c.fecha, c.hora, c.estado, c.tecnico, c.obs, c.createdAt]
      );
    }

    const tramites = buildTramitesSeed(nowSql, d);
    for (const t of tramites) {
      await db.execute(
        'INSERT INTO tramites (clienteId,vehiculoId,tipo,descripcion,documentos,gestor,estado,createdAt) VALUES (?,?,?,?,?,?,?,?)',
        [t.clienteId, t.vehiculoId, t.tipo, t.descripcion, t.documentos, t.gestor, t.estado, t.createdAt]
      );
    }

    const pagos = buildPagosSeed(nowSql, d);
    for (const p of pagos) {
      await db.execute(
        'INSERT INTO pagos (polizaId,clienteId,monto,metodo,ref,fecha,estado) VALUES (?,?,?,?,?,?,?)',
        [p.polizaId, p.clienteId, p.monto, p.metodo, p.ref, p.fecha, p.estado]
      );
    }

    logger.info('Datos demo sembrados (3 clientes, 3 vehículos, 3 pólizas, 2 citas, 1 trámite, 2 pagos)');
  }
};

export const initDatabase = async (db) => {
  await runMigrations(db);
  await runSeed(db);
};
