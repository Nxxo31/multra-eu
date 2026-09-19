import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';

export const servicioRoutes = ({ servicioController }) => {
  const router = Router();
  router.get('/', asyncHandler(servicioController.list));
  return router;
};
