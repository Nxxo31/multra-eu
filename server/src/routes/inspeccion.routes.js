import { Router } from 'express';
import { InspeccionCreateSchema, InspeccionQuerySchema } from '../schemas/index.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/async-handler.js';

export const inspeccionRoutes = ({ inspeccionController }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', validateQuery(InspeccionQuerySchema), asyncHandler(inspeccionController.list));
  router.post('/', validateBody(InspeccionCreateSchema), asyncHandler(inspeccionController.create));
  return router;
};
