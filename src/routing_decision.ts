import { z } from "zod";

export const mediaRoutingRequestSchema = z.object({
  assetId: z.string().min(1),
  stage: z.enum(["ingestion", "processing", "delivery"]),
  capability: z.string().min(1),
  excludedProvider: z.string().min(1),
  requestId: z.string().uuid()
}).strict();

export type MediaRoutingRequest = z.infer<typeof mediaRoutingRequestSchema>;

export type RoutingDecision = {
  assetId: string;
  stage: MediaRoutingRequest["stage"];
  capability: string;
  excludedProvider: string;
  idempotencyKey: string;
};

export function decideProviderExclusion(input: MediaRoutingRequest): RoutingDecision {
  return {
    assetId: input.assetId,
    stage: input.stage,
    capability: input.capability,
    excludedProvider: input.excludedProvider,
    idempotencyKey: input.requestId
  };
}
