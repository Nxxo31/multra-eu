import { UserRepository } from './repositories/user.repository.js';
import { ClienteRepository } from './repositories/cliente.repository.js';
import { VehiculoRepository } from './repositories/vehiculo.repository.js';
import { PolizaRepository } from './repositories/poliza.repository.js';
import { CitaRepository } from './repositories/cita.repository.js';
import { TramiteRepository } from './repositories/tramite.repository.js';
import { PagoRepository } from './repositories/pago.repository.js';
import { InspeccionRepository } from './repositories/inspeccion.repository.js';
import { ServicioRepository } from './repositories/servicio.repository.js';
import { StatsRepository } from './repositories/stats.repository.js';

import { AuthService } from './services/auth.service.js';
import { HealthService } from './services/health.service.js';
import { ClienteService } from './services/cliente.service.js';
import { VehiculoService } from './services/vehiculo.service.js';
import { PolizaService } from './services/poliza.service.js';
import { CitaService } from './services/cita.service.js';
import { TramiteService } from './services/tramite.service.js';
import { PagoService } from './services/pago.service.js';
import { InspeccionService } from './services/inspeccion.service.js';
import { CotizadorService } from './services/cotizador.service.js';
import { StatsService } from './services/stats.service.js';

import {
  AuthController,
  HealthController,
  ClienteController,
  VehiculoController,
  PolizaController,
  CitaController,
  TramiteController,
  PagoController,
  InspeccionController,
  CotizadorController,
  ServicioController,
  StatsController,
} from './controllers/index.js';

export const buildContainer = (db) => {
  const userRepo        = new UserRepository(db);
  const clienteRepo     = new ClienteRepository(db);
  const vehiculoRepo    = new VehiculoRepository(db);
  const polizaRepo      = new PolizaRepository(db);
  const citaRepo        = new CitaRepository(db);
  const tramiteRepo     = new TramiteRepository(db);
  const pagoRepo        = new PagoRepository(db);
  const inspeccionRepo  = new InspeccionRepository(db);
  const servicioRepo    = new ServicioRepository(db);
  const statsRepo       = new StatsRepository(db);

  const authService       = new AuthService({ userRepository: userRepo });
  const healthService     = new HealthService();
  const clienteService    = new ClienteService({ clienteRepository: clienteRepo });
  const vehiculoService   = new VehiculoService({ vehiculoRepository: vehiculoRepo, clienteRepository: clienteRepo });
  const polizaService     = new PolizaService({ polizaRepository: polizaRepo, vehiculoRepository: vehiculoRepo });
  const citaService       = new CitaService({ citaRepository: citaRepo, vehiculoRepository: vehiculoRepo, servicioRepository: servicioRepo });
  const tramiteService    = new TramiteService({ tramiteRepository: tramiteRepo, clienteRepository: clienteRepo });
  const pagoService       = new PagoService({ pagoRepository: pagoRepo, clienteRepository: clienteRepo });
  const inspeccionService = new InspeccionService({ inspeccionRepository: inspeccionRepo, vehiculoRepository: vehiculoRepo });
  const cotizadorService  = new CotizadorService({ servicioRepository: servicioRepo });
  const statsService      = new StatsService({ statsRepository: statsRepo });

  const controllers = {
    authController:        new AuthController({ authService }),
    healthController:      new HealthController({ healthService }),
    clienteController:     new ClienteController({ clienteService }),
    vehiculoController:    new VehiculoController({ vehiculoService }),
    polizaController:      new PolizaController({ polizaService }),
    citaController:        new CitaController({ citaService }),
    tramiteController:     new TramiteController({ tramiteService }),
    pagoController:        new PagoController({ pagoService }),
    inspeccionController:  new InspeccionController({ inspeccionService }),
    cotizadorController:   new CotizadorController({ cotizadorService }),
    servicioController:    new ServicioController({ servicioRepository: servicioRepo }),
    statsController:       new StatsController({ statsService }),
  };

  return { db, repositories: {
    userRepo, clienteRepo, vehiculoRepo, polizaRepo, citaRepo,
    tramiteRepo, pagoRepo, inspeccionRepo, servicioRepo, statsRepo,
  }, controllers };
};
