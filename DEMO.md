# Demo Runbook — ZeroQ on Splunk Trial

Este documento describe el flujo completo para probar el sistema al 100% usando **Splunk Cloud Trial** (o Splunk Enterprise local).

---

## 1. Pre-requisitos

- Node.js ≥18.17
- Cuenta Splunk Cloud Trial activa (14 días, 5 GB/día)
- GitHub/GitLab token (opcional, mejora rate limits)
- DeepSeek API key (opcional, activa modo "live" en AI Assistant)

---

## 2. Configurar Splunk Cloud Trial

### 2.1 Crear trial
1. Ir a https://www.splunk.com/en_us/download/splunk-cloud.html
2. Crear cuenta y esperar aprovisionamiento (~5-15 min).
3. Guardar URL del tenant, por ejemplo: `https://mytenant.splunkcloud.com`

### 2.2 Habilitar HEC
1. Splunk Web → **Settings → Data Inputs → HTTP Event Collector → New Token**.
2. **Name:** `zeroq-hec`
3. **Source type:** `zeroq:scanner`
4. **Allowed indexes:** `crypto_source`, `crypto_net`, `crypto_pki`, `crypto_hndl`, `crypto_plan`
5. **Default index:** `crypto_source`
6. Guardar el token (ej. `abcd1234-...`).

### 2.3 Crear índices
Settings → Indexes → New Index. Crear uno por cada índice:
- `crypto_source`
- `crypto_net`
- `crypto_pki`
- `crypto_hndl`
- `crypto_plan`

### 2.4 Crear usuario de búsqueda
1. Settings → Users → New User
2. **Username:** `zeroq_api`
3. **Password:** segura
4. **Role:** `power` (o `user` con permisos a los 5 índices)

---

## 3. Configurar la aplicación

Copiar `.env.example` a `.env.local` y completar:

```bash
cp .env.example .env.local
```

Editar `.env.local`:

```
# HEC
SPLUNK_HEC_URL=https://mytenant.splunkcloud.com:8088
SPLUNK_HEC_TOKEN=abcd1234-...
SPLUNK_INDEX_SOURCE=crypto_source

# REST API
SPLUNK_BASE_URL=https://mytenant.splunkcloud.com
SPLUNK_USERNAME=zeroq_api
SPLUNK_PASSWORD=tu-password
SPLUNK_INDEX_NET=crypto_net
SPLUNK_INDEX_PKI=crypto_pki
SPLUNK_INDEX_HNDL=crypto_hndl
SPLUNK_INDEX_PLAN=crypto_plan

# Opcional
DEEPSEEK_API_KEY=sk-...
GITHUB_TOKEN=ghp_...
```

---

## 4. Instalar dependencias y levantar

```bash
npm install
npm run dev
```

La app corre en `http://localhost:3000`.

---

## 5. Flujo de prueba 100%

### Paso 1 — Health check (30 segundos)

Abrir en navegador:
```
http://localhost:3000/api/risk
```

Esperar respuesta similar a:
```json
{
  "riskScore": 68,
  "band": "High",
  "lastMonth": 77,
  "breakdown": [...],
  "capabilities": { "ai": false, "splunk": true, "github": false, "gitlab": false },
  "source": "seed"
}
```

Confirmar `capabilities.splunk: true`. Si es `false`, revisar `.env.local`.

### Paso 2 — Cargar datos demo en Splunk (30 segundos)

```bash
npm run seed:splunk
```

Salida esperada:
```
Seeded Splunk successfully:
  index=crypto_net sent=20
  index=crypto_pki sent=14
  index=crypto_hndl sent=4
```

Verificar en Splunk Search:
```spl
| index=crypto_net | stats count
```
→ debe devolver 20.

### Paso 3 — Validar datos reales en el frontend (1 minuto)

Abrir `http://localhost:3000` y navegar por cada pantalla:

| Pantalla | Validación |
|----------|-----------|
| **Risk Dashboard** | Debe mostrar badge "Live · Splunk" (o datos seed si no hay source). El score puede cambiar ligeramente. |
| **Crypto Inventory** | Tabla con 20 filas, filtros por `critical`, `high`, `monitor`, `safe` funcionan. |
| **Certificate Planner** | Gráfico de buckets con conteos reales, tabla con 14 certificados. |
| **HNDL Detection** | 4 anomalías listadas, badge "Live · Splunk". |
| **Compliance** | Badge "Live · Splunk" si hay mapping cargado, de lo contrario seed. |

