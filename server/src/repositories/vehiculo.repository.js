import { BaseRepository } from './base.repository.js';

const SELECT_VEHICULO_BASE = `
  SELECT v.*, c.nombre AS clienteNombre
  FROM vehiculos v
  LEFT JOIN clientes c ON c.id = v.clienteId
`;

export class VehiculoRepository extends BaseRepository {
  async findAll(q) {
    if (!q) {
      return this.query(`${SELECT_VEHICULO_BASE} ORDER BY v.id DESC`);
    }
    const term = `%${q.toLowerCase()}%`;
    return this.query(
      `${SELECT_VEHICULO_BASE}
       WHERE LOWER(v.placa) LIKE ? OR LOWER(c.nombre) LIKE ?
       ORDER BY v.id DESC`,
      [term, term]
    );
  }

  async findById(id) {
    const v = await this.getOne(
      `SELECT v.*, c.nombre AS clienteNombre, c.cedula AS clienteCedula,
              c.telefono AS clienteTelefono, c.email AS clienteEmail, c.direccion AS clienteDireccion
       FROM vehiculos v LEFT JOIN clientes c ON c.id = v.clienteId WHERE v.id = ?`,
      [id]
    );
    return v;
  }

  async findByIdSimple(id) {
    return this.getOne('SELECT * FROM vehiculos WHERE id = ?', [id]);
  }

  async findPolizas(vehiculoId) {
    return this.query('SELECT * FROM polizas WHERE vehiculoId = ? ORDER BY fin DESC', [vehiculoId]);
  }

  async findCitas(vehiculoId) {
    return this.query(
      'SELECT * FROM citas WHERE vehiculoId = ? ORDER BY fecha DESC, hora DESC',
      [vehiculoId]
    );
  }

  async create(data) {
    const r = await this.execute(
      `INSERT INTO vehiculos (clienteId,placa,marca,linea,modelo,color,clase,tipoVehiculo,cilindraje,combustible,kilometraje,soatVence,tecnomecanicaVence,createdAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.clienteId, data.placa, data.marca, data.linea || '', data.modelo,
        data.color || '', data.clase || '', data.tipoVehiculo || 'liviano',
        data.cilindraje || 0, data.combustible || 'Gasolina', data.kilometraje || 0,
        data.soatVence || null, data.tecnomecanicaVence || null, data.createdAt,
      ]
    );
    return this.findById(r.insertId);
  }

  async update(id, data) {
    await this.execute(
      `UPDATE vehiculos SET clienteId=?,placa=?,marca=?,linea=?,modelo=?,color=?,clase=?,tipoVehiculo=?,cilindraje=?,combustible=?,kilometraje=?,soatVence=?,tecnomecanicaVence=?
       WHERE id=?`,
      [
        data.clienteId, data.placa, data.marca, data.linea || '', data.modelo,
        data.color || '', data.clase || '', data.tipoVehiculo || 'liviano',
        data.cilindraje || 0, data.combustible || 'Gasolina', data.kilometraje || 0,
        data.soatVence || null, data.tecnomecanicaVence || null, id,
      ]
    );
    return this.findById(id);
  }

  async delete(id) {
    const r = await this.execute('DELETE FROM vehiculos WHERE id = ?', [id]);
    return r.changes > 0;
  }

  async updateSoat(vehiculoId, fecha) {
    await this.execute('UPDATE vehiculos SET soatVence = ? WHERE id = ?', [fecha, vehiculoId]);
  }

  async updateTecnomecanica(vehiculoId, fecha) {
    await this.execute(
      'UPDATE vehiculos SET tecnomecanicaVence = ? WHERE id = ?',
      [fecha, vehiculoId]
    );
  }
}
