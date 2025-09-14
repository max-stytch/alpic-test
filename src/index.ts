import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import express, { type Request, type Response } from "express";

import { getServer } from "./server.js";
import { config } from "./config.js";
import { stytchVerifier } from "./stytch.js";
import { metadataHandler } from "./metadata.js";

const app = express();
app.use(express.json());

const authDomain = process.env.STYTCH_DOMAIN;
if(!authDomain) {
  throw new Error("Missing auth domain. Ensure STYTCH_DOMAIN env variable is set.");
}

app.use(
  "/.well-known/oauth-protected-resource",
  metadataHandler(async () => ({
    resource: new URL("http://localhost:3000").href,
    authorization_servers: [authDomain],
    scopes_supported: ["openid", "email", "profile"],
  })),
);

app.use(
  "/.well-known/oauth-authorization-server",
  metadataHandler(async () =>
    fetch(new URL("./well-known/oauth-authorization-server", authDomain))
      .then((res) => res.json()),
  ),
);

const bearerAuthMiddleware = requireBearerAuth({
  verifier: {
    verifyAccessToken: stytchVerifier,
  },
  resourceMetadataUrl: "http://localhost:3000",
});

app.post("/mcp", bearerAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      transport.close();
    });

    const server = getServer();
    await server.connect(transport);

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

app.get("/mcp", bearerAuthMiddleware, async (req: Request, res: Response) => {
  console.log("Received GET MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    }),
  );
});

app.delete("/mcp", bearerAuthMiddleware, async (req: Request, res: Response) => {
  console.log("Received GET MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    }),
  );
});

app.listen(config.MCP_HTTP_PORT, (error) => {
  if (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
  console.log(`MCP Streamable HTTP Server listening on port ${config.MCP_HTTP_PORT}`);
});

process.on("SIGINT", async () => {
  console.log("Server shutdown complete");
  process.exit(0);
});
