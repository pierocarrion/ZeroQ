# Example Datasets

This directory contains illustrative datasets that match the schemas ZeroQ expects in Splunk (or in the local SQLite store). They are useful for:

- Understanding the event shape sent to each `crypto_*` index.
- Testing dashboards and alerts without scanning real repos or networks.
- Seeding a demo Splunk instance during a hackathon presentation.

## Files

| File | Index | Sourcetype | Description |
|---|---|---|---|
| `example-crypto-findings.json` | `crypto_source` | `zeroq:crypto_finding` | Repository scan findings (RSA, ECDSA, legacy TLS, etc.). |
| `example-tls-connections.json` | `crypto_net` | `zeroq:tls_connection` | Passive TLS handshake observations. |
| `example-certificates.json` | `crypto_pki` | `zeroq:cert` | Certificate metadata with expiry and algorithm risk. |
| `example-hndl-events.json` | `crypto_hndl` | `zeroq:hndl_event` | Harvest-Now-Decrypt-Later anomaly signals. |

## Sending to Splunk

Use the Splunk HTTP Event Collector (HEC). For example, to send HNDL events:

```bash
SPLUNK_HEC_URL=https://yourtenant.splunkcloud.com:8088
SPLUNK_HEC_TOKEN=abcd1234-...

jq -c '.[]' dataset/example-hndl-events.json | while read -r event; do
  curl -k "$SPLUNK_HEC_URL/services/collector/event" \
    -H "Authorization: Splunk $SPLUNK_HEC_TOKEN" \
    -d "{\"time\":$(date +%s),\"sourcetype\":\"zeroq:hndl_event\",\"index\":\"crypto_hndl\",\"source\":\"zeroq:seed\",\"event\":$event}"
done
```

Or load them from the ZeroQ UI by scanning the example repos/domains documented in [README.md](../README.md).

## Notes

- These datasets are **synthetic** and intended for demonstration only.
- No real cryptographic keys, certificates, or private infrastructure data are included.
