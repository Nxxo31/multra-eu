import { BaseRepository } from './base.repository.js';

export class PolizaRepository extends BaseRepository {
  async findAll() {
    return this.query(
      `SELECT p.*, v.placa AS vehiculoPlaca, v.marca AS vehiculoMarca, v.linea AS vehiculoLinea,
              c.nombre AS clienteNombre, c.cedula AS clienteCedula
       FROM polizas p
       LEFT JOIN vehiculos v ON v.id = p.vehiculoId
       LEFT JOIN clientes  c ON c.id = p.clienteId
       ORDER BY p.fin DESC`
    );
  }

  async findById(id) {
    return this.getOne('SELECT * FROM polizas WHERE id = ?', [id]);
  }

  async create(data) {
    const r = await this.execute(
      `INSERT INTO polizas (vehiculoId,clienteId,tipo,aseguradora,numero,inicio,fin,prima,estado,createdAt)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        data.vehiculoId, data.clienteId, data.tipo, data.aseguradora, data.numero || '',
        data.inicio, data.fin, data.prima, 'vigente', data.createdAt,
      ]
    );
    return this.findById(r.insertId);
  }

  async delete(id) {
    const r = await this.execute('DELETE FROM polizas WHERE id = ?', [id]);
    return r.changes > 0;
  }
}
