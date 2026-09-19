import { Router } from 'express';
import { PolizaCreateSchema, IdParamSchema } from '../schemas/index.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';

export const polizaRoutes = ({ polizaController }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', polizaController.list);
  router.post('/', validateBody(PolizaCreateSchema), polizaController.create);
  router.delete('/:id', validateParams(IdParamSchema), polizaController.remove);
  return router;
};
