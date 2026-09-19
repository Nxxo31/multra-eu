import { BaseRepository } from './base.repository.js';

export class TramiteRepository extends BaseRepository {
  async findAll() {
    return this.query(
      `SELECT t.*, c.nombre AS clienteNombre, c.cedula AS clienteCedula, c.telefono AS clienteTelefono,
              v.placa AS vehiculoPlaca, v.marca AS vehiculoMarca, v.linea AS vehiculoLinea
       FROM tramites t
       LEFT JOIN clientes  c ON c.id = t.clienteId
       LEFT JOIN vehiculos v ON v.id = t.vehiculoId
       ORDER BY t.id DESC`
    );
  }

  async findById(id) {
    return this.getOne('SELECT * FROM tramites WHERE id = ?', [id]);
  }

  async create(data) {
    const r = await this.execute(
      `INSERT INTO tramites (clienteId,vehiculoId,tipo,descripcion,documentos,gestor,estado,createdAt)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        data.clienteId, data.vehiculoId || null, data.tipo, data.descripcion || '',
        JSON.stringify(data.documentos || []), data.gestor || 'admin',
        data.estado || 'recibido', data.createdAt,
      ]
    );
    return this.findById(r.insertId);
  }

  async update(id, data) {
    const fields = [];
    const params = [];
    for (const [k, v] of Object.entries(data)) {
      if (k === 'documentos') {
        fields.push('documentos = ?');
        params.push(JSON.stringify(v || []));
      } else {
        fields.push(`${k} = ?`);
        params.push(v);
      }
    }
    if (!fields.length) return this.findById(id);
    params.push(id);
    await this.execute(`UPDATE tramites SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }
}
