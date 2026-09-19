import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/async-handler.js';

export const statsRoutes = ({ statsController }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', asyncHandler(statsController.get));
  return router;
};
