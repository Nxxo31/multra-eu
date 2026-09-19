import { ConflictError } from '../utils/errors.js';

export class RecordatorioService {
  constructor({ recordatorioRepository }) {
    this.recordatorioRepository = recordatorioRepository;
  }

  async create({ placa, nombre, cedula, celular, ip, userAgent }) {
    const existing = await this.recordatorioRepository.findRecentByPlacaAndCelular(placa, celular, 30);
    if (existing) {
      throw new ConflictError('Ya tenemos un recordatorio reciente para esa placa y celular. Te contactaremos pronto.');
    }
    return this.recordatorioRepository.create({ placa, nombre, cedula, celular, ip, userAgent });
  }

  list(limit = 100) {
    return this.recordatorioRepository.list(limit);
  }

  count() {
    return this.recordatorioRepository.count();
  }
}