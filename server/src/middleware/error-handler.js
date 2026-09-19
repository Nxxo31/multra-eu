import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Datos inválidos',
      code: 'VALIDATION_ERROR',
      details: err.flatten().fieldErrors,
    });
  }

  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(Object.keys(err.meta || {}).length ? { meta: err.meta } : {}),
    });
  }

  logger.error(
    { err: err.message, stack: err.stack, url: req.url, method: req.method },
    'Error no controlado'
  );

  return res.status(500).json({
    error: env.isProduction ? 'Error interno del servidor' : err.message,
    code: 'INTERNAL_ERROR',
  });
};

export const notFoundHandler = (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint no encontrado', code: 'NOT_FOUND' });
  }
  return res.status(404).sendFile('index.html', { root: req.app.get('frontendDir') });
};
