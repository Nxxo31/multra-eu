import { Router } from 'express';
import { CitaCreateSchema, CitaUpdateSchema, IdParamSchema } from '../schemas/index.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/async-handler.js';

export const citaRoutes = ({ citaController }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', asyncHandler(citaController.list));
  router.post('/', validateBody(CitaCreateSchema), asyncHandler(citaController.create));
  router.patch('/:id', validateParams(IdParamSchema), validateBody(CitaUpdateSchema), asyncHandler(citaController.update));
  return router;
};
