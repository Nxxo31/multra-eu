# Multra E.U.

Sistema de gestión para CDA y gestoría vehicular en Neiva, Huila (Colombia).

**Stack actual:** Node.js ≥20 · Express · SQLite (dev) · Neon Postgres (producción Vercel) · MySQL opcional self-host · JWT · Zod · frontend vanilla en `public/`.

**Estado al 2026-09-30:** producción viva en `https://multra-eu.vercel.app` con API serverless en Vercel y base productiva en Neon. El branch local de trabajo es `vercel-deploy`; hay hotfixes productivos pendientes de commit/push.

---

## 1. Estructura actual

```text
multra-eu/
├── api/
│   └── index.js            # Entry serverless Vercel: cold start + Express app
├── public/                 # Frontend estático servido por Vercel en prod
│   ├── index.html          # Landing pública
│   ├── login.html          # Login admin
│   ├── dashboard.html      # Panel admin
│   ├── css/                # base/login/landing/panel
│   ├── js/                 # core/landing/panel
│   └── assets/img/         # logo, robot, etc.
├── server/
│   ├── src/
│   │   ├── app.js          # Express, seguridad, rutas API, static local
│   │   ├── config/env.js   # Validación Zod de env vars
│   │   ├── db/             # SQLite/MySQL/Postgres adapters + schema + seed
│   │   ├── routes/         # Rutas REST /api/*
│   │   ├── controllers/    # HTTP controllers
│   │   ├── services/       # Reglas de negocio
│   │   ├── repositories/   # SQL queries
│   │   ├── middleware/     # auth, rate-limit, validation, errors
│   │   └── utils/
│   ├── scripts/            # Utilidades operativas
│   ├── test/               # Tests node:test
│   ├── .env.example        # Plantilla de entorno
│   └── package.json        # Backend local/dev
├── package.json            # Dependencias raíz para el build Vercel
├── vercel.json             # API serverless + static public/
├── render.yaml             # Alternativa de deployment (Render + SQLite persistente)
├── README.md               # Este archivo
└── PRODUCTION.md           # Runbook de producción
```

---

## 2. Setup local

```powershell
cd C:\Users\sebas\Desktop\proyectos\multra-eu\server
npm install
Copy-Item .env.example .env
# Editar .env con JWT_SECRET, ADMIN_USER, ADMIN_PASS
npm run dev
```

Server local: `http://localhost:3001`.

Primer arranque en SQLite:
- crea `server/data/multra.db`
- aplica schema
- siembra catálogo de 20 servicios
- crea admin si `users` está vacío
- no carga datos demo salvo `MULTRA_SEED_DEMO=1`

En local, `FRONTEND_DIR=public` hace que Express sirva `./public`. En Vercel, el frontend estático lo sirve la plataforma y Express solo responde `/api/*`.

---

## 3. Variables de entorno

La fuente canónica de nombres y defaults es `server/.env.example`.

| Variable | Uso | Default / nota |
|---|---|---|
| `NODE_ENV` | `development`, `production`, `test` | `development` |
| `PORT` | Puerto local | `3001` |
| `DB_TYPE` | `sqlite` / `postgres` / `mysql` | `sqlite` |
| `SQLITE_PATH` | Ruta SQLite | `./data/multra.db` |
| `DATABASE_URL` | Postgres/Neon | requerida si `DB_TYPE=postgres` |
| `JWT_SECRET` | Firma JWT | **requerido ≥32 chars** |
| `JWT_EXPIRES_IN` | TTL JWT | `8h` |
| `BCRYPT_ROUNDS` | Coste hash admin | `12` |
| `CORS_ORIGINS` | Orígenes permitidos | prod: dominio exacto |
| `ADMIN_USER` | Admin seed | `multra_admin` recomendado |
| `ADMIN_PASS` | Admin seed | rotada, fuera del repo |
| `FRONTEND_DIR` | Frontend local | `public` |
| `MULTRA_SEED_DEMO` | Seed demo opt-in | `0` |

