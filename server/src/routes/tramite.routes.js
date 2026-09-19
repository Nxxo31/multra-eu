import { Router } from 'express';
import { TramiteCreateSchema, TramiteUpdateSchema, IdParamSchema } from '../schemas/index.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/async-handler.js';

export const tramiteRoutes = ({ tramiteController }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', asyncHandler(tramiteController.list));
  router.post('/', validateBody(TramiteCreateSchema), asyncHandler(tramiteController.create));
  router.patch('/:id', validateParams(IdParamSchema), validateBody(TramiteUpdateSchema), asyncHandler(tramiteController.update));
  return router;
};
