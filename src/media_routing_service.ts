import { createServer } from "node:http";
import { ZodError } from "zod";
import { applyProviderExclusion, InfraiError } from "./infrai_routing_client.js";
import { decideProviderExclusion, mediaRoutingRequestSchema } from "./routing_decision.js";

const port = Number(process.env.PORT ?? "3000");
const apiKey = process.env.INFRAI_API_KEY;

if (!apiKey) throw new Error("INFRAI_API_KEY is required");

const server = createServer(async (request, response) => {
  response.setHeader("content-type", "application/json");
  if (request.method !== "POST" || request.url !== "/media-routing") {
    response.writeHead(404).end(JSON.stringify({ error: "Route not found" }));
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const input = mediaRoutingRequestSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const decision = decideProviderExclusion(input);
    const providerRouting = await applyProviderExclusion(apiKey, decision);

    response.writeHead(200).end(JSON.stringify({ decision, providerRouting }));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      response.writeHead(400).end(JSON.stringify({ error: "Invalid request body" }));
      return;
    }
    if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      response.writeHead(status).end(JSON.stringify({ error: error.code, details: error.details }));
      return;
    }
    response.writeHead(502).end(JSON.stringify({ error: "Routing request could not be completed" }));
  }
});

server.listen(port, () => {
  console.log(`Media routing service listening on http://localhost:${port}`);
});
