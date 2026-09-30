import assert from "node:assert/strict";
import test from "node:test";
import { decideProviderExclusion, mediaRoutingRequestSchema } from "../src/routing_decision.js";

test("a processing job excludes its selected provider for only that capability", () => {
  const input = mediaRoutingRequestSchema.parse({
    assetId: "creator-video-1042",
    stage: "processing",
    capability: "video-transform",
    excludedProvider: "vendor-west",
    requestId: "e87e54f4-c8f7-4e8e-bf91-e082f68652dd"
  });

  assert.deepEqual(decideProviderExclusion(input), {
    assetId: "creator-video-1042",
    stage: "processing",
    capability: "video-transform",
    excludedProvider: "vendor-west",
    idempotencyKey: "e87e54f4-c8f7-4e8e-bf91-e082f68652dd"
  });
});
