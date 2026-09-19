import { Router } from 'express';
import { PagoCreateSchema } from '../schemas/index.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';

export const pagoRoutes = ({ pagoController }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', pagoController.list);
  router.post('/', validateBody(PagoCreateSchema), pagoController.create);
  return router;
};
