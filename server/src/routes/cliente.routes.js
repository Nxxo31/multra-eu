import { Router } from 'express';
import {
  ClienteCreateSchema,
  ClienteUpdateSchema,
  SearchQuerySchema,
  IdParamSchema,
} from '../schemas/index.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/async-handler.js';

export const clienteRoutes = ({ clienteController }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', validateQuery(SearchQuerySchema), asyncHandler(clienteController.list));
  router.get('/:id', validateParams(IdParamSchema), asyncHandler(clienteController.getById));
  router.post('/', validateBody(ClienteCreateSchema), asyncHandler(clienteController.create));
  router.put('/:id', validateParams(IdParamSchema), validateBody(ClienteUpdateSchema), asyncHandler(clienteController.update));
  return router;
};
