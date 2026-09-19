import { Router } from 'express';
import {
  VehiculoCreateSchema,
  VehiculoUpdateSchema,
  SearchQuerySchema,
  IdParamSchema,
} from '../schemas/index.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/async-handler.js';

export const vehiculoRoutes = ({ vehiculoController }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', validateQuery(SearchQuerySchema), asyncHandler(vehiculoController.list));
  router.get('/:id', validateParams(IdParamSchema), asyncHandler(vehiculoController.getById));
  router.post('/', validateBody(VehiculoCreateSchema), asyncHandler(vehiculoController.create));
  router.put('/:id', validateParams(IdParamSchema), validateBody(VehiculoUpdateSchema), asyncHandler(vehiculoController.update));
  router.delete('/:id', validateParams(IdParamSchema), asyncHandler(vehiculoController.remove));
  return router;
};
