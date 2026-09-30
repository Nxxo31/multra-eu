import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { SCHEMA_POSTGRES_SQL } from './schema.postgres.js';

// Postgres pliega identificadores no-quotados a lowercase. El schema y los
// repositorios usan camelCase (passwordHash, createdAt, ...), así que hay que
// mapear lowercase -> camelCase en los resultados para que el código lea bien.
const CAMEL_WORD = /\b(?=[A-Za-z]*[a-z])(?=[A-Za-z]*[A-Z])[A-Za-z]+\b/g;
const buildKeyMap = (text) => {
  const map = new Map();
  for (const m of text.matchAll(CAMEL_WORD)) {
    const w = m[0];
    map.set(w.toLowerCase(), w);
  }
  return map;
};
const SCHEMA_KEY_MAP = buildKeyMap(SCHEMA_POSTGRES_SQL);
const NUMERIC_COL_RE = /\b([A-Za-z][A-Za-z0-9]*)\s+NUMERIC(?:\s*\(\s*\d+\s*(?:,\s*\d+\s*)?\))?/gi;
const AGG_ALIAS_RE = /\b(?:count|sum|avg|min|max)\s*\([^)]*\)(?:::\s*\w+)?\s+(?:as\s+)?([A-Za-z_]\w*)/gi;
const NUMERIC_VALUE = /^-?\d+(\.\d+)?$/;
export const buildNumericCols = (text) => {
  const set = new Set();
  for (const m of text.matchAll(NUMERIC_COL_RE)) set.add(m[1].toLowerCase());
  return set;
};
export const SCHEMA_NUMERIC_COLS = buildNumericCols(SCHEMA_POSTGRES_SQL);
export const buildNumericAliases = (sql, numericCols) => {
  const set = new Set();
  for (const m of sql.matchAll(AGG_ALIAS_RE)) set.add(m[1].toLowerCase());
  for (const col of numericCols) {
    const re = new RegExp(`\\b(?:[A-Za-z_]\\w*\\.)?${col}\\s+(?:as\\s+)?([A-Za-z_]\\w*)`, 'gi');
    for (const m of sql.matchAll(re)) set.add(m[1].toLowerCase());
  }
  return set;
};
export const mapRowKeys = (row, queryMap, numericKeys = SCHEMA_NUMERIC_COLS) => {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const key = queryMap.get(k) ?? SCHEMA_KEY_MAP.get(k) ?? k;
    out[key] =
      typeof v === 'string' && numericKeys.has(key.toLowerCase()) && NUMERIC_VALUE.test(v)
        ? Number(v)
        : v;
  }
  return out;
};

const toPositional = (sql, params) => {
  let i = 0;
  const out = sql.replace(/\?/g, () => `$${++i}`);
  return { sql: out, params };
};

export class SqliteAdapter {
  constructor(dbPath) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('synchronous = NORMAL');
    logger.info({ dbPath }, 'SQLite adapter listo');
  }

  async query(sql, params = []) {
    try {
      return this.db.prepare(sql).all(...params);
    } catch (e) {
      logger.error({ err: e.message, sql }, 'SQLite query error');
      throw e;
    }
  }

  async getOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  async execute(sql, params = []) {
    try {
      const info = this.db.prepare(sql).run(...params);
      return { insertId: info.lastInsertRowid, changes: info.changes };
    } catch (e) {
      logger.error({ err: e.message, sql, code: e.code }, 'SQLite execute error');
      throw e;
    }
  }

  async transaction(fn) {
    return fn({
      query: async (sql, params) => this.query(sql, params),
      execute: async (sql, params) => this.execute(sql, params),
    });
  }

  async close() {
    this.db.close();
  }
}

export class MySqlAdapter {
  constructor(cfg) {
    this.mysql = null;
    this.pool = null;
    this.initPromise = this.#init(cfg);
  }

