import { ValidationError } from '../utils/errors.js';
import { fmtCOP } from '../utils/money.js';

const IVA = 0.19;

export class CotizadorService {
  constructor({ servicioRepository }) {
    this.servicioRepository = servicioRepository;
  }

  async cotizar({ items, descuentoPct = 0 }) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('items[] requerido');
    }

    const detalle = [];
    for (const i of items) {
      const s = await this.servicioRepository.findById(i.servicioId);
      if (!s) throw new ValidationError(`Servicio ${i.servicioId} no existe`);
      const cantidad = Number(i.cantidad || 1);
      const precioUnit = Number(s.precio);
      detalle.push({
        servicioId: s.id,
        nombre: s.nombre,
        precioUnit,
        cantidad,
        subtotal: precioUnit * cantidad,
        fuente: s.fuente,
      });
    }

    const subtotal = detalle.reduce((a, x) => a + x.subtotal, 0);
    const iva = Math.round(subtotal * IVA);
    const descuento = Math.round(subtotal * (Number(descuentoPct) / 100));
    const total = subtotal + iva - descuento;

    return {
      detalle,
      subtotal,
      iva,
      descuento,
      total,
      formatted: {
        subtotal: fmtCOP(subtotal),
        iva: fmtCOP(iva),
        descuento: fmtCOP(descuento),
        total: fmtCOP(total),
      },
    };
  }
}
