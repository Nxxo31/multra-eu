import { Router } from 'express';
import { PolizaCreateSchema, IdParamSchema } from '../schemas/index.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/async-handler.js';

export const polizaRoutes = ({ polizaController }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', asyncHandler(polizaController.list));
  router.post('/', validateBody(PolizaCreateSchema), asyncHandler(polizaController.create));
  router.delete('/:id', validateParams(IdParamSchema), asyncHandler(polizaController.remove));
  return router;
};
