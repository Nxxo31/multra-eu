import { NotFoundError, ValidationError } from '../utils/errors.js';
import { nowSql, addYears } from '../utils/dates.js';
import { safeJson } from '../utils/json.js';

export class InspeccionService {
  constructor({ inspeccionRepository, vehiculoRepository }) {
    this.inspeccionRepository = inspeccionRepository;
    this.vehiculoRepository = vehiculoRepository;
  }

  async list(vehiculoId) {
    const rows = await this.inspeccionRepository.findAll(vehiculoId);
    return rows.map(r => ({ ...r, items: safeJson(r.items, {}) }));
  }

  async create(data) {
    if (!data.vehiculoId) throw new ValidationError('vehiculoId requerido');
    const vehiculo = await this.vehiculoRepository.findByIdSimple(data.vehiculoId);
    if (!vehiculo) throw new NotFoundError('Vehículo');

    const vals = Object.values(data.items || {});
    const okCount = vals.filter(v => v === 'ok').length;
    const failCount = vals.filter(v => v === 'fail').length;
    const naCount = vals.filter(v => v === 'na').length;

    const resultado = data.resultado || (failCount > 0 ? 'rechazado' : 'aprobado');

    const ins = await this.inspeccionRepository.create({
      ...data,
      okCount,
      failCount,
      naCount,
      resultado,
      createdAt: nowSql(),
    });

    if (resultado === 'aprobado' && failCount === 0 && okCount > 0) {
      await this.vehiculoRepository.updateTecnomecanica(data.vehiculoId, addYears(new Date(), 1));
    }
    return ins;
  }
}
