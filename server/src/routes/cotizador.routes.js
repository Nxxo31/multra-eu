import { Router } from 'express';
import { CotizarSchema } from '../schemas/index.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { publicCotizarLimiter } from '../middleware/rate-limit.js';

export const cotizadorRoutes = ({ cotizadorController }) => {
  const router = Router();
  router.post('/', authenticate, validateBody(CotizarSchema), cotizadorController.cotizar);
  router.post(
    '/publico',
    publicCotizarLimiter,
    validateBody(CotizarSchema),
    cotizadorController.cotizar
  );
  return router;
};
