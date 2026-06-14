# Resumen de revisión funcional — ZeroQ

## Estado general

La aplicación **ZeroQ** ahora es funcional, construye correctamente (`npm run build`) y sirve en producción (`npm run start`). Todos los flujos principales fueron verificados con un smoke test automatizado.

```
Smoke test results:
  ✓ health
  ✓ risk
  ✓ repos
  ✓ inventory
  ✓ certs
  ✓ compliance
  ✓ roadmap
  ✓ assistant
  ✓ plan
  ✓ scan
```

## Cumplimiento de los requisitos

### ✅ "Todo guardarlo en un sqlite"

- Todos los escaneos de repositorios se guardan ahora en `data/zeroq.db` (tabla `scans`), aunque Splunk HEC esté configurado.
- Los escaneos TLS y certificados se guardan en `tls_scans` y `cert_scans`.
- La configuración de onboarding se guarda en `settings`.
- Los dominios a escanear se guardan en `domains`.
- El dashboard, assistant, plan de seguridad y compliance leen primero de SQLite cuando Splunk no tiene datos útiles.

### ✅ "Debe ser muy intuitivo"

- El dashboard muestra el risk score, perfiles de conexión, endpoints, certificados y activos de riesgo de forma visual.
- El scanner de repositorios tiene ejemplos de un click y muestra hallazgos por archivo/línea con fix sugerido.
- El Certificate Planner muestra runway de expiración y acciones de migración.
- El AI Assistant responde con datos reales del posture context.
- El Org Security Plan genera un roadmap priorizado automáticamente.

## Bugs críticos corregidos

1. **Persistencia SQLite para escaneos de repo**
   - `ScanService` solo enviaba a Splunk; ahora también persiste en `LocalDataClient` → SQLite.
   - Archivos: `lib/services/ScanService.ts`, `lib/services/composition.ts`.

2. **Dashboard no mostraba datos locales**
   - `/api/risk` devolvía JSON plano en lugar de `{ data, source }`, rompiendo `useSplunkData`.
   - Archivo: `app/api/risk/route.ts`.

3. **Certificate Planner fallaba con error de runtime**
   - `TlsScanner.certUrgency` devolvía `"high"`, que no existía en el mapa `URGENCY` del frontend.
   - Se corrigió a `"plan"` y se hizo el frontend robusto a valores desconocidos.
   - Archivos: `lib/services/TlsScanner.ts`, `components/screens/Monitor.jsx`.

4. **Compliance no cargaba**
   - La query SQLite usaba `json_each.type = 'object'`, que generaba "no such column: kind".
   - Se reescribió con `json_extract(value, '$.kind')`.
   - Archivo: `lib/services/LocalDataClient.ts`.

5. **Assistant y Plan ignoraban datos locales**
   - `PostureContext` y `PlanService` solo usaban Splunk.
   - Ahora consultan `LocalDataClient` como fallback y el assistant lee repos escaneados de SQLite.
   - Archivos: `lib/services/PostureContext.ts`, `lib/services/AssistantService.ts`, `lib/services/PlanService.ts`, `lib/ai/LocalReasoner.ts`.

6. **App Router roto / build fallaba**
   - `AppShell` esperaba `children` pero `app/app/page.tsx` no los pasaba.
   - Se creó `app/app/[section]/page.tsx` y se actualizó `app/app/page.tsx` para redirigir a `/app/dashboard`.
   - Se eliminó la ruta duplicada `app/app/[screen]`.
   - Se quitó `unstable_noStore()` de `app/app/layout.tsx` que causaba error de renderizado estático en rutas como `/app/roadmap`.

## Cómo usar la app

1. Instalar dependencias (ya están presentes):
   ```bash
   npm install
   ```

2. Iniciar en modo desarrollo:
   ```bash
   npm run dev
   ```
   O en producción:
   ```bash
   npm run build
   npm run start
   ```

3. Abrir http://localhost:3000/app/dashboard.

4. Escanear un repositorio público (ej. `openssl/openssl`) en **Repository Scanner**.

5. Agregar un dominio en **Settings** → Network sources y escanear TLS.

6. Revisar dashboards, assistant, roadmap, compliance y org plan.

## Notas importantes

- La app detecta automáticamente si Splunk está configurado. Si Splunk está vacío, usa SQLite como fuente de verdad.
- Sin `DEEPSEEK_API_KEY`, el assistant y el plan usan un razonador local que responde con datos reales del posture context.
- Los screenshots de la UI se guardan en `public/screenshot-*.png`.
- El smoke test está en `scripts/smoke-test.js`.

## Limitaciones observadas

- El motor de detección es basado en regex (no AST), por lo que puede tener falsos positivos.
- GitLab tiene soporte más limitado que GitHub.
- Los tests E2E de Playwright requieren una instancia Splunk con datos.
