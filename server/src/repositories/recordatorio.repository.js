export class RecordatorioRepository {
  constructor(db) {
    this.db = db;
  }

  async create({ placa, nombre, cedula, celular, ip, userAgent }) {
    const nowSql = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const result = await this.db.execute(
      `INSERT INTO recordatorios (placa, nombre, cedula, celular, estado, ip, userAgent, createdAt)
       VALUES (?, ?, ?, ?, 'pendiente', ?, ?, ?)`,
      [(placa || '').toUpperCase(), nombre, cedula, celular, ip || null, userAgent || null, nowSql]
    );
    return { id: result.lastInsertRowid, placa: placa.toUpperCase(), nombre, cedula, celular, estado: 'pendiente', createdAt: nowSql };
  }

  async findRecentByPlacaAndCelular(placa, celular, withinMinutes = 30) {
    const since = new Date(Date.now() - withinMinutes * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const row = await this.db.getOne(
      `SELECT id FROM recordatorios WHERE placa = ? AND celular = ? AND createdAt >= ? LIMIT 1`,
      [placa.toUpperCase(), celular, since]
    );
    return row || null;
  }

  async list(limit = 100) {
    return this.db.query(
      `SELECT id, placa, nombre, cedula, celular, estado, createdAt, sentAt FROM recordatorios ORDER BY id DESC LIMIT ?`,
      [limit]
    );
  }

  async count() {
    const row = await this.db.getOne('SELECT COUNT(*) AS n FROM recordatorios');
    return row?.n || 0;
  }
}