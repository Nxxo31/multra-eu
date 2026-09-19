import { NotFoundError, ValidationError } from '../utils/errors.js';
import { nowSql } from '../utils/dates.js';

export class VehiculoService {
  constructor({ vehiculoRepository, clienteRepository }) {
    this.vehiculoRepository = vehiculoRepository;
    this.clienteRepository = clienteRepository;
  }

  list(q) {
    return this.vehiculoRepository.findAll(q);
  }

  async getById(id) {
    const v = await this.vehiculoRepository.findById(id);
    if (!v) throw new NotFoundError('Vehículo');
    const [polizas, citas] = await Promise.all([
      this.vehiculoRepository.findPolizas(id),
      this.vehiculoRepository.findCitas(id),
    ]);
    const cliente = v.clienteId
      ? {
          id: v.clienteId,
          nombre: v.clienteNombre,
          cedula: v.clienteCedula,
          telefono: v.clienteTelefono,
          email: v.clienteEmail,
          direccion: v.clienteDireccion,
        }
      : null;
    return { ...v, cliente, polizas, citas };
  }

  async create(data) {
    await this.#assertCliente(data.clienteId);
    return this.vehiculoRepository.create({ ...data, createdAt: nowSql() });
  }

  async update(id, data) {
    await this.getById(id);
    if (data.clienteId) await this.#assertCliente(data.clienteId);
    return this.vehiculoRepository.update(id, data);
  }

  async delete(id) {
    const ok = await this.vehiculoRepository.delete(id);
    if (!ok) throw new NotFoundError('Vehículo');
  }

  async #assertCliente(clienteId) {
    const c = await this.clienteRepository.findById(clienteId);
    if (!c) throw new ValidationError(`Cliente ${clienteId} no existe`);
  }
}
