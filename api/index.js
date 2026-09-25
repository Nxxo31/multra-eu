import { createDatabase } from '../server/src/db/connection.js';
import { initDatabase } from '../server/src/db/migrations.js';
import { buildContainer } from '../server/src/container.js';
import { createApp } from '../server/src/app.js';
import { logger } from '../server/src/utils/logger.js';

let appInstance = null;
let initPromise = null;

async function getApp() {
  if (appInstance) return appInstance;
  if (!initPromise) {
    initPromise = (async () => {
      logger.info('Vercel cold start: inicializando DB + container + Express');
      const db = await createDatabase();
      await initDatabase(db);
      const container = buildContainer(db);
      appInstance = createApp(container.controllers);
      logger.info('Vercel function app lista');
    })();
  }
  await initPromise;
  return appInstance;
}

export default async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (e) {
    logger.error({ err: e.message, stack: e.stack }, 'Vercel handler fatal');
    if (!res.headersSent) {
      res.status(500).json({ error: 'internal_error', message: e.message });
    }
  }
}