  async #init(cfg) {
    const mysql = await import('mysql2/promise');
    this.mysql = mysql;
    this.pool = mysql.createPool({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      waitForConnections: true,
      connectionLimit: 10,
      charset: 'utf8mb4',
      dateStrings: true,
    });
    logger.info({ host: cfg.host, database: cfg.database }, 'MySQL adapter listo');
  }

  async query(sql, params = []) {
    await this.initPromise;
    const [rows] = await this.pool.execute(sql, params);
    return rows;
  }

  async getOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  async execute(sql, params = []) {
    await this.initPromise;
    const [result] = await this.pool.execute(sql, params);
    return { insertId: result.insertId, changes: result.affectedRows };
  }

  async transaction(fn) {
    await this.initPromise;
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await fn({
        query: async (sql, params) => {
          const [rows] = await conn.execute(sql, params);
          return rows;
        },
        execute: async (sql, params) => {
          const [r] = await conn.execute(sql, params);
          return { insertId: r.insertId, changes: r.affectedRows };
        },
      });
      await conn.commit();
      return result;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async close() {
    await this.initPromise;
    await this.pool.end();
  }
}

export class NeonAdapter {
  constructor(connectionString) {
    if (!connectionString) {
      throw new Error('DATABASE_URL requerido para DB_TYPE=postgres');
    }
    this.sql = null;
    this.initPromise = this.#init(connectionString);
  }

  async #init(connectionString) {
    const { neon, neonConfig } = await import('@neondatabase/serverless');
    if (process.env.NEON_FETCH_ENDPOINT) {
      neonConfig.fetchEndpoint = process.env.NEON_FETCH_ENDPOINT;
    }
    this.sql = neon(connectionString);
    const masked = connectionString.replace(/:[^:@]+@/, ':***@');
    logger.info({ dsn: masked, driver: 'neon-http' }, 'Postgres/Neon adapter listo');
  }

  async query(sql, params = []) {
    await this.initPromise;
    try {
      const { sql: psql, params: pparams } = toPositional(sql, params);
      const rows = await this.sql(psql, pparams);
      const qm = buildKeyMap(sql);
      const numericKeys = new Set([...SCHEMA_NUMERIC_COLS, ...buildNumericAliases(sql, SCHEMA_NUMERIC_COLS)]);
      return rows.map((r) => mapRowKeys(r, qm, numericKeys));
    } catch (e) {
      logger.error({ err: e.message, sql }, 'Postgres query error');
      throw e;
    }
  }

  async getOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  async execute(sql, params = []) {
    await this.initPromise;
    try {
      const { sql: psql, params: pparams } = toPositional(sql, params);
      const isInsert = /^\s*insert\s+into\s+/i.test(sql);
      const isUpdate = /^\s*update\s+/i.test(sql);
      const isDelete = /^\s*delete\s+from\s+/i.test(sql);
      if (isInsert && !/\breturning\b/i.test(sql)) {
        const rows = await this.sql(`${psql} RETURNING id`, pparams);
        const row = Array.isArray(rows) ? rows[0] : null;
        return { insertId: row?.id ?? null, changes: Array.isArray(rows) ? rows.length : 1 };
      }
      if ((isUpdate || isDelete) && !/\breturning\b/i.test(sql)) {
        const rows = await this.sql(`${psql} RETURNING id`, pparams);
        return { insertId: null, changes: Array.isArray(rows) ? rows.length : 0 };
      }
      const rows = await this.sql(psql, pparams);
      const arr = Array.isArray(rows) ? rows : [];
      return { insertId: null, changes: arr.length };
    } catch (e) {
      logger.error({ err: e.message, sql, code: e.code }, 'Postgres execute error');
      throw e;
    }
  }

  async transaction(fn) {
    await this.initPromise;
    logger.warn('Neon HTTP no soporta multi-statement transactions atómicas vía este driver; ejecutando secuencialmente (sin rollback). Usar solo para código idempotente.');
    return fn({
      query: async (sql, params) => this.query(sql, params),
      execute: async (sql, params) => this.execute(sql, params),
    });
  }

  async close() {
    // Neon HTTP es stateless, no hay pool que cerrar
  }
}

export const createDatabase = async () => {
  if (env.DB_TYPE === 'mysql') {
    return new MySqlAdapter({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASS,
      database: env.DB_NAME,
    });
  }
  if (env.DB_TYPE === 'postgres') {
    return new NeonAdapter(env.DATABASE_URL);
  }
  return new SqliteAdapter(env.SQLITE_PATH);
};
