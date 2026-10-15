# ARCHITECTURE — Multra E.U.

Documento técnico canónico: cómo está construido el sistema, por qué, y cómo se despliega.

> **Regla:** Este archivo es la vista actual del sistema. La fuente de verdad operacional es la combinación de `README.md` (setup local), `PRODUCTION.md` (runbook) y `PROJECT.md` (índice).

---

## 1. Resumen ejecutivo

Multra E.U. es un sistema de gestión integral para un CDA (Centro de Diagnóstico Automotor) y gestoría vehicular en Neiva, Huila (Colombia). Cubre el ciclo completo: prospecto → cotización → cita → inspección técnico-mecánica → pólizas (SOAT, todo riesgo) → trámites de tránsito → pagos → alertas de vencimiento → KPIs operativos.

Opera como SaaS B2B/B2C con canal directo a clientes finales vía landing + landing-cotizador, y panel administrativo autenticado para el equipo interno del CDA.

---

## 2. Stack

### Backend

| Capa | Tecnología | Justificación |
|---|---|---|
| Runtime | Node.js ≥20 ESM | LTS, soporte async/await limpio, mejor-sqlite3 nativo |
| Framework HTTP | Express 4 | Ecosistema maduro, minimalista, fácil de desplegar en serverless |
| Auth | JWT (`jsonwebtoken`) + bcryptjs | Stateless, compatible con serverless (no sesiones en memoria) |
| Validación | Zod | Schemas tipados en runtime, mismo módulo para env y DTOs |
| DB local dev | better-sqlite3 | Sync API, zero-config, ideal para `npm run dev` |
| DB prod | Neon Postgres (serverless) | Branch por entorno, PITR, free tier, conexión vía `@neondatabase/serverless` |
| DB alternativa | MySQL (self-host) | Soporte vía `mysql2` para clientes on-premise |
| Logging | pino + pino-http | JSON estructurado, mínimo overhead |
| Seguridad | helmet + express-rate-limit | Headers CSP/HSTS + rate-limit por IP (300 req/15min) y auth (10 req/15min) |
| Config | dotenv + Zod | Fail-fast en arranque si config inválida o insegura en prod |

### Frontend

| Capa | Tecnología | Justificación |
|---|---|---|
| Render | HTML estático servido por Vercel/Express | Sin build step, deploy como `public/**`, SEO-friendly |
| JS | Vanilla ES modules | 0 dependencias JS; la lógica del SPA es ~700 líneas |
| UI framework | Ninguno | El cliente objetivo no requiere SSR; performance > DX |
| Iconos | Bootstrap Icons + Iconify | Cero JS runtime para iconos SVG |
| Assets | PNG/WebP locales | Sin CDN externo; ~250 KB total por página |

### Infraestructura

| Componente | Servicio | Configuración |
|---|---|---|
| Hosting | Vercel | Proyecto `multra-eu`, runtime `@vercel/node` 30s, 1024MB |
| CDN/Edge | Vercel Edge Network | Cache estático `Cache-Control: public, max-age=...` |
| Static | `@vercel/static` | `public/**` con `handle: filesystem` |
| Serverless function | `api/index.js` | Express app, cache entre invocaciones para cold-start |
| DB prod | Neon | Branch `prod`, sslmode=require |
| Backups | Neon PITR + export periódico | Retención por plan |
| Monitoring | Externo (health check cada 30-60s) | `GET /api/health` |
| Alternativa deploy | Render (`render.yaml`) | Self-host con SQLite persistente en disco |

---

## 3. Arquitectura del backend (hexagonal manual)

