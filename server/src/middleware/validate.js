import { ValidationError } from '../utils/errors.js';

export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.flatten();
    return next(new ValidationError('Datos inválidos', details.fieldErrors));
  }
  req.body = result.data;
  next();
};

export const validateQuery = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const details = result.error.flatten();
    return next(new ValidationError('Query inválida', details.fieldErrors));
  }
  req.validatedQuery = result.data;
  next();
};

export const validateParams = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    const details = result.error.flatten();
    return next(new ValidationError('Parámetros inválidos', details.fieldErrors));
  }
  req.params = result.data;
  next();
};
