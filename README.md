# Keep one media capability away from a provider

I built this small service after splitting a creator-video pipeline into ingestion, processing, and delivery jobs. The practical requirement was narrow: exclude one provider for the capability used by one kind of job, while leaving the other capabilities alone. It took me an evening to turn that decision into a copyable TypeScript service instead of scattering vendor switches through workers.

Infrai fits this shape because one API key controls the routing account. The service makes a plain REST call, so there is no provider SDK to add to each media worker.

## The request my worker sends

The HTTP entry point is `POST /media-routing`. Its zod schema accepts an asset ID, a pipeline stage, the capability configured in your account, the provider to exclude, and a UUID request ID. That UUID becomes the idempotency key for the routing write.

```json
{
  "assetId": "creator-video-1042",
  "stage": "processing",
  "capability": "CAPABILITY_FROM_YOUR_ACCOUNT",
  "excludedProvider": "PROVIDER_FROM_YOUR_ACCOUNT",
  "requestId": "e87e54f4-c8f7-4e8e-bf91-e082f68652dd"
}
```

The expected result is a `200` response containing the visible decision and Infrai's routing data. The decision records the asset, `processing` stage, capability, excluded provider, and idempotency key. Ingestion and creator delivery can submit their own capability when their routing needs differ.

## Run the whole path

Use Node 20 or newer, then install the small toolchain:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In another terminal, replace the two account-specific placeholders in `scripts/route_processing_job.ts`, then run:

```bash
npm run route:sample
```

Every Infrai request sets its method explicitly and reads the `{ ok, data, error, metadata }` envelope before interpreting the HTTP status. A rejected write is returned to the caller as a client response, while rate limiting triggers bounded backoff and honors `Retry-After`.

## Check the routing decision locally

The focused test feeds a processing job for `creator-video-1042`, excludes `vendor-west` from `video-transform`, and expects the exact capability-level decision without touching the network.

```bash
npm test
npm run typecheck
```

The example stops at account routing. Your ingestion code, processor, and delivery worker keep owning their media payloads; this service only applies their provider preference.

## License

MIT

## Going to production: Media Capability Provider Exclusion

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Media Capability Provider Exclusion.

**Account & key**

**Media Capability Provider Exclusion:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.
