import { Router } from 'express';
import {
  VehiculoCreateSchema,
  VehiculoUpdateSchema,
  SearchQuerySchema,
  IdParamSchema,
} from '../schemas/index.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';

export const vehiculoRoutes = ({ vehiculoController }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', validateQuery(SearchQuerySchema), vehiculoController.list);
  router.get('/:id', validateParams(IdParamSchema), vehiculoController.getById);
  router.post('/', validateBody(VehiculoCreateSchema), vehiculoController.create);
  router.put('/:id', validateParams(IdParamSchema), validateBody(VehiculoUpdateSchema), vehiculoController.update);
  router.delete('/:id', validateParams(IdParamSchema), vehiculoController.remove);
  return router;
};