```
┌────────────────────────────────────────────────────────────────┐
│                        HTTP Request                            │
└────────────────────────────────┬───────────────────────────────┘
                                 ▼
┌────────────────────────────────────────────────────────────────┐
│  Middleware (server/src/middleware/)                           │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐ │
│  │ helmet + CORS │ │ rate-limit   │ │ body parsing (100KB)   │ │
│  └──────────────┘ └──────────────┘ └────────────────────────┘ │
└────────────────────────────────┬───────────────────────────────┘
                                 ▼
┌────────────────────────────────────────────────────────────────┐
│  Routes (server/src/routes/*.routes.js)                        │
│  /api/auth, /api/clientes, /api/vehiculos, ...                │
│  ─ Auth middleware donde requiere                              │
└────────────────────────────────┬───────────────────────────────┘
                                 ▼
┌────────────────────────────────────────────────────────────────┐
│  Controllers (server/src/controllers/*)                        │
│  - Validan input con Zod                                       │
│  - Manejan HTTP: status, headers, formato JSON                 │
│  - Delegan lógica a services                                   │
└────────────────────────────────┬───────────────────────────────┘
                                 ▼
┌────────────────────────────────────────────────────────────────┐
│  Services (server/src/services/*)                              │
│  - Reglas de negocio (validación cruzada, cálculos)            │
│  - Transacciones entre repos (login, cotizar)                  │
│  - NO saben de HTTP ni de SQL                                  │
└────────────────────────────────┬───────────────────────────────┘
                                 ▼
┌────────────────────────────────────────────────────────────────┐
│  Repositories (server/src/repositories/*)                      │
│  - Queries SQL parametrizadas                                  │
│  - Normalizan keys (lowercase → camelCase para Postgres)       │
│  - Mapean filas → modelos de dominio                           │
└────────────────────────────────┬───────────────────────────────┘
                                 ▼
┌────────────────────────────────────────────────────────────────┐
│  DB Adapter (server/src/db/connection.js)                      │
│  - Interfaz unificada: getOne(), getAll(), execute()           │
│  - Drivers: SQLite (local) | Postgres (Neon prod) | MySQL       │
└────────────────────────────────────────────────────────────────┘
```

### Inyección de dependencias

`server/src/container.js` es el composition root único. Construye repos, services, controllers en orden topológico y los inyecta por constructor:

```js
const userRepo = new UserRepository(db);
const authService = new AuthService({ userRepository: userRepo });
const authController = new AuthController({ authService });
```

No hay service locator ni container mágico. Cualquier test puede construir el grafo parcial pasando mocks.

---

## 4. Modelo de datos

11 tablas relacionales (ver `server/src/db/schema.js` y `schema.postgres.js`):

```
users 1──────┐
             │ (creado por)
clientes ────┼──┐
             │  │
vehículos ───┼──┼──┐
             │  │  │
pólizas ─────┼──┼──┤
             │  │  │
citas ───────┼──┼──┤
             │  │  │
trámites ────┼──┼──┤
             │  │  │
pagos ───────┼──┼──┘
             │  │
inspecciones ┼──┘
             │
recordatorios (lead capture de landing)
servicios (catálogo de 20 ítems)
```

Cada tabla tiene `createdAt` (timestamp). Las migraciones se aplican idempotentemente en cada arranque (`initDatabase`).

### Catálogo de servicios (seed)

20 servicios predefinidos que cubren:
- Revisión técnico-mecánica (motos / autos <10 / ≥10 / públicos)
- SOAT (auto / moto / público)
- Pólizas todo riesgo
- Traspasos, matrículas, licencias
- Certificados, peritajes

Seeder en `server/src/db/seed-data.js` con `MULTRA_SEED_DEMO=1` también siembra 3 clientes demo (útil para QA local).

---

## 5. Seguridad

### Autenticación

- Login: `POST /api/auth/login` → JWT firmado con HS256 + `JWT_SECRET` (≥32 chars)
- TTL configurable (`JWT_EXPIRES_IN`, default 8h)
- Hash de passwords: bcryptjs con cost configurable (`BCRYPT_ROUNDS`, default 12)
- Frontend guarda JWT en `localStorage.multra_token` y lo envía en `Authorization: Bearer <token>`

