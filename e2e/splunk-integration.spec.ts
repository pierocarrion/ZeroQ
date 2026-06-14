import { test, expect } from '@playwright/test';

test.describe('ZeroQ + Splunk Enterprise Integration', () => {
  test('health check confirms Splunk connectivity', async ({ request }) => {
    const res = await request.get('/api/health/splunk');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.connected).toBe(true);
  });

  test('debug config masks sensitive fields', async ({ request }) => {
    const res = await request.get('/api/debug/config');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.password).toContain('***');
    expect(body.hecToken).toBeUndefined();
  });

  test('risk summary returns structured data', async ({ request }) => {
    const res = await request.get('/api/risk');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.riskScore).toBe('number');
    expect(body.riskScore).toBeGreaterThanOrEqual(0);
    expect(body.riskScore).toBeLessThanOrEqual(100);
    expect(['Low','Monitor','High','Critical','—']).toContain(body.band);
    expect(Array.isArray(body.breakdown)).toBe(true);
    expect(body.capabilities.splunk).toBe(true);
  });

  test('inventory returns TLS connections from Splunk', async ({ request }) => {
    const res = await request.get('/api/inventory');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('splunk');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    const first = body.data[0];
    expect(first).toHaveProperty('server');
    expect(first).toHaveProperty('risk');
    expect(first).toHaveProperty('version');
  });

  test('inventory filtering works', async ({ request }) => {
    const res = await request.get('/api/inventory?risk=critical');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((x: any) => String(x.risk).includes('critical'))).toBe(true);
  });

  test('certificates return PKI data', async ({ request }) => {
    const res = await request.get('/api/certs');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('splunk');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    const first = body.data[0];
    expect(first).toHaveProperty('subject');
    expect(first).toHaveProperty('expiry');
  });

  test('HNDL anomalies return data', async ({ request }) => {
    const res = await request.get('/api/hndl');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('splunk');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('compliance stats return framework mappings', async ({ request }) => {
    const res = await request.get('/api/compliance');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('splunk');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    const first = body.data[0];
    expect(first).toHaveProperty('framework');
    expect(first).toHaveProperty('authority');
  });

  test('algorithm mix sums to ~100%', async ({ request }) => {
    const res = await request.get('/api/algo-mix');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('splunk');
    const sum = body.data.reduce((a: number, x: any) => a + x.pct, 0);
    expect(sum).toBeGreaterThanOrEqual(99);
    expect(sum).toBeLessThanOrEqual(101);
  });

  test('top assets returns max 10', async ({ request }) => {
    const res = await request.get('/api/top-assets');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('splunk');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeLessThanOrEqual(10);
  });

  test('roadmap returns phased plan', async ({ request }) => {
    const res = await request.get('/api/roadmap');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('splunk');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('phase');
    expect(body.data[0]).toHaveProperty('items');
  });

  test('org plan returns streams', async ({ request }) => {
    const res = await request.get('/api/org-plan?org=acme-corp');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('splunk');
    expect(body.data).toHaveProperty('org', 'acme-corp');
    expect(Array.isArray(body.data.streams)).toBe(true);
    expect(body.data.streams.length).toBeGreaterThan(0);
  });

  test('code rollup aggregates findings', async ({ request }) => {
    const res = await request.get('/api/code-rollup');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('splunk');
    expect(body.data.findings).toBeGreaterThan(0);
    expect(body.data.reposScanned).toBeGreaterThan(0);
    expect(Array.isArray(body.data.byLang)).toBe(true);
  });

  test('query proxy allows valid SPL', async ({ request }) => {
    const res = await request.post('/api/splunk/query', {
      data: { query: 'index=crypto_source | head 5' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.result).toBeDefined();
    expect(Array.isArray(body.result.results)).toBe(true);
  });

  test('query proxy blocks disallowed indexes', async ({ request }) => {
    const res = await request.post('/api/splunk/query', {
      data: { query: 'index=_internal | head 5' },
    });
    expect(res.status()).toBe(403);
  });

  test('query proxy blocks delete commands', async ({ request }) => {
    const res = await request.post('/api/splunk/query', {
      data: { query: 'index=crypto_source | delete' },
    });
    expect(res.status()).toBe(403);
  });

  test('onboarding validates correct credentials', async ({ request }) => {
    const res = await request.post('/api/onboarding/test-splunk', {
      data: {
        hecUrl: 'https://localhost:8088',
        hecToken: '3af80d69-5d16-4ca0-921b-00e9719f46db',
        baseUrl: 'https://localhost:8089',
        username: 'sc_admin',
        password: 'j6n7ba2tz1lbm6nb',
        skipTlsVerify: true,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.checks.hec.ok).toBe(true);
    expect(body.checks.rest.ok).toBe(true);
  });

  test('scan flow writes findings to Splunk', async ({ request }) => {
    const res = await request.post('/api/scan', {
      data: { target: 'auth0/node-jsonwebtoken' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.result.findings).toBeGreaterThan(0);
    expect(body.splunk.ok).toBe(true);
    expect(body.splunk.sent).toBeGreaterThan(0);
  });
});
