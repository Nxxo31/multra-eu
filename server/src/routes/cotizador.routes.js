import { Router } from 'express';
import { CotizarSchema } from '../schemas/index.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { publicCotizarLimiter } from '../middleware/rate-limit.js';
import { asyncHandler } from '../utils/async-handler.js';

export const cotizadorRoutes = ({ cotizadorController }) => {
  const router = Router();
  router.post('/', authenticate, validateBody(CotizarSchema), asyncHandler(cotizadorController.cotizar));
  router.post(
    '/publico',
    publicCotizarLimiter,
    validateBody(CotizarSchema),
    asyncHandler(cotizadorController.cotizar)
  );
  return router;
};
