import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),

  DB_TYPE: z.enum(['sqlite', 'mysql']).default('sqlite'),
  SQLITE_PATH: z.string().default('./data/multra.db'),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().default('multra_app'),
  DB_PASS: z.string().default(''),
  DB_NAME: z.string().default('multra'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener ≥32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),

  CORS_ORIGINS: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  ADMIN_USER: z.string().min(3).default('NicoDev2026'),
  ADMIN_PASS: z.string().min(6).default('Multra2026'),

  FRONTEND_DIR: z.string().default('../Multra-EU'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production') {
  if (parsed.data.JWT_SECRET.includes('REEMPLAZA') || parsed.data.JWT_SECRET.includes('dev_only')) {
    console.error('❌ JWT_SECRET inseguro en producción. Genera uno con crypto.randomBytes(64).toString("hex")');
    process.exit(1);
  }
  if (parsed.data.CORS_ORIGINS === '*') {
    console.error('❌ CORS_ORIGINS=* no permitido en producción');
    process.exit(1);
  }
  if (parsed.data.ADMIN_PASS === 'Multra2026') {
    console.error('❌ ADMIN_PASS es la contraseña por defecto. Cámbiala.');
    process.exit(1);
  }
  if (parsed.data.BCRYPT_ROUNDS < 12) {
    console.error('❌ BCRYPT_ROUNDS debe ser ≥12 en producción');
    process.exit(1);
  }
}

export const env = Object.freeze({
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  isDevelopment: parsed.data.NODE_ENV === 'development',
  corsOrigins: parsed.data.CORS_ORIGINS === '*'
    ? '*'
    : parsed.data.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean),
});
