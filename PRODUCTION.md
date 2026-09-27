# Multra E.U. — Guía de Producción

Documento para dejar el sistema **listo para uso real** (sin datos demo, sin secretos en texto claro, sin configuración por defecto insegura).

---

## 1. Requisitos del entorno

| Variable | Descripción | Default | Notas |
|---|---|---|---|
| `NODE_ENV` | `production` activa los chequeos de seguridad | `development` | **obligatorio** |
| `PORT` | Puerto HTTP | `3001` | Vercel/Render lo sobreescriben |
| `DB_TYPE` | `sqlite` (dev) · `postgres` (Neon) · `mysql` (self‑host) | `sqlite` | Neon serverless recomendado |
| `SQLITE_PATH` | Ruta al archivo SQLite | `./data/multra.db` | Solo si `DB_TYPE=sqlite` |
| `DATABASE_URL` | Cadena de conexión Postgres | — | Solo si `DB_TYPE=postgres` |
| `JWT_SECRET` | Secreto para firmar JWT | — | **≥32 chars hex/base64**, rotar periódicamente |
| `JWT_EXPIRES_IN` | Tiempo de vida del JWT | `8h` | |
| `BCRYPT_ROUNDS` | Coste del hash bcrypt | `12` | **mínimo 12 en producción** |
| `CORS_ORIGINS` | Orígenes separados por coma | `*` | **NO** usar `*` en producción |
| `ADMIN_USER` | Usuario admin semilla | `multra_admin` | Cambiar antes de sembrar |
| `ADMIN_PASS` | Password admin semilla | — | **Cambiar**. Mínimo 16 chars |
| `FRONTEND_DIR` | Carpeta del frontend estático | `../../public` | |
| `MULTRA_SEED_DEMO` | `1` para seed demo | _(vacío)_ | **Dejar vacío en producción** |

> **El servidor se niega a arrancar** en `NODE_ENV=production` si detecta:
> - `JWT_SECRET` con placeholder (`REEMPLAZA`, `dev_only`)
> - `CORS_ORIGINS=*`
> - `ADMIN_PASS` igual al default viejo
> - `BCRYPT_ROUNDS < 12`

---

## 2. Generar secretos

```powershell
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('ADMIN_PASS=' + require('crypto').randomBytes(20).toString('base64url'))"
```

Guarda los valores en el secret manager del proveedor (Vercel/Render env vars, GitHub Actions secrets, etc.). **Nunca** los pongas en el repo.

---

## 3. Configurar la base de datos

### Opción A — Neon serverless (recomendado)
1. Crear proyecto en https://neon.tech (free o scale).
2. Copiar la *connection string* y guardarla en `DATABASE_URL`.
3. La primera vez, el server ejecuta `runMigrations()` y siembra admin + 20 servicios.

### Opción B — SQLite
1. No requiere config adicional.
2. La DB vive en `server/data/multra.db`. **Respaldar periódicamente**.

### Opción C — MySQL
1. Provisionar MySQL 8+.
2. Definir `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`.

---

## 4. Primer arranque

```powershell
cd server
npm ci
# Las env vars deben estar definidas (User‑level o .env local — NO commitear)
npm start
```

En el primer arranque:
- Aplica el schema completo.
- Siembra el catálogo de **20 servicios** (precios regulados Colombia 2026).
- Crea el usuario admin con `ADMIN_USER`/`ADMIN_PASS` (solo si la tabla `users` está vacía).
- No crea datos demo (`MULTRA_SEED_DEMO` vacío por defecto).

---

## 5. Limpieza post‑desarrollo

Antes de exponer el sistema:

| Acción | Cómo |
|---|---|
| Borrar datos de prueba (clientes, vehículos, citas, recordatorios…) | `node server/scripts/purge-test-data.cjs server/data/multra.db` |
| Rotar credenciales admin | Cambiar `ADMIN_USER`/`ADMIN_PASS`, ejecutar seed (o UPDATE directo) |
| Rotar `JWT_SECRET` | Cambiar env var + reiniciar (todos los JWT quedan invalidados) |
| Reemplazar NIT placeholder | Editar `public/index.html` línea del footer (`<p class="l-footer__nit">`) |
| Verificar `CORS_ORIGINS` | Apuntar al dominio real (ej. `https://multra-eu.com.co`) |
| Verificar CSP (recomendado) | Añadir `helmet({contentSecurityPolicy:{…}})` en `server/src/app.js` |

> El script `purge-test-data.cjs` borra **todas** las filas excepto `users` y `servicios`. Es idempotente.

---

## 6. Despliegue

### Vercel (frontend + API)
- `render.yaml` listo (o equivalente). Crear proyecto, conectar repo `Nxxo31/multra-eu`.
- Variables de entorno: `NODE_ENV=production`, `DB_TYPE=postgres`, `DATABASE_URL`, `JWT_SECRET`, `ADMIN_USER`, `ADMIN_PASS`, `CORS_ORIGINS=https://<dominio>`.
- Build command: `npm --prefix server ci && npm --prefix server run build` (o simplemente `npm start`).
- Output: server Node sirviendo también el frontend estático.

### Render Blueprint
1. `render.yaml` ya está listo en el repo.
2. Crear API key en https://render.com/account/api-keys.
3. Render Dashboard → Blueprints → New → seleccionar repo.
4. Render detecta el YAML y aprovisiona Web Service + disco persistente + genera secrets.

### Docker (alternativa)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY . .
WORKDIR /app/server
ENV NODE_ENV=production PORT=3001
EXPOSE 3001
CMD ["node", "src/server.js"]
```

---

## 7. Checklist de release

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` ≥32 chars, sin placeholders
- [ ] `ADMIN_PASS` rotado
- [ ] `CORS_ORIGINS` apunta al dominio real
- [ ] `BCRYPT_ROUNDS` ≥12
- [ ] DB limpia (0 clientes, 0 vehículos, 0 recordatorios)
- [ ] NIT del footer confirmado y reemplazado
- [ ] `JWT_SECRET` y `DATABASE_URL` fuera del repo
- [ ] `npm test` → 25/25 verde
- [ ] `npm run lint` → 0 errores
- [ ] `purge-test-data.cjs` ejecutado
- [ ] HTTPS habilitado (Vercel/Render lo hacen por defecto)
- [ ] Monitoreo básico: `/api/health` con uptime externo (UptimeRobot, Better Stack)
- [ ] Backup de la DB programado (Neon PITR 7d incluido en free tier)

---

## 8. Operación

- **Logs**: pino-http con nivel `info`. Redirigir a stdout en producción.
- **Health**: `GET /api/health` retorna `{ status: 'ok', ... }`. Configurar ping cada 30 s.
- **Métricas**: ver `GET /api/stats` (requiere token).
- **Backups**: Neon PITR 7d. Para SQLite, `cron` + `sqlite3 .backup`.
- **Rotación de JWT**: cada 90 días (cambiar `JWT_SECRET` y reiniciar).

---

## 9. Soporte

- **Repo**: https://github.com/Nxxo31/multra-eu
- **Issues**: https://github.com/Nxxo31/multra-eu/issues
- **Operador**: sebas (dark‑memory operativa)