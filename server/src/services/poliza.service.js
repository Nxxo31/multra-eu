import { NotFoundError, ValidationError } from '../utils/errors.js';
import { nowSql, daysBetween, todayISO } from '../utils/dates.js';

const mapPoliza = (p) => ({
  ...p,
  vehiculo: p.vehiculoId
    ? { id: p.vehiculoId, placa: p.vehiculoPlaca, marca: p.vehiculoMarca, linea: p.vehiculoLinea }
    : null,
  cliente: p.clienteId
    ? { id: p.clienteId, nombre: p.clienteNombre, cedula: p.clienteCedula }
    : null,
  diasParaVencer: daysBetween(p.fin, todayISO()),
  estado: daysBetween(p.fin, todayISO()) < 0 ? 'vencida' : p.estado,
});

export class PolizaService {
  constructor({ polizaRepository, vehiculoRepository }) {
    this.polizaRepository = polizaRepository;
    this.vehiculoRepository = vehiculoRepository;
  }

  async list() {
    const rows = await this.polizaRepository.findAll();
    return rows.map(mapPoliza);
  }

  async create(data) {
    const vehiculo = await this.vehiculoRepository.findByIdSimple(data.vehiculoId);
    if (!vehiculo) throw new NotFoundError('Vehículo');
    const poliza = await this.polizaRepository.create({
      ...data,
      vehiculoId: vehiculo.id,
      clienteId: vehiculo.clienteId,
      createdAt: nowSql(),
    });
    if (data.tipo === 'soat') {
      await this.vehiculoRepository.updateSoat(vehiculo.id, data.fin);
    }
    return poliza;
  }

  async delete(id) {
    const ok = await this.polizaRepository.delete(id);
    if (!ok) throw new NotFoundError('Póliza');
  }
}
