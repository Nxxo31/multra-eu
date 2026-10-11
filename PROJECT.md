# PROJECT.md — Multra E.U.

> **Estado:** Activo en producción · **Versión:** v1.x · **Última act.:** 2026-09-30
> **Este archivo es índice canónico.** El contenido operativo vive en
> `README.md` (arquitectura, stack, setup local) y `PRODUCTION.md`
> (runbook de producción, env vars, deploy, smoke, riesgos). No duplicar
> contenido aquí — apuntar siempre a esos dos archivos.

## 1. Identidad

  Sistema de gestión para CDA y gestoría vehicular en Neiva, Huila
  (Colombia). Producción viva en `https://multra-eu.vercel.app`.

## 2. Fuentes de verdad (no duplicar)

  - **Arquitectura, stack, setup local:** ver `README.md` (190 líneas).
  - **Runbook producción, env vars, deploy, smoke, riesgos:** ver
    `PRODUCTION.md` (187 líneas).
  - **Reglas operativas del repo:** ver `AGENTS.md` cuando exista.

## 3. Estado verificado (2026-10-11)

  | Componente         | Estado                              |
  |--------------------|-------------------------------------|
  | Producción Vercel  | activa, branch `vercel-deploy`       |
  | DB Neon            | branch `prod`, Postgres             |
  | Hotfixes           | pusheados 2026-09-30 (commit 6fa877e)|
  | Auto-deploy        | BLOQUEADO — falta `vercel git connect` (login GitHub pendiente operador) |
  | NIT en footer      | placeholder, requiere edición operador |
  | Tests              | `node --test "server/test/*.test.js"` |

## 4. Pendiente real (acción operador)

  1. Conectar login GitHub en Vercel → habilitar `vercel git connect`.
  2. Editar NIT real en `public/index.html`.
  3. (Opcional) rotar `ADMIN_PASS` si la actual está comprometida.

## 5. Disciplina documental

  Este proyecto respeta la regla "no archivos .md sueltos" (memo #172):
  PROJECT.md (índice) + README.md (arquitectura) + PRODUCTION.md (runbook).
  No crear CHANGELOG.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md ni similares.

---

*Índice regenerado por SophIA el 2026-10-11 (memo #186). El contenido
operativo vive en README.md y PRODUCTION.md.*


## Higiene de seguridad (2026-10-11)

  - **NUNCA** guardar passwords en archivos `.tmp` o `.txt` en el repo.
    Usar SIEMPRE `.env` (cifrado en Vercel) o el password manager del operador.
  - El archivo `.admin-pass.tmp` (password en plaintext) fue
    eliminado en esta sesión. La password real vive en `ADMIN_PASS`
    de las Vercel env vars (PRODUCTION.md §2).
  - Si necesitas regenerar password: `node -e "console.log('ADMIN_PASS='
    + require('crypto').randomBytes(20).toString('base64url'))"`
    y actualizar Vercel env vars + tu password manager local.
