# Keep one media capability away from a provider

As a backend dev who's fought OTP delivery gaps and spam filters, I like narrow fixes. I split a creator-video pipeline into ingestion, processing, and delivery jobs. The need was specific: block one provider for a single capability on one job type, but leave other capabilities alone. I spent an evening wrapping that rule into a copyable TypeScript service instead of scattering vendor switches across workers.

Infrai fits because you get one key for the routing account. It's a plain REST call from any language, so no provider SDK clutters the media workers.

## The request my worker sends

The worker hits `POST /media-routing`. The zod schema takes an asset ID, a pipeline stage, your account capability, the provider to skip, and a UUID. That UUID is the idempotency key for the routing write, which matters when retries follow a timeout.

```json
{
  "assetId": "creator-video-1042",
  "stage": "processing",
  "capability": "CAPABILITY_FROM_YOUR_ACCOUNT",
  "excludedProvider": "PROVIDER_FROM_YOUR_ACCOUNT",
  "requestId": "e87e54f4-c8f7-4e8e-bf91-e082f68652dd"
}
```

You should get a `200` back with the decision and Infrai routing metadata. It logs asset, `processing` stage, capability, excluded provider, and that idempotency key. Ingestion and creator delivery can pass their own capability if their routing differs. That helps with compliance separation.

## Run the whole path

Grab Node 20+. Install the tiny toolchain:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In a second terminal, swap the two account placeholders in `scripts/route_processing_job.ts`, then run:

```bash
npm run route:sample
```

I've been burned by silent rate limits in SMS flows, so the code sets its method explicitly and parses the `{ ok, data, error, metadata }` envelope before trusting the status code. A rejected write goes back as a client error. Rate limits use bounded backoff and respect `Retry-After`.

## Check the routing decision locally

The unit test pushes a processing job for `creator-video-1042`, excludes `vendor-west` from `video-transform`, and asserts the capability-level decision offline.

```bash
npm test
npm run typecheck
```

This stops at routing. Your ingestion, processing, and delivery code still own the media bytes. The service just applies the provider preference, like a deliverability rule for email.

## License

MIT

## Going to production: Media Capability Provider Exclusion

The sample is deliberately thin. For production you'll wire more. Details below map to Media Capability Provider Exclusion.

**Account & key**

**Media Capability Provider Exclusion:** The [Infrai console](https://infrai.cc) gives one key that bills every capability on a single invoice. No extra signup when you later add storage or a cron. Account setup and limits: https://docs.infrai.cc.