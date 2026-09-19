import { Router } from 'express';

export const healthRoutes = ({ healthController }) => {
  const router = Router();
  router.get('/', healthController.check);
  return router;
};
