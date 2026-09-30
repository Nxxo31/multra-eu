# Multra E.U. — Guía de Producción

Documento operativo para el estado productivo actual: **Vercel serverless + Neon Postgres**.

**Producción actual:** `https://multra-eu.vercel.app`
**Health:** `https://multra-eu.vercel.app/api/health`
**Repo:** `https://github.com/Nxxo31/multra-eu`

---

## 1. Arquitectura de producción

```text
Browser
  ├── Vercel static        → public/** (landing/login/dashboard/assets)
  └── Vercel function      → api/index.js → Express app → Neon Postgres
```

Reglas clave:
- En Vercel, Express no sirve el frontend; `app.js` detecta `process.env.VERCEL` y deja `/public` a la plataforma.
- `api/index.js` cachea la app entre invocaciones para reducir cold starts.
- `initDatabase(db)` es idempotente: aplica schema y seed mínimo cuando corresponde.
- En producción la DB esperada es Postgres (`DB_TYPE=postgres`).

---

## 2. Variables de entorno requeridas

Configurar en Vercel → Project → Settings → Environment Variables.

| Variable | Valor esperado |
|---|---|
| `NODE_ENV` | `production` |
| `DB_TYPE` | `postgres` |
| `DATABASE_URL` | connection string Neon branch `prod` |
| `JWT_SECRET` | secreto ≥32 chars, fuera del repo |
| `JWT_EXPIRES_IN` | `8h` |
| `BCRYPT_ROUNDS` | `12` |
| `ADMIN_USER` | usuario admin real |
| `ADMIN_PASS` | password rotado, fuera del repo |
| `CORS_ORIGINS` | `https://multra-eu.vercel.app` o dominio final |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX` | `300` |
| `AUTH_RATE_LIMIT_MAX` | `10` |

No definir `MULTRA_SEED_DEMO` en producción.

---

## 3. Generar/rotar secretos

```powershell
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('ADMIN_PASS=' + require('crypto').randomBytes(20).toString('base64url'))"
```

Guardar en password manager y actualizar Vercel env vars. Después de rotar `JWT_SECRET`, las sesiones viejas quedan invalidadas.

---

## 4. Deploy

### Estado actual

El deploy productivo vigente fue hecho por CLI. El proyecto aún debe quedar conectado a Git para auto-deploy.

### Deploy manual CLI

```powershell
cd C:\Users\sebas\Desktop\proyectos\multra-eu
vercel --prod --yes --token $env:VERCEL_TOKEN
```

### Git connection pendiente

```powershell
vercel git connect
```

Después de conectar Git:
1. push a la rama configurada
2. Vercel hace build/deploy automático
3. correr smoke post-deploy

---

## 5. `vercel.json` vigente

`vercel.json` debe mantener esta forma:

- build API: `api/index.js` con `@vercel/node`
- `includeFiles: server/**`
- build static: `public/**` con `@vercel/static`
- rutas:
  - `/api/(.*)` → function
  - `handle: filesystem`
  - fallback `/(.*)` → `/public/$1`

No volver a mezclar `routes` legacy con `headers`/`rewrites` v2 incompatibles.

---

## 6. Base de datos Neon

Branch productiva: `prod`.

Primera inicialización:
- `runMigrations()` aplica el schema Postgres
- seed crea servicios y admin si `users` está vacío

Nota crítica ya tratada:
- Postgres pliega identificadores no quoted a lowercase.
- `server/src/db/connection.js` normaliza keys lowercase→camelCase para que repositorios y servicios sigan leyendo `passwordHash`, `createdAt`, etc.

---

## 7. Smoke test post-deploy

```powershell
curl.exe -i https://multra-eu.vercel.app/
curl.exe -i https://multra-eu.vercel.app/login.html
curl.exe -i https://multra-eu.vercel.app/api/health
curl.exe -i https://multra-eu.vercel.app/api/servicios
curl.exe -X POST https://multra-eu.vercel.app/api/auth/login -H "Content-Type: application/json" -d '{"username":"<admin>","password":"<password>"}'
curl.exe -X POST https://multra-eu.vercel.app/api/cotizar/publico -H "Content-Type: application/json" -d '{"items":[{"servicioId":"soat_auto_lt10","cantidad":1}]}'
```

Con token admin, verificar además:

```powershell
curl.exe -H "Authorization: Bearer <token>" https://multra-eu.vercel.app/api/stats
curl.exe -H "Authorization: Bearer <token>" https://multra-eu.vercel.app/api/clientes
curl.exe -H "Authorization: Bearer <token>" https://multra-eu.vercel.app/api/recordatorios/count
```

---

## 8. Checklist de release

- [ ] `NODE_ENV=production`
- [ ] `DB_TYPE=postgres`
- [ ] `DATABASE_URL` apunta a Neon `prod`
- [ ] `JWT_SECRET` válido y sin placeholders
- [ ] `ADMIN_PASS` rotado
- [ ] `CORS_ORIGINS` exacto
- [ ] `BCRYPT_ROUNDS >= 12`
- [ ] `vercel.json` con `@vercel/static` para `public/**`
- [ ] API function incluye `server/**`
- [ ] smoke test productivo OK
- [ ] tests locales OK con `node --test "server/test/*.test.js"` o `node --test "test/*.test.js"` según cwd
- [ ] NIT real en footer
- [ ] favicon presente
- [ ] commit/push + merge + auto-deploy conectado

---

## 9. Operación

- Logs: salida estándar de Vercel Functions.
- Health externo: ping a `/api/health` cada 30–60 s.
- Métricas admin: `/api/stats` con JWT admin.
- Backup: Neon PITR según plan; además export periódico si se requiere retención propia.
- Rotación JWT recomendada: 90 días.
- Rotación admin: siempre que haya sospecha de exposición o cambio de operador.

---

## 10. Riesgos abiertos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Hotfixes no pusheados | redeploy desde git puede reintroducir bugs | commit/push + merge + `vercel git connect` |
| NIT placeholder | riesgo legal/confianza | operador edita `public/index.html` |
| favicon 404 | cosmético | agregar `public/favicon.ico` |
| Credenciales viejas inválidas | confusión operativa | documentar que solo cuenta la `ADMIN_PASS` actual rotada |

---

## 11. Soporte

- Repo: `https://github.com/Nxxo31/multra-eu`
- Issues: `https://github.com/Nxxo31/multra-eu/issues`
- Memoria operativa: dark-memory, tags `multra-eu`, `deploy`, `produccion`
