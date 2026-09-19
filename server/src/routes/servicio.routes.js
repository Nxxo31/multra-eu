import { Router } from 'express';

export const servicioRoutes = ({ servicioController }) => {
  const router = Router();
  router.get('/', servicioController.list);
  return router;
};
