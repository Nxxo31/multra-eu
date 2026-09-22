# Multra E.U.

Sistema de gestión para CDA y gestoría vehicular en Neiva, Huila (Colombia).

**Stack**: Node.js ≥20 · Express · SQLite (dev) / MySQL (prod) · JWT · Vanilla JS frontend · Phosphor Icons (vía Iconify) · Bootstrap Icons

---

## Estructura

```
multra-eu/
├── Multra-EU/          # Frontend estático (HTML + CSS + JS vanilla)
│   ├── index.html      # Landing pública con 12 secciones
│   ├── login.html      # Login del panel admin
│   ├── dashboard.html  # Panel admin (post-login)
│   ├── css/landing.css # Estilos landing (62 KB, sin dependencias)
│   ├── css/base.css    # Variables CSS + helpers compartidos
│   ├── css/login.css   # Estilos login
│   ├── css/panel.css   # Estilos panel admin
│   └── js/landing.js   # Lógica landing (servicios, cotizador, paquetes, accordion)
├── server/             # Backend Node + Express
│   ├── src/
│   │   ├── db/         # Schema, migrations, seed (admin + 20 servicios)
│   │   ├── routes/     # 12 endpoints REST
│   │   ├── controllers/# Lógica HTTP (asyncHandler wrapped)
│   │   ├── services/   # Lógica de negocio
│   │   ├── repositories/# SQL queries encapsuladas
│   │   ├── middleware/ # auth, rate-limit, error-handler, validate
│   │   ├── schemas/    # Zod validation (LoginSchema, RecordatorioCreateSchema, etc.)
│   │   └── utils/      # asyncHandler (clave — fix unhandled rejection)
│   ├── data/multra.db  # SQLite local (gitignored)
│   ├── .env.example    # Plantilla con todas las vars
│   └── package.json
├── screenshots/        # Mockups PNG (no se usan en runtime)
├── .vscode/            # launch.json para debug
├── .gitignore          # Cubre node_modules, data/, .env, *.db
└── README.md           # Este archivo
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

# 4. Arrancar en modo desarrollo
npm run dev

# El server queda en http://localhost:3001
```

Al primer arranque:
- Se crea `data/multra.db` con el schema completo
- Se siembra el catálogo de **20 servicios** (precios regulados Colombia 2026)
- Se crea el **usuario admin** con las credenciales de `.env`
- DB limpia (sin datos demo) para operar en producción

---

## Credenciales (rotadas 2026-09-19)

```
ADMIN_USER=multra_admin
ADMIN_PASS=2cLyT8JZaqpHfMSSS7KC
```

Guardar en password manager. **NO** commitear `.env` al repo.

---

## Variables de entorno

Ver `server/.env.example` para la lista completa con comentarios.

| Variable | Descripción | Default |
|---|---|---|
| `NODE_ENV` | development / production / test | development |
| `PORT` | Puerto HTTP | 3001 |
| `DB_TYPE` | sqlite o mysql | sqlite |
| `SQLITE_PATH` | Ruta al archivo .db | ./data/multra.db |
| `JWT_SECRET` | **REQUERIDO** ≥32 chars hex | — |
| `JWT_EXPIRES_IN` | Tiempo de vida del JWT | 8h |
| `BCRYPT_ROUNDS` | Cost factor del hash | 12 |
| `CORS_ORIGINS` | Lista separada por coma, o `*` | http://localhost:3001 |
| `ADMIN_USER` | Usuario admin seed | multra_admin |
| `ADMIN_PASS` | Password admin seed | (rotado) |
| `MULTRA_SEED_DEMO` | `1` para seed demo, vacío para DB limpia | (vacío) |
| `FRONTEND_DIR` | Ruta al frontend estático | ../Multra-EU |

---

## Reglas de producción (`NODE_ENV=production`)

