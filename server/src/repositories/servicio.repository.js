import { BaseRepository } from './base.repository.js';

export class ServicioRepository extends BaseRepository {
  async findAll() {
    return this.query('SELECT * FROM servicios ORDER BY tipo, nombre');
  }

  async findById(id) {
    return this.getOne('SELECT * FROM servicios WHERE id = ?', [id]);
  }

  async findByIds(ids) {
    if (!ids.length) return [];
    const placeholders = ids.map(() => '?').join(',');
    return this.query(`SELECT * FROM servicios WHERE id IN (${placeholders})`, ids);
  }
}
