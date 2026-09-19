import { NotFoundError, ValidationError } from '../utils/errors.js';
import { nowSql } from '../utils/dates.js';
import { safeJson } from '../utils/json.js';

const mapTramite = (t) => ({
  ...t,
  cliente: t.clienteId
    ? { id: t.clienteId, nombre: t.clienteNombre, cedula: t.clienteCedula, telefono: t.clienteTelefono }
    : null,
  vehiculo: t.vehiculoId
    ? { id: t.vehiculoId, placa: t.vehiculoPlaca, marca: t.vehiculoMarca, linea: t.vehiculoLinea }
    : null,
  documentos: t.documentos ? safeJson(t.documentos, []) : [],
});

export class TramiteService {
  constructor({ tramiteRepository, clienteRepository }) {
    this.tramiteRepository = tramiteRepository;
    this.clienteRepository = clienteRepository;
  }

  async list() {
    const rows = await this.tramiteRepository.findAll();
    return rows.map(mapTramite);
  }

  async create(data) {
    const cliente = await this.clienteRepository.findById(data.clienteId);
    if (!cliente) throw new ValidationError(`Cliente ${data.clienteId} no existe`);
    return this.tramiteRepository.create({ ...data, createdAt: nowSql() });
  }

  async update(id, data) {
    const cur = await this.tramiteRepository.findById(id);
    if (!cur) throw new NotFoundError('Trámite');
    return this.tramiteRepository.update(id, data);
  }
}
