# Multra E.U.

Sistema de gestión para CDA y gestoría vehicular en Neiva, Huila (Colombia).

**Stack**: Node.js ≥20 · Express · SQLite (dev) / MySQL (prod) · JWT · Vanilla JS frontend

---

## Estructura

```
multra-eu/
├── Multra-EU/          # Frontend estático (HTML + CSS + JS vanilla)
│   ├── index.html      # Landing pública (cotizador + servicios)
│   ├── login.html      # Login del panel admin
│   ├── dashboard.html  # Panel admin (clientes, vehículos, pólizas, citas, inspecciones, pagos)
│   ├── css/
│   └── js/
├── server/             # Backend Node + Express
│   ├── src/
│   │   ├── server.js   # Entry point
│   │   ├── app.js
│   │   ├── config/env.js
│   │   ├── db/         # Schema, migraciones, seed
│   │   ├── routes/     # (legacy, ahora en controllers)
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middleware/
│   │   └── utils/
│   ├── data/           # SQLite local (gitignored)
│   ├── .env            # Secrets locales (gitignored)
│   ├── .env.example    # Plantilla de variables
│   └── package.json
├── screenshots/        # Capturas de referencia (no se usan en runtime)
├── .vscode/            # Configuración de debug
└── .gitignore          # Cubre todo el proyecto
```

---

## Setup local (primer arranque)

```powershell
cd C:\Users\sebas\Desktop\proyectos\multra-eu\server

# 1. Instalar dependencias
npm install

# 2. Crear .env desde la plantilla (si no existe ya)
Copy-Item .env.example .env
# Editar .env y rellenar JWT_SECRET, ADMIN_USER, ADMIN_PASS

# 3. Generar secrets nuevos
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('ADMIN_PASS=' + require('crypto').randomBytes(20).toString('base64url'))"

# 4. Arrancar en modo desarrollo (auto-restart con --watch)
npm run dev

# El server queda en http://localhost:3001
```

Al primer arranque:
- Se crea `data/multra.db` con el schema completo.
- Se siembra el catálogo de **20 servicios** (precios regulados Colombia 2026).
- Se crea el **usuario admin** con las credenciales de `.env` (`ADMIN_USER` / `ADMIN_PASS`).
- **NO** se siembran clientes/vehículos/pólizas demo (la DB queda limpia para empezar a operar).

---

## Seed demo opt-in

Si querés datos de prueba (Carlos/Laura/Andrés con sus vehículos, pólizas, citas, etc.), activá el flag:

```powershell
# Antes de npm run dev
$env:MULTRA_SEED_DEMO = '1'
npm run dev
```

Para desactivar de nuevo: `Remove-Item Env:MULTRA_SEED_DEMO` o reiniciar PowerShell.

> ⚠ El flag solo se respeta si la tabla `clientes` está vacía. Si ya tenés clientes reales, el seed no se vuelve a ejecutar aunque pongas `MULTRA_SEED_DEMO=1`.

---

## Credenciales (rotadas 2026-09-19)

```
ADMIN_USER=multra_admin
ADMIN_PASS=2cLyT8JZaqpHfMSSS7KC
```

> Guardar en password manager. **NO** commitear `.env` al repo.

---

## Variables de entorno

Ver [`server/.env.example`](server/.env.example) para la lista completa con comentarios.

| Variable | Descripción | Default |
|---|---|---|
| `NODE_ENV` | development / production / test | development |
| `PORT` | Puerto HTTP | 3001 |
| `DB_TYPE` | sqlite o mysql | sqlite |
| `SQLITE_PATH` | Ruta al archivo .db | ./data/multra.db |
| `JWT_SECRET` | **REQUERIDO** ≥32 chars hex | — |
| `JWT_EXPIRES_IN` | Tiempo de vida del JWT | 8h |
| `BCRYPT_ROUNDS` | Cost factor del hash | 12 |
| `CORS_ORIGINS` | Lista separada por coma, o `*` (solo dev) | http://localhost:3001,http://localhost:5500,http://127.0.0.1:5500 |
| `ADMIN_USER` | Usuario admin seed | multra_admin |
| `ADMIN_PASS` | Password admin seed | (rotado) |
| `MULTRA_SEED_DEMO` | `1` para sembrar datos demo, vacío/nulo para DB limpia | (vacío) |
| `FRONTEND_DIR` | Ruta al frontend estático | ../Multra-EU |

---

## Reglas de producción (`NODE_ENV=production`)

El server **se niega a arrancar** si detecta configuraciones inseguras:

- `JWT_SECRET` contiene `REEMPLAZA` o `dev_only`
- `CORS_ORIGINS=*`
- `ADMIN_PASS=Multra2026` (default viejo)
- `BCRYPT_ROUNDS < 12`

---

## Endpoints principales

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/health` | no | Estado del servicio |
| POST | `/api/auth/login` | no | Login → JWT |
| GET | `/api/auth/me` | sí | Sesión actual |
| GET | `/api/servicios` | no | Catálogo (público) |
| GET/POST/PUT/DELETE | `/api/clientes` | sí | CRUD clientes |
| GET/POST/PUT/DELETE | `/api/vehiculos` | sí | CRUD vehículos |
| GET/POST/DELETE | `/api/polizas` | sí | Pólizas SOAT/todo riesgo |
| GET/POST/PATCH | `/api/citas` | sí | Agenda |
| GET/POST/PATCH | `/api/tramites` | sí | Trámites (traspasos, licencias) |
| GET/POST | `/api/pagos` | sí | Pagos |
| GET/POST | `/api/inspections` | sí | Inspecciones RTM (aprueba → +1 año vencimiento) |
| POST | `/api/cotizar` | sí | Cotizar con descuento |
| POST | `/api/cotizar/publico` | no | Cotizar sin auth (rate-limited) |
| GET | `/api/stats` | sí | KPIs dashboard |

---

## Próximos pasos (backlog)

- NIT real en footer de `index.html` (placeholder `900.XXX.XXX-X`)
- Self-signup público de clientes
- Deploy en Render (requiere este repo en GitHub)
- Migrar `admin@multra.com.co` a email real del operador
