export class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  login = async (req, res) => {
    const data = await this.authService.login(req.body);
    res.json(data);
  };

  me = async (req, res) => {
    const user = await this.authService.me(req.user.id);
    res.json({ user });
  };
}

export class HealthController {
  constructor({ healthService }) {
    this.healthService = healthService;
  }

  check = async (_req, res) => {
    res.json(this.healthService.check());
  };
}

export class ClienteController {
  constructor({ clienteService }) {
    this.clienteService = clienteService;
  }

  list = async (req, res) => {
    const q = req.validatedQuery?.q || '';
    res.json(await this.clienteService.list(q));
  };

  getById = async (req, res) => {
    res.json(await this.clienteService.getById(req.params.id));
  };

  create = async (req, res) => {
    res.status(201).json(await this.clienteService.create(req.body));
  };

  update = async (req, res) => {
    res.json(await this.clienteService.update(req.params.id, req.body));
  };
}

export class VehiculoController {
  constructor({ vehiculoService }) {
    this.vehiculoService = vehiculoService;
  }

  list = async (req, res) => {
    const q = req.validatedQuery?.q || '';
    res.json(await this.vehiculoService.list(q));
  };

  getById = async (req, res) => {
    res.json(await this.vehiculoService.getById(req.params.id));
  };

  create = async (req, res) => {
    res.status(201).json(await this.vehiculoService.create(req.body));
  };

  update = async (req, res) => {
    res.json(await this.vehiculoService.update(req.params.id, req.body));
  };

  remove = async (req, res) => {
    await this.vehiculoService.delete(req.params.id);
    res.status(204).end();
  };
}

export class PolizaController {
  constructor({ polizaService }) {
    this.polizaService = polizaService;
  }

  list = async (_req, res) => {
    res.json(await this.polizaService.list());
  };

  create = async (req, res) => {
    res.status(201).json(await this.polizaService.create(req.body));
  };

  remove = async (req, res) => {
    await this.polizaService.delete(req.params.id);
    res.status(204).end();
  };
}

export class CitaController {
  constructor({ citaService }) {
    this.citaService = citaService;
  }

  list = async (_req, res) => {
    res.json(await this.citaService.list());
  };

  create = async (req, res) => {
    res.status(201).json(await this.citaService.create(req.body));
  };

  update = async (req, res) => {
    res.json(await this.citaService.update(req.params.id, req.body));
  };
}

export class TramiteController {
  constructor({ tramiteService }) {
    this.tramiteService = tramiteService;
  }

  list = async (_req, res) => {
    res.json(await this.tramiteService.list());
  };

  create = async (req, res) => {
    res.status(201).json(await this.tramiteService.create(req.body));
  };

  update = async (req, res) => {
    res.json(await this.tramiteService.update(req.params.id, req.body));
  };
}

export class PagoController {
  constructor({ pagoService }) {
    this.pagoService = pagoService;
  }

  list = async (_req, res) => {
    res.json(await this.pagoService.list());
  };

  create = async (req, res) => {
    res.status(201).json(await this.pagoService.create(req.body));
  };
}

export class InspeccionController {
  constructor({ inspeccionService }) {
    this.inspeccionService = inspeccionService;
  }

  list = async (req, res) => {
    const vehiculoId = req.validatedQuery?.vehiculoId;
    res.json(await this.inspeccionService.list(vehiculoId));
  };

  create = async (req, res) => {
    res.status(201).json(await this.inspeccionService.create(req.body));
  };
}

export class CotizadorController {
  constructor({ cotizadorService }) {
    this.cotizadorService = cotizadorService;
  }

  cotizar = async (req, res) => {
    res.json(await this.cotizadorService.cotizar(req.body));
  };
}

export class ServicioController {
  constructor({ servicioRepository }) {
    this.servicioRepository = servicioRepository;
  }

  list = async (_req, res) => {
    res.json(await this.servicioRepository.findAll());
  };
}

export class StatsController {
  constructor({ statsService }) {
    this.statsService = statsService;
  }

  get = async (_req, res) => {
    res.json(await this.statsService.getDashboard());
  };
}

export { RecordatorioController } from './recordatorio.controller.js';