El server **se niega a arrancar** si detecta configuraciones inseguras:
- `JWT_SECRET` contiene `REEMPLAZA` o `dev_only`
- `CORS_ORIGINS=*`
- `ADMIN_PASS=Multra2026` (default viejo)
- `BCRYPT_ROUNDS < 12`

---

## Secciones del landing (orden de scroll)

1. **Hero** navy con card amarillo + icon Phosphor (`car-profile`)
2. **Tipos de vehículo** 3 cards con iconos Phosphor (car/motorcycle/bus)
3. **Tarifas RTM** tabla con 2 columnas destacadas en amarillo (Liviano Particular + Pesado Público)
4. **Recordatorio** fondo slate-800 + form conectado a `/api/recordatorios`
5. **Servicios (catálogo accordion)** 4 paneles colapsables (RTM/Seguros/Trámites/Otros)
6. **Inspección RTM** 10 puntos visuales
7. **Cotizador** 3 columnas: paquetes | tabs+grid+qty | summary+WhatsApp dinámico
9. **Ubicación** mapa Google embebido
10. **FAQ** 5 items con datos oficiales MinTransporte + Supertransporte
11. **Por qué elegirnos** 6 cards diferenciadores
12. **Confianza** 4 sellos medallón (RUNT/ONAC/MinTransporte/Aseguradoras)
13. **Enlaces oficiales** 6 cards clickeables a entidades regulatorias
14. **Footer** brand + servicios + contacto (3 columnas)

---

## Endpoints principales

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/health` | no | Estado del servicio |
| POST | `/api/auth/login` | no | Login → JWT |
| GET | `/api/auth/me` | sí | Sesión actual |
| GET | `/api/servicios` | no | Catálogo (20 items) |
| GET/POST/PUT/DELETE | `/api/clientes` | sí | CRUD clientes |
| GET/POST/PUT/DELETE | `/api/vehiculos` | sí | CRUD vehículos |
| GET/POST/DELETE | `/api/polizas` | sí | Pólizas SOAT/todo riesgo |
| GET/POST/PATCH | `/api/citas` | sí | Agenda |
| GET/POST/PATCH | `/api/tramites` | sí | Trámites |
| GET/POST | `/api/pagos` | sí | Pagos |
| GET/POST | `/api/inspections` | sí | Inspecciones (aprueba → +1 año) |
| POST | `/api/cotizar` / `/api/cotizar/publico` | sí/no | Cotizar |
| POST | `/api/recordatorios` | no | Lead capture (form landing) |
| GET | `/api/recordatorios` / `/recordatorios/count` | sí | Panel admin |
| GET | `/api/stats` | sí | KPIs dashboard |

---

## Cambios recientes (sesión 2026-09-19)

### Visual / Frontend
- Hero con icono Phosphor (`car-profile`) en card amarilla
- Tipos de vehículo con iconos Phosphor (car/motorcycle/bus) — 3 cards consistentes
- **Tarifas**: 2 columnas destacadas en amarillo (Liviano Particular + Pesado Público)
- **Recordatorio**: fondo slate-800 `#1E293B` sólido (color único intercalado entre secciones blancas)
- **Catálogo**: acordeón con 4 paneles colapsables (RTM/Seguros/Trámites/Otros)
- FAQ con datos oficiales MinTransporte (UVB $11.552, plazos, multas)
- 6 razones + 4 habilitaciones + 6 enlaces oficiales
- Cotizador rediseñado con paquetes pre-armados + tabs + qty selector
- Hover/animaciones micro en todas las cards
- Footer 3 columnas con brand + servicios + contacto

### Backend
- Fix unhandled promise rejection (asyncHandler en 12 routes)
- Endpoint `/api/recordatorios` con validación Zod + dedup 30min
- Logger reducido (debug → info, sin spam de assets)
- Validación Zod en todos los endpoints
- 5 paquetes pre-armados en `/api/cotizar`

---

## Stack de iconos

