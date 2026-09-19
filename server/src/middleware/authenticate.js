import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';

export const authenticate = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return next(new UnauthorizedError('Token requerido'));

  try {
    const payload = jwt.verify(m[1], env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = { id: payload.sub, username: payload.username, role: payload.role };
    next();
  } catch {
    next(new UnauthorizedError('Token inválido o expirado'));
  }
};
