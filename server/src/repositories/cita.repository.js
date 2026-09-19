import { BaseRepository } from './base.repository.js';

export class CitaRepository extends BaseRepository {
  async findAll() {
    return this.query(
      `SELECT c.*, v.placa AS vehiculoPlaca, v.marca AS vehiculoMarca, v.linea AS vehiculoLinea,
              cl.nombre AS clienteNombre, cl.cedula AS clienteCedula,
              s.nombre AS servicioNombre, s.tipo AS servicioTipo, s.precio AS servicioPrecio, s.duracionMin AS servicioDuracion
       FROM citas c
       LEFT JOIN vehiculos v ON v.id = c.vehiculoId
       LEFT JOIN clientes  cl ON cl.id = c.clienteId
       LEFT JOIN servicios  s ON s.id = c.servicioId
       ORDER BY c.fecha ASC, c.hora ASC`
    );
  }

  async findById(id) {
    return this.getOne('SELECT * FROM citas WHERE id = ?', [id]);
  }

  async create(data) {
    const r = await this.execute(
      `INSERT INTO citas (vehiculoId,clienteId,servicioId,fecha,hora,estado,tecnico,obs,createdAt)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        data.vehiculoId, data.clienteId, data.servicioId, data.fecha, data.hora,
        data.estado || 'agendada', data.tecnico || 'Por asignar', data.obs || '', data.createdAt,
      ]
    );
    return this.findById(r.insertId);
  }

  async update(id, data) {
    const fields = [];
    const params = [];
    for (const [k, v] of Object.entries(data)) {
      fields.push(`${k} = ?`);
      params.push(v);
    }
    if (!fields.length) return this.findById(id);
    params.push(id);
    await this.execute(`UPDATE citas SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }
}
