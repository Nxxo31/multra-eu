import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';

export const statsRoutes = ({ statsController }) => {
  const router = Router();
  router.use(authenticate);
  router.get('/', statsController.get);
  return router;
};