### Autorización

- Un solo rol por ahora: `admin`
- Endpoint de admin verifican `req.user.role === 'admin'` vía middleware `authorize.js`
- Cuando se agreguen más roles, la ruta agrega `authorize('admin', 'operador')`

### Rate limiting

| Scope | Ventana | Max |
|---|---|---|
| General | 15 min | 300 req/IP |
| `/api/auth/*` | 15 min | 10 req/IP |

### Hardening en producción (validado en startup)

Si `NODE_ENV=production`, el bootstrap aborta si:
- `JWT_SECRET` contiene placeholder o `dev_only`
- `CORS_ORIGINS` es `*`
- `ADMIN_PASS` es la contraseña por defecto
- `BCRYPT_ROUNDS` < 12

(Ver `server/src/config/env.js:40-56`)

### Headers HTTP

`helmet` activa: HSTS, X-Frame-Options=SAMEORIGIN, X-Content-Type-Options=nosniff, Referrer-Policy=strict-origin-when-cross-origin. CSP deshabilitado temporalmente porque el frontend inline algunos assets.

---

## 6. Frontend (vanilla SPA)

Tres páginas HTML + un único bundle JS modular:

### `public/index.html` (landing pública, sin auth)

- Hero con CTA →Cotizador
- Sección servicios (cards)
- Sección proceso paso-a-paso
- Sección ubicación, horarios, contacto
- Chatbot flotante (preguntas hardcodeadas; sin LLM)
- Cotizador público embebido (`/api/cotizar/publico`)
- Form de captura de leads (`/api/recordatorios`)

### `public/login.html`

- Form usuario/contraseña
- Toggle mostrar contraseña
- Guarda `localStorage.multra_{token,user}` en login exitoso
- Redirige a `/dashboard.html`

### `public/dashboard.html` (panel admin, requiere auth)

SPA con 9 secciones:
- **Dashboard** (KPIs, próximas citas, vencimientos, resumen ingresos)
- **Vehículos** (CRUD + alertas SOAT/tecnomecánica)
- **Citas / Agenda** (calendario por técnico)
- **Inspección RTM** (formulario por vehículo + resultado)
- **Seguros / Pólizas** (CRUD + alertas vencimiento)
- **Cotizador** (multi-ítem, IVA, descuentos — espejo del landing)
- **Pagos** (registro por póliza/cita)
- **Trámites** (CRUD con gestor, estado, descripción)
- **Clientes** (CRUD con vehículos asociados)

Todas las llamadas API pasan por `js/core.js` que centraliza headers y manejo de errores.

---

## 7. API REST (resumen)

| Método | Ruta | Auth | Función |
|---|---|---|---|
| GET | `/api/health` | no | health + driver DB activo |
| POST | `/api/auth/login` | no | emite JWT |
| GET | `/api/auth/me` | sí | sesión actual |
| GET | `/api/servicios` | no | catálogo (público para landing) |
| GET/POST/PUT/DELETE | `/api/clientes` | sí | CRUD |
| GET/POST/PUT/DELETE | `/api/vehiculos` | sí | CRUD con alertas SOAT/tec |
| GET/POST/DELETE | `/api/polizas` | sí | CRUD |
| GET/POST/PATCH | `/api/citas` | sí | agenda |
| GET/POST/PATCH | `/api/tramites` | sí | CRUD con gestor |
| GET/POST | `/api/pagos` | sí | registro de pagos |
| GET/POST | `/api/inspections` | sí | inspecciones RTM |
| POST | `/api/cotizar` | sí | cotización autenticada |
| POST | `/api/cotizar/publico` | no | cotización landing (público) |
| POST | `/api/recordatorios` | no | lead capture |
| GET | `/api/recordatorios` | sí | listado admin |
| GET | `/api/recordatorios/count` | sí | contador admin |
| GET | `/api/stats` | sí | KPIs del panel |

