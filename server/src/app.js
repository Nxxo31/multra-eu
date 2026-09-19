import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import pinoHttp from 'pino-http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { generalLimiter } from './middleware/rate-limit.js';

import { authRoutes } from './routes/auth.routes.js';
import { clienteRoutes } from './routes/cliente.routes.js';
import { vehiculoRoutes } from './routes/vehiculo.routes.js';
import { polizaRoutes } from './routes/poliza.routes.js';
import { citaRoutes } from './routes/cita.routes.js';
import { tramiteRoutes } from './routes/tramite.routes.js';
import { pagoRoutes } from './routes/pago.routes.js';
import { inspeccionRoutes } from './routes/inspeccion.routes.js';
import { cotizadorRoutes } from './routes/cotizador.routes.js';
import { servicioRoutes } from './routes/servicio.routes.js';
import { statsRoutes } from './routes/stats.routes.js';
import { healthRoutes } from './routes/health.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const buildCors = () => {
  if (env.corsOrigins === '*') {
    return cors({ origin: true, credentials: false, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] });
  }
  const allow = new Set(env.corsOrigins);
  return cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      cb(null, allow.has(origin));
    },
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });
};

export const createApp = (controllers) => {
  const app = express();

  if (env.isProduction) app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );
  app.use(buildCors());
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === '/api/health' },
    customLogLevel: (req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'debug';
    },
  }));
  app.use(generalLimiter);

  app.use('/api/health', healthRoutes({ healthController: controllers.healthController }));
  app.use('/api/auth',   authRoutes({ authController: controllers.authController }));
  app.use('/api/servicios', servicioRoutes({ servicioController: controllers.servicioController }));
  app.use('/api/clientes',  clienteRoutes({ clienteController: controllers.clienteController }));
  app.use('/api/vehiculos', vehiculoRoutes({ vehiculoController: controllers.vehiculoController }));
  app.use('/api/polizas',   polizaRoutes({ polizaController: controllers.polizaController }));
  app.use('/api/citas',     citaRoutes({ citaController: controllers.citaController }));
  app.use('/api/tramites',  tramiteRoutes({ tramiteController: controllers.tramiteController }));
  app.use('/api/pagos',     pagoRoutes({ pagoController: controllers.pagoController }));
  app.use('/api/inspections', inspeccionRoutes({ inspeccionController: controllers.inspeccionController }));
  app.use('/api/cotizar', cotizadorRoutes({ cotizadorController: controllers.cotizadorController }));
  app.use('/api/stats',     statsRoutes({ statsController: controllers.statsController }));

  const frontendPath = path.resolve(__dirname, '../../', env.FRONTEND_DIR);
  if (fs.existsSync(frontendPath)) {
    app.set('frontendDir', frontendPath);
    app.use(express.static(frontendPath, {
      index: false,
      maxAge: env.isProduction ? '7d' : 0,
      setHeaders: (res, filePath) => {
        if (/\.(?:js|css|png|jpg|jpeg|svg|webp|woff2?|ttf)$/.test(filePath)) {
          res.setHeader('X-Content-Type-Options', 'nosniff');
        }
      },
    }));
    app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
    logger.info({ frontendPath }, 'Sirviendo frontend estático');
  } else {
    logger.warn({ frontendPath }, 'FRONTEND_DIR no existe; solo API');
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