### Paso 4 — Escanear un repositorio real (2 minutos)

1. Ir a **Sources → Repository Scanner**.
2. Ingresar un repo público con crypto, por ejemplo:
   - `OWASP/CheatSheetSeries`
   - `openssl/openssl`
   - `acme-corp/payments-service` (ficticio, no escaneará)
3. Click **Scan**.
4. Verificar en UI que aparecen findings.
5. Verificar respuesta POST `/api/scan` incluye:
   ```json
   { "result": {...}, "splunk": { "sent": N, "ok": true } }
   ```
6. En Splunk Search:
   ```spl
   | index=crypto_source repo=<repo> | stats count
   ```
   → debe devolver > 0.

### Paso 5 — Probar AI Assistant (30 segundos)

Ir a **Act → AI Assistant**.

Preguntar:
- "¿Qué repos tienen hallazgos críticos?"
- "¿Cuántos certificados expiran en 30 días?"
- "¿Qué servicios usan TLS 1.0/1.1?"

Si hay `DEEPSEEK_API_KEY`, responde con datos reales de Splunk.  
Si no, usa el fallback local con seed data (indicador amarillo "local reasoner").

### Paso 6 — Generar plan de migración (30 segundos)

Ir a **Sources → Org Security Plan**.
Click **Generate Plan**.

Esperar plan estructurado con streams, repos y acciones priorizadas.

### Paso 7 — Instalar Splunk App nativa (2 minutos)

1. Comprimir `zeroq-splunk-app/` en un `.tar.gz` o `.spl`:
   ```bash
   cd zeroq-splunk-app
   tar -czvf ../zeroq-splunk-app.spl .
   ```
2. En Splunk Web → **Apps → Manage Apps → Install app from file**.
3. Subir `zeroq-splunk-app.spl`.
4. Reiniciar Splunk si se solicita.
5. Navegar a **Apps → ZeroQ**.
6. Abrir cada uno de los 5 dashboards y confirmar que renderizan datos.

### Paso 8 — Probar alertas (1 minuto)

1. Forzar un hallazgo crítico escaneando un repo vulnerable.
2. Ir a **Settings → Searches, reports, and alerts**.
3. Buscar **ZeroQ Critical Findings Daily**.
4. Click **Run**.
5. Verificar que genera resultados con `count > 0`.

### Paso 9 — Modo offline / fallback (30 segundos)

1. Renombrar temporalmente `.env.local`:
   ```bash
   mv .env.local .env.local.bak
   ```
2. Reiniciar `npm run dev`.
3. Refrescar frontend.
4. Verificar:
   - Sidebar muestra "Splunk offline · seed data mode"
   - El frontend sigue funcionando con datos seed.
   - El escáner opera en modo standalone (no emite a Splunk).
5. Restaurar config:
   ```bash
   mv .env.local.bak .env.local
   ```

---

## 6. Troubleshooting

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| `capabilities.splunk: false` | Faltan credenciales en `.env.local` | Revisar HEC URL/token y REST URL/user/pass. |
| `seed:splunk` falla con 403 | Token HEC no tiene acceso al índice | En Splunk, editar token HEC → allowed indexes. |
| Dashboards frontend vacíos | Splunk Search API devuelve 0 resultados | Confirmar que `seed:splunk` se ejecutó. Revisar earliest time en queries. |
| Latencia alta en UI | Splunk Cloud tarda en responder | Normal la primera vez; los resultados se cachean 30s. |
| AI Assistant en "fallback" | Falta `DEEPSEEK_API_KEY` | Agregar key o usar preguntas soportadas por el local reasoner. |
| CORS en HEC desde frontend | HEC no permite CORS | Las escrituras siempre son server-side vía `/api/scan`. No se usa HEC directamente desde el browser. |

---

## 7. Métricas de éxito

Antes de declarar la demo lista, verificar:

- [ ] `npm run seed:splunk` carga ≥ 38 eventos sin errores.
- [ ] Escaneo de repo público devuelve `splunk.ok: true` con `sent > 0`.
- [ ] Al menos 4 pantallas frontend muestran badge "Live · Splunk".
- [ ] Los 5 dashboards de Splunk App renderizan datos.
- [ ] AI Assistant responde al menos 3 preguntas de prueba.
- [ ] El sistema funciona en modo fallback cuando Splunk está offline.
