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
  "data": {
    "riskScore": 68,
    "band": "High",
    "lastMonth": 77,
    "breakdown": [...],
    "endpointsScanned": 0,
    "connectionsObserved": 0,
    "certsTracked": 0,
    "coverage": 0
  },
  "source": "local"
}
```

`source` puede ser `"splunk"`, `"local"` o `null`. Si es `null` y no hay datos,
escanear un repo o un host TLS. Para ver capabilities, usar `GET /api/debug/config`.

### Paso 2 — Cargar datos reales en Splunk (2 minutos)

ZeroQ no usa datos demo empaquetados: los índices de Splunk se llenan con
escaneos reales del frontend.

1. Ir a **Sources → Repository Scanner**.
2. Escanear al menos un repo público con crypto, por ejemplo:
   - `openssl/openssl`
   - `square/okhttp`
   - `OWASP/CheatSheetSeries`
3. Verificar que la respuesta incluye:
   ```json
   { "result": {...}, "splunk": { "sent": N, "ok": true } }
   ```
4. En Splunk Search:
   ```spl
   | index=crypto_source repo=<repo> | stats count
   ```
   → debe devolver `N` eventos.

Para datos de red, ir a **Network Inventory → Add domain**, ingresar un host
que te pertenezca (ej. `example.com`) y hacer **Scan TLS**. Los resultados
quedan en SQLite local y, si Splunk está conectado, se pueden exponer vía
`crypto_net`/`crypto_pki` extendiendo el ingestor.

### Paso 3 — Validar datos reales en el frontend (1 minuto)

Abrir `http://localhost:3000` y navegar por cada pantalla:

| Pantalla | Validación |
|----------|-----------|
| **Risk Dashboard** | Debe mostrar badge "Live · Splunk" (o "Local · SQLite" si no hay source). El score puede cambiar ligeramente. |
| **Crypto Inventory** | Tabla con findings de los repos escaneados; filtros por `critical`, `high`, `monitor`, `safe` funcionan. |
| **Certificate Planner** | Certificados reales de hosts escaneados con TLS. |
| **HNDL Detection** | Badge "Live · Splunk" si hay datos en `crypto_hndl`; de lo contrario el panel indica que no hay datos. |
| **Compliance** | Badge "Live · Splunk" si hay findings en `crypto_source`; de lo contrario datos locales. |

### Paso 4 — Escanear red con TLS (2 minutos)

1. Ir a **Network Inventory**.
2. Click **Add domain** e ingresar un host que te pertenezca, por ejemplo
   `example.com`.
3. Click **Scan TLS**.
4. Verificar que la UI muestra la versión TLS, cipher suite y riesgo.
5. Los resultados se guardan en `data/zeroq.db` (`tls_scans`, `cert_scans`).

> Solo escanea infraestructura sobre la que tengas permiso explícito.

### Paso 5 — Generar HNDL anomalies (30 segundos)

Ir a **Detect → HNDL Detection**.

Click **Generate from network data**. El sistema analiza los destinos TLS
escaneados (paso 4) y crea anomalías HNDL locales. Si Splunk HEC está
configurado, también empuja los eventos a `crypto_hndl`.

Verificar:
- Aparece lista de destinos sospechosos con volumen, baseline y desviación.
- El timeline de 48h renderiza.
- Los eventos llegan a Splunk Search:
  ```spl
  | index=crypto_hndl sourcetype=zeroq:hndl_event | stats count
  ```

### Paso 6 — Probar AI Assistant (30 segundos)

Ir a **Act → AI Assistant**.

Preguntar:
- "¿Qué repos tienen hallazgos críticos?"
- "¿Cuántos certificados expiran en 30 días?"
- "¿Qué servicios usan TLS 1.0/1.1?"

Si hay `DEEPSEEK_API_KEY`, responde con datos reales de Splunk.  
Si no, usa el fallback local con seed data (indicador amarillo "local reasoner").

### Paso 7 — Generar plan de migración (30 segundos)

Ir a **Sources → Org Security Plan**.
Click **Generate Plan**.

Esperar plan estructurado con streams, repos y acciones priorizadas.

### Paso 8 — Instalar Splunk App nativa (2 minutos)

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

### Paso 9 — Probar alertas (1 minuto)

1. Forzar un hallazgo crítico escaneando un repo vulnerable.
2. Ir a **Settings → Searches, reports, and alerts**.
3. Buscar **ZeroQ Critical Findings Daily**.
4. Click **Run**.
5. Verificar que genera resultados con `count > 0`.

### Paso 10 — Modo offline / fallback (30 segundos)

1. Renombrar temporalmente `.env.local`:
   ```bash
   mv .env.local .env.local.bak
   ```
2. Reiniciar `npm run dev`.
3. Refrescar frontend.
4. Verificar:
   - Sidebar muestra "Local · SQLite" o similar.
   - El frontend sigue funcionando con datos locales.
   - El escáner opera en modo standalone (no emite a Splunk).
5. Restaurar config:
   ```bash
   mv .env.local.bak .env.local
   ```

---

## 6. Troubleshooting

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| `GET /api/debug/config` muestra `splunk.enabled: false` | Faltan credenciales en `.env.local` o SQLite settings | Revisar onboarding o `.env.local`. |
| Escaneo devuelve `splunk.ok: false` | Token HEC no tiene acceso al índice | En Splunk, editar token HEC → allowed indexes. |
| Dashboards frontend vacíos | Splunk Search API devuelve 0 resultados | Escanear al menos un repo para llenar `crypto_source`. Revisar earliest time en queries. |
| Latencia alta en UI | Splunk Cloud tarda en responder | Normal la primera vez; los resultados se cachean 30s. |
| AI Assistant en "fallback" | Falta `DEEPSEEK_API_KEY` | Agregar key o usar preguntas soportadas por el local reasoner. |
| CORS en HEC desde frontend | HEC no permite CORS | Las escrituras siempre son server-side vía `/api/scan`. No se usa HEC directamente desde el browser. |

---

## 7. Métricas de éxito

Antes de declarar la demo lista, verificar:

- [ ] Escaneo de repo público devuelve `splunk.ok: true` con `sent > 0`.
- [ ] Al menos 3 pantallas frontend muestran badge "Live · Splunk".
- [ ] Los 5 dashboards de Splunk App renderizan datos.
- [ ] AI Assistant responde al menos 3 preguntas de prueba.
- [ ] Escaneo TLS devuelve versión y cipher de al menos 1 host.
- [ ] HNDL Detection genera al menos 1 anomalía y renderiza timeline.
- [ ] El sistema funciona en modo fallback cuando Splunk está offline.
