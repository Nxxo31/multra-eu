import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';

export const healthRoutes = ({ healthController }) => {
  const router = Router();
  router.get('/', asyncHandler(healthController.check));
  return router;
};
