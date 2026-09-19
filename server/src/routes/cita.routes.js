import { Router } from 'express';
import { CitaCreateSchema, CitaUpdateSchema, IdParamSchema } from '../schemas/index.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';

export const citaRoutes = ({ citaController }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', citaController.list);
  router.post('/', validateBody(CitaCreateSchema), citaController.create);
  router.patch('/:id', validateParams(IdParamSchema), validateBody(CitaUpdateSchema), citaController.update);
  return router;
};