Validación con Zod en `server/src/schemas/index.js`. Errores uniformes: `{ ok:false, code, error, meta? }`.

---

## 8. Despliegue

### Vercel (producción actual)

```
Browser
  ├─→ Vercel Edge Network
  │     ├─ Static: public/**   (cache 7d, immutable)
  │     └─ Function: api/index.js  (Node 20, max 30s, 1024MB)
  │           └─→ Express app (cached entre invocaciones)
  │                 └─→ Neon Postgres (sslmode=require)
```

`vercel.json` define:
- 2 builds: `@vercel/node` para `api/index.js` (incluye `server/**`) + `@vercel/static` para `public/**`
- Rutas: `/api/(.*)` → function; resto → filesystem fallback a `/public/$1`

### Local dev

```
npm run dev     # server/src/server.js con --watch
                # Express sirve /public + /api en :3001
                # SQLite en ./data/multra.db
```

### Render (alternativa)

`render.yaml` configura deploy self-hosted con disco persistente (1GB) para SQLite. Útil para clientes con datos sensibles que prefieran on-prem.

---

## 9. Observabilidad

- **Logging**: pino → stdout JSON. Vercel lo captura en el dashboard de functions.
- **Health**: `GET /api/health` responde `{ ok, service, version, env, db, time }`. Útil para ping cada 30-60s.
- **Métricas admin**: `GET /api/stats` con JWT entrega KPIs resumidos.
- **Errores**: middleware centralizado (`middleware/error-handler.js`) garantiza formato `{ ok:false, code, error }` en cualquier ruta no encontrada o error interno.

---

## 10. Decisiones arquitectónicas (ADRs implícitas)

| Decisión | Por qué |
|---|---|
| Express + vanilla JS en Vercel | El cliente objetivo no requiere SSR; serverless function minimiza ops y costo. Migrar a Next.js significaría rebuild completo sin valor funcional claro. |
| SQLite local + Postgres prod (mismo driver conceptual) | Permite dev offline + tests sin DB remota. El adapter `db/connection.js` aísla el cambio de driver. |
| JWT en localStorage | Trade-off consciente: stateless pero vulnerable a XSS. CSRF no aplica porque JWT va en Authorization header (no cookie). Mitigación: helmet CSP y validación de input. |
| Validación con Zod en runtime | Mismo schema reutilizado para env vars, DTOs y validación de input. DRY sin generar tipos que rompan el tooling. |
| DI manual (composition root) | Elimina la magia de frameworks (NestJS, etc.) y mantiene el código legible sin abstracciones adicionales. |
| Hexagonal manual (capas controller→service→repository) | Facilita testing (mock por capa) y migración futura de driver DB. |
| Frontend sin framework | El UI es fijo y el cliente no interactúa más allá de forms. Bundle JS <50KB. |
| Seed demo opt-in (`MULTRA_SEED_DEMO=1`) | Primer arranque limpio para producción; QA local puede poblar con un flag. |

---

## 11. Limitaciones conocidas

- Sin i18n. Mensajes en español. Extender a inglés/multilingüe requiere refactor de strings a `messages/<locale>.json` similar a otros proyectos del operador.
- Sin 2FA. Único factor: contraseña. Para producción con dato sensible se recomienda añadir TOTP.
- Sin soft-delete. Borrar cliente borra en cascada sus vehículos/pólizas/citas (decisión operativa, no técnica).
- Sin WebSockets/notificaciones push. Alertas se consultan al cargar el panel.
- Sin integración con proveedores de pagos (PSE, Nequi, Stripe). Pagos se registran manual con referencia.

---

## 12. Trazabilidad

- Repo: `github.com/Nxxo31/multra-eu`
- Producción: `https://multra-eu.vercel.app`
- Specs y memorias operativas: ver `PROJECT.md` sección Trazabilidad.
- Última act.: ver `git log` rama `main`.
