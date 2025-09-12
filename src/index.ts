import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { mcpAuthMetadataRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import express, { type Request, type Response } from "express";

import { getServer } from "./server.js";
import { config } from "./config.js";
import { stytchVerifier } from "./stytch.js";

const app = express();
app.use(express.json());

const authDomain = process.env.STYTCH_DOMAIN!;
app.use(
  mcpAuthMetadataRouter({
    oauthMetadata: {
      issuer: authDomain,
      token_endpoint: `${authDomain}/v1/oauth2/token`,
      registration_endpoint: `${authDomain}/v1/oauth2/register`,
      jwks_uri: `${authDomain}/.well-known/jwks.json`,
      userinfo_endpoint: `${authDomain}/v1/oauth2/userinfo`,
      "authorization_endpoint": "https://mcp-stytch-consumer-todo-list.maxwell-gerber42.workers.dev/oauth/authorize",
      "code_challenge_methods_supported": [
        "S256"
      ],
      "grant_types_supported": [
        "authorization_code",
        "refresh_token"
      ],
      "response_types_supported": [
        "code",
        "code token"
      ],
      "scopes_supported": [
        "openid",
        "profile",
        "email",
        "phone",
        "offline_access"
      ],
      "token_endpoint_auth_methods_supported": [
        "client_secret_basic",
        "client_secret_post",
        "none"
      ],
    },
    resourceServerUrl: new URL("http://localhost:3000"),
  })
);

const bearerAuthMiddleware = requireBearerAuth({
  verifier: {
    verifyAccessToken: stytchVerifier
  },
  resourceMetadataUrl: 'http://localhost:3000',
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

app.get('/test', (req: Request, res: Response) => {
  res.status(200).json({yay: true});
})

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
