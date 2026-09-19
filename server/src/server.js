import { createDatabase } from './db/connection.js';
import { initDatabase } from './db/migrations.js';
import { buildContainer } from './container.js';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const bootstrap = async () => {
  const db = await createDatabase();
  await initDatabase(db);

  const container = buildContainer(db);
  const app = createApp(container.controllers);

  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV, db: env.DB_TYPE },
      `Multra E.U. backend v5 escuchando en http://localhost:${env.PORT}`
    );
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, 'Cerrando servidor…');
    server.close(async () => {
      try {
        await db.close();
        logger.info('Servidor cerrado limpiamente');
        process.exit(0);
      } catch (e) {
        logger.error({ err: e.message }, 'Error cerrando DB');
        process.exit(1);
      }
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason: String(reason) }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (err) => {
    logger.fatal({ err: err.message, stack: err.stack }, 'Uncaught exception');
    process.exit(1);
  });
};

bootstrap().catch((e) => {
  logger.fatal({ err: e.message, stack: e.stack }, 'Error fatal en bootstrap');
  process.exit(1);
});
