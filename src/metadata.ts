import express from "express";
import cors from "cors";
import { allowedMethods } from "@modelcontextprotocol/sdk/server/auth/middleware/allowedMethods.js";

// metadataHandler is based on the MCP SDK metadata handler from
// @modelcontextprotocol/sdk/server/auth/handlers/metadata.js
// However it allows metadata to be retrieved async - which means we can proxy the AS metadata dynamically
// instead of hardcoding it
export function metadataHandler(getMetadata: () => Promise<unknown>) {
  // Nested router so we can configure middleware and restrict HTTP method
  const router = express.Router();
  // Configure CORS to allow any origin, to make accessible to web-based MCP clients
  router.use(cors());
  router.use(allowedMethods(["GET"]));
  router.get("/", (req, res, next) => {
    getMetadata()
      .then((metadata) => {
        res.status(200).json(metadata);
      })
      .catch(next);
  });
  return router;
}
