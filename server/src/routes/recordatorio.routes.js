import { Router } from 'express';
import { RecordatorioCreateSchema } from '../schemas/index.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { publicRecordatorioLimiter } from '../middleware/rate-limit.js';
import { authenticate } from '../middleware/authenticate.js';

export const recordatorioRoutes = ({ recordatorioController }) => {
  const router = Router();

  router.post(
    '/',
    publicRecordatorioLimiter,
    validateBody(RecordatorioCreateSchema),
    asyncHandler(recordatorioController.create)
  );

  router.get(
    '/',
    authenticate,
    asyncHandler(recordatorioController.list)
  );

  router.get(
    '/count',
    authenticate,
    asyncHandler(recordatorioController.count)
  );

  return router;
};