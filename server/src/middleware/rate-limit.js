import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { RateLimitError } from '../utils/errors.js';

const buildHandler = () => (_req, _res, next) => next(new RateLimitError('Demasiadas solicitudes'));

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: buildHandler(),
  skip: (req) => req.path === '/api/health',
});

export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: buildHandler(),
  skipSuccessfulRequests: true,
});

export const publicCotizarLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: Math.max(20, env.AUTH_RATE_LIMIT_MAX * 2),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: buildHandler(),
});

export const publicRecordatorioLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: buildHandler(),
});