- **Bootstrap Icons 1.11.3** — CDN, íconos UI generales (iconos de UI)
- **Phosphor vía Iconify** — CDN, 6 estilos disponibles (regular/bold/fill/duotone), iconos de vehículo (car-profile/motorcycle/bus)

Para cambiar de estilo (ejemplo a bold):
```html
<iconify-icon icon="ph:car-profile" width="200" style="font-weight: 700"></iconify-icon>
```

Para cambiar color:
```css
.l-v-icon { color: var(--y2); }
```

---

## Decisiones de cierre (2026-09-22)

| Decisión | Estado | Razón |
|---|---|---|
| **Self-signup público** | ⏭ SKIP — solo admin crea clientes | Producto actual es B2B interno; el público solo usa cotizador + landing. |
| **NIT footer** | ⏸ Placeholder `900.XXX.XXX-X` + nota prominente | **Búsqueda exhaustiva en 8 fuentes públicas** (2026-09-22, agente dedicado): RUES Datos Abiertos cámara 23 (Huila), RUES todas las cámaras, eInforma, Dataico RUT, Instagram @multra_e, Facebook Multra Oficial, DuckDuckGo, Alcaldía Neiva. **0 matches exactos**. Causa probable: opera como persona natural comerciante (NIT = cédula del dueño) o razón social registrada distinta. **Operador debe editar manualmente antes de ir a producción.** |
| **Render deploy** | ⏸ `render.yaml` listo, NO aplicado | Operador decide desplegar manualmente cuando quiera (1 click en Render Dashboard → Blueprint). |
| **Push a GitHub** | ✅ Hecho | `https://github.com/Nxxo31/multra-eu` (público, 20+ commits). |
| **Copia vieja `Downloads\Multra-EU-Proyecto\`** | ✅ Eliminada | Carpeta canónica: `Desktop\proyectos\multra-eu\`. |

## Cambios sin commitear en working tree

```
 M Multra-EU/css/landing.css  (840 +/-: rediseño CSS consolidado, swing/zigzag, decorativos vehiculares)
 M Multra-EU/index.html       (374 +/-: SVG sprite con vehículos 2D decorativos — sedán, SUV, moto, pesado)
```

Esperando GO del operador para commitear + push (AGENTS.md: no commit sin pedido explícito).

## Próximo paso para deploy a Render (cuando operador lo decida)

1. Crear API key en https://render.com/account/api-keys
2. Ir a https://render.com/blueprints → New Blueprint Instance
3. Conectar repo `Nxxo31/multra-eu` → Render detecta `render.yaml` automáticamente
4. Apply → Render aprovisiona Web Service + disco persistente + genera secrets aleatorios
5. Esperar primer deploy (~3-5 min) → URL pública tipo `https://multra-eu.onrender.com`

**Sin commit sin pedido explícito del operador** (AGENTS.md).

---

## Estado de cierre — sesión 2026-09-22

**Lo que se ejecutó en esta sesión** (sess-3b262ecd5b8c9591):
1. ✅ E2E completo en server `:3001` relanzado (8 endpoints autenticados, cotizador público, landing 200)
2. ✅ Login real via browser (Playwright) contra `localhost:3001` — dashboard carga con sidebar completo (Dashboard, Vehículos, Citas, Inspección, Pólizas, Cotizador, Pagos, Trámites, Clientes)
3. ✅ Búsqueda exhaustiva NIT en 8 fuentes públicas — no encontrado, documentado arriba
4. ✅ Identificados cambios visuales pendientes (CSS + SVG sprite) — esperando commit

**Pendiente para considerar Multra-EU 100% cerrado**:
- [ ] GO del operador para commit `feat(landing): rediseño CSS + SVG sprite decorativo` + push
- [ ] (Opcional) editar manualmente el NIT en `Multra-EU/index.html` footer si se conoce
- [ ] (Opcional futuro) Render deploy cuando operador quiera — `render.yaml` ya está listo