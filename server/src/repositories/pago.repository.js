import { BaseRepository } from './base.repository.js';

export class PagoRepository extends BaseRepository {
  async findAll() {
    return this.query('SELECT * FROM pagos ORDER BY fecha DESC');
  }

  async findById(id) {
    return this.getOne('SELECT * FROM pagos WHERE id = ?', [id]);
  }

  async create(data) {
    const r = await this.execute(
      `INSERT INTO pagos (polizaId,clienteId,monto,metodo,ref,fecha,estado)
       VALUES (?,?,?,?,?,?,?)`,
      [
        data.polizaId || null, data.clienteId, data.monto, data.metodo,
        data.ref || '', data.fecha, 'pagado',
      ]
    );
    return this.findById(r.insertId);
  }
}
