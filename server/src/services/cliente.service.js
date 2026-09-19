import { NotFoundError } from '../utils/errors.js';
import { nowSql } from '../utils/dates.js';

export class ClienteService {
  constructor({ clienteRepository }) {
    this.clienteRepository = clienteRepository;
  }

  list(q) {
    return this.clienteRepository.search(q);
  }

  async getById(id) {
    const c = await this.clienteRepository.findById(id);
    if (!c) throw new NotFoundError('Cliente');
    return c;
  }

  create(data) {
    return this.clienteRepository.create({ ...data, createdAt: nowSql() });
  }

  async update(id, data) {
    await this.getById(id);
    return this.clienteRepository.update(id, data);
  }
}
