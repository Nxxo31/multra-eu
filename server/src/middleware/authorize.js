import { ForbiddenError } from '../utils/errors.js';

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new ForbiddenError());
  if (roles.length && !roles.includes(req.user.role)) {
    return next(new ForbiddenError('Rol no autorizado'));
  }
  next();
};
