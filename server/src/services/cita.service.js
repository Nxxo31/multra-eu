import { NotFoundError, ValidationError } from '../utils/errors.js';
import { nowSql } from '../utils/dates.js';

const mapCita = (c) => ({
  ...c,
  vehiculo: c.vehiculoId
    ? { id: c.vehiculoId, placa: c.vehiculoPlaca, marca: c.vehiculoMarca, linea: c.vehiculoLinea }
    : null,
  cliente: c.clienteId
    ? { id: c.clienteId, nombre: c.clienteNombre, cedula: c.clienteCedula }
    : null,
  servicio: c.servicioId
    ? {
        id: c.servicioId,
        nombre: c.servicioNombre,
        tipo: c.servicioTipo,
        precio: c.servicioPrecio,
        duracionMin: c.servicioDuracion,
      }
    : null,
});

export class CitaService {
  constructor({ citaRepository, vehiculoRepository, servicioRepository }) {
    this.citaRepository = citaRepository;
    this.vehiculoRepository = vehiculoRepository;
    this.servicioRepository = servicioRepository;
  }

  async list() {
    const rows = await this.citaRepository.findAll();
    return rows.map(mapCita);
  }

  async create(data) {
    const vehiculo = await this.vehiculoRepository.findByIdSimple(data.vehiculoId);
    if (!vehiculo) throw new NotFoundError('Vehículo');
    const servicio = await this.servicioRepository.findById(data.servicioId);
    if (!servicio) throw new ValidationError(`Servicio ${data.servicioId} no existe`);
    return this.citaRepository.create({
      ...data,
      clienteId: vehiculo.clienteId,
      createdAt: nowSql(),
    });
  }

  async update(id, data) {
    const cur = await this.citaRepository.findById(id);
    if (!cur) throw new NotFoundError('Cita');
    const sanitized = { ...data };
    if (sanitized.vehiculoId) {
      const vehiculo = await this.vehiculoRepository.findByIdSimple(sanitized.vehiculoId);
      if (!vehiculo) throw new NotFoundError('Vehículo');
      sanitized.clienteId = vehiculo.clienteId;
    }
    return this.citaRepository.update(id, sanitized);
  }
}
