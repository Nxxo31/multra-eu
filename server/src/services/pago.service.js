import { ValidationError } from '../utils/errors.js';
import { todayISO } from '../utils/dates.js';

export class PagoService {
  constructor({ pagoRepository, clienteRepository }) {
    this.pagoRepository = pagoRepository;
    this.clienteRepository = clienteRepository;
  }

  list() {
    return this.pagoRepository.findAll();
  }

  async create(data) {
    const cliente = await this.clienteRepository.findById(data.clienteId);
    if (!cliente) throw new ValidationError(`Cliente ${data.clienteId} no existe`);
    return this.pagoRepository.create({ ...data, fecha: todayISO() });
  }
}
