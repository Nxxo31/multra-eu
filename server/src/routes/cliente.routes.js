import { Router } from 'express';
import {
  ClienteCreateSchema,
  ClienteUpdateSchema,
  SearchQuerySchema,
  IdParamSchema,
} from '../schemas/index.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';

export const clienteRoutes = ({ clienteController }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', validateQuery(SearchQuerySchema), clienteController.list);
  router.get('/:id', validateParams(IdParamSchema), clienteController.getById);
  router.post('/', validateBody(ClienteCreateSchema), clienteController.create);
  router.put('/:id', validateParams(IdParamSchema), validateBody(ClienteUpdateSchema), clienteController.update);
  return router;
};
