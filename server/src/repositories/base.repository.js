import { ConflictError } from '../utils/errors.js';

const isUniqueViolation = (e) =>
  e?.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
  e?.code === 'ER_DUP_ENTRY' ||
  e?.errno === 19;

export class BaseRepository {
  constructor(db) {
    this.db = db;
  }

  async query(sql, params = []) {
    return this.db.query(sql, params);
  }

  async getOne(sql, params = []) {
    return this.db.getOne(sql, params);
  }

  async execute(sql, params = []) {
    try {
      return await this.db.execute(sql, params);
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictError('Registro duplicado', { cause: e.message });
      throw e;
    }
  }

  async transaction(fn) {
    return this.db.transaction(fn);
  }
}
