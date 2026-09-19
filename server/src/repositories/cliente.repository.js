import { BaseRepository } from './base.repository.js';

export class ClienteRepository extends BaseRepository {
  async findAll() {
    return this.query('SELECT * FROM clientes ORDER BY id DESC');
  }

  async search(q) {
    if (!q) return this.findAll();
    const term = `%${q.toLowerCase()}%`;
    return this.query(
      'SELECT * FROM clientes WHERE LOWER(nombre) LIKE ? OR LOWER(cedula) LIKE ? ORDER BY id DESC',
      [term, term]
    );
  }

  async findById(id) {
    return this.getOne('SELECT * FROM clientes WHERE id = ?', [id]);
  }

  async create(data) {
    const { nombre, cedula, telefono, email, direccion, createdAt } = data;
    const r = await this.execute(
      'INSERT INTO clientes (nombre,cedula,telefono,email,direccion,createdAt) VALUES (?,?,?,?,?,?)',
      [nombre, cedula, telefono, email, direccion, createdAt]
    );
    return this.findById(r.insertId);
  }

  async update(id, data) {
    await this.execute(
      'UPDATE clientes SET nombre=?, cedula=?, telefono=?, email=?, direccion=? WHERE id=?',
      [data.nombre, data.cedula, data.telefono, data.email, data.direccion, id]
    );
    return this.findById(id);
  }
}
