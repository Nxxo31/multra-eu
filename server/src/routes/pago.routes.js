import { Router } from 'express';
import { PagoCreateSchema } from '../schemas/index.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/async-handler.js';

export const pagoRoutes = ({ pagoController }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', asyncHandler(pagoController.list));
  router.post('/', validateBody(PagoCreateSchema), asyncHandler(pagoController.create));
  return router;
};
