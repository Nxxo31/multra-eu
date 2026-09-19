import { env } from '../config/env.js';

export class HealthService {
  check() {
    return {
      ok: true,
      service: 'multra-eu-backend',
      version: '5.0.0',
      env: env.NODE_ENV,
      db: env.DB_TYPE,
      time: new Date().toISOString(),
    };
  }
}
