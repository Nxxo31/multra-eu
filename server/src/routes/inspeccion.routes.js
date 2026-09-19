import { Router } from 'express';
import { InspeccionCreateSchema, InspeccionQuerySchema } from '../schemas/index.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';

export const inspeccionRoutes = ({ inspeccionController }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', validateQuery(InspeccionQuerySchema), inspeccionController.list);
  router.post('/', validateBody(InspeccionCreateSchema), inspeccionController.create);
  return router;
};
