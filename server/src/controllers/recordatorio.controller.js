export class RecordatorioController {
  constructor({ recordatorioService }) {
    this.recordatorioService = recordatorioService;
  }
  create = async (req, res) => {
    const rec = await this.recordatorioService.create({
      placa: req.body.placa,
      nombre: req.body.nombre,
      cedula: req.body.cedula,
      celular: req.body.celular,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || null,
    });
    res.status(201).json({ ok: true, id: rec.id, message: 'Recordatorio creado. Te contactaremos antes del vencimiento.' });
  };
  list = async (_req, res) => {
    res.json(await this.recordatorioService.list());
  };
  count = async (_req, res) => {
    res.json({ total: await this.recordatorioService.count() });
  };
}