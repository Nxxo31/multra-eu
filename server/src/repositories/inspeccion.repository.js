import { BaseRepository } from './base.repository.js';

export class InspeccionRepository extends BaseRepository {
  async findAll(vehiculoId) {
    if (vehiculoId) {
      return this.query(
        'SELECT * FROM inspections WHERE vehiculoId = ? ORDER BY id DESC',
        [vehiculoId]
      );
    }
    return this.query('SELECT * FROM inspections ORDER BY id DESC');
  }

  async findById(id) {
    return this.getOne('SELECT * FROM inspections WHERE id = ?', [id]);
  }

  async create(data) {
    const r = await this.execute(
      `INSERT INTO inspections (vehiculoId,tecnico,resultado,okCount,failCount,naCount,items,obs,createdAt)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        data.vehiculoId, data.tecnico, data.resultado,
        data.okCount, data.failCount, data.naCount,
        JSON.stringify(data.items || {}), data.obs || '', data.createdAt,
      ]
    );
    return this.findById(r.insertId);
  }
}