Reglas activas en producción:
- rechaza `JWT_SECRET` placeholder o `dev_only`
- rechaza `CORS_ORIGINS=*`
- rechaza `ADMIN_PASS` por defecto viejo
- exige `BCRYPT_ROUNDS >= 12`

---

## 4. API principal

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/health` | no | health + driver activo |
| POST | `/api/auth/login` | no | login admin |
| GET | `/api/auth/me` | sí | sesión actual |
| GET | `/api/servicios` | no | catálogo público |
| GET/POST/PUT/DELETE | `/api/clientes` | sí | CRUD clientes |
| GET/POST/PUT/DELETE | `/api/vehiculos` | sí | CRUD vehículos |
| GET/POST/DELETE | `/api/polizas` | sí | pólizas |
| GET/POST/PATCH | `/api/citas` | sí | agenda |
| GET/POST/PATCH | `/api/tramites` | sí | trámites |
| GET/POST | `/api/pagos` | sí | pagos |
| GET/POST | `/api/inspections` | sí | inspecciones |
| POST | `/api/cotizar` | sí | cotización autenticada |
| POST | `/api/cotizar/publico` | no | cotización landing |
| POST | `/api/recordatorios` | no | lead capture |
| GET | `/api/recordatorios` | sí | listado admin |
| GET | `/api/recordatorios/count` | sí | contador admin |
| GET | `/api/stats` | sí | KPIs panel |

---

## 5. Producción actual

### URL

- App: `https://multra-eu.vercel.app`
- Health: `https://multra-eu.vercel.app/api/health`

### Infraestructura

- Vercel proyecto: `multra-eu`
- Neon DB: branch `prod`
- Runtime API: `api/index.js` con `@vercel/node`
- Static: `public/**` con `@vercel/static`

### Flujo vigente

El deploy actual fue hecho por CLI con `vercel --prod --yes`. El 2026-09-30 se persistieron los hotfixes y documentación en Git: `6fa877e` quedó pusheado a `vercel-deploy` y mergeado/fast-forward a `main`.

Pendiente para auto-deploy: conectar Vercel↔GitHub. El intento de `vercel git connect --yes` falló porque la cuenta Vercel todavía no tiene una **GitHub Login Connection** habilitada; hay que autorizarla en Vercel y reintentar.

---

## 6. Bugs críticos persistidos en Git

- `vercel.json`: static 404 corregido con `@vercel/static` + `handle: filesystem`.
- `package.json` raíz: dependencias disponibles para el entry `api/index.js`.
- `server/src/db/connection.js`: normalización de keys lowercase→camelCase para Postgres/Neon.
- `server/src/repositories/stats.repository.js`: `substr(fecha, 1, 7)` compatible con SQLite y Postgres.
- `.gitignore`: `.vercel` y temporales fuera del repo.

Estos cambios están alineados con el deploy productivo actual y ya quedaron persistidos en Git en `6fa877e`.

---

## 7. Verificación

Último smoke productivo registrado:
- `/` 200
- `/login.html` 200
- `/api/health` → `postgres` / `production`
- login admin OK
- `/api/stats` OK
- `/api/servicios` → 20 servicios
- `/api/clientes` → 0, DB limpia intencional
- `/api/cotizar/publico` OK
- cosmetico pendiente: `favicon.ico` 404

Tests locales documentados:
```powershell
cd server
node --test "test/*.test.js"
```

Nota operativa: en algunos entornos Node 24 el script `npm test` falla por resolución de directorio; usar el comando `node --test` explícito.

---

## 8. Pendientes reales

1. Autorizar GitHub Login Connection en Vercel y reintentar `vercel git connect`.
2. NIT real en `public/index.html`.
3. `favicon.ico`.

---

## 9. Documentación operativa

Ver [PRODUCTION.md](./PRODUCTION.md) para runbook completo: secretos, DB, deploy, checklist de release, operación y rollback.
