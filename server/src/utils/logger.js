import pino from 'pino';
import { env } from '../config/env.js';

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'password',
  'passwordHash',
  'token',
  'jwt',
  'secret',
];

export const logger = pino({
  level: env.isDevelopment ? 'debug' : 'info',
  redact: { paths: redactPaths, censor: '[REDACTED]' },
  transport: env.isDevelopment
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' } }
    : undefined,
});
