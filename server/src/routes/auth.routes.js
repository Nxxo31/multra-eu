import { Router } from 'express';
import { LoginSchema } from '../schemas/index.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/rate-limit.js';

export const authRoutes = ({ authController }) => {
  const router = Router();
  router.post('/login', authLimiter, validateBody(LoginSchema), authController.login);
  router.get('/me', authenticate, authController.me);
  return router;
};
