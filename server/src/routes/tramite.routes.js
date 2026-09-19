import { Router } from 'express';
import { TramiteCreateSchema, TramiteUpdateSchema, IdParamSchema } from '../schemas/index.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';

export const tramiteRoutes = ({ tramiteController }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', tramiteController.list);
  router.post('/', validateBody(TramiteCreateSchema), tramiteController.create);
  router.patch('/:id', validateParams(IdParamSchema), validateBody(TramiteUpdateSchema), tramiteController.update);
  return router;
};
