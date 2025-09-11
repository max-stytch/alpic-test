import { Client } from "stytch";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    client = new Client({
      project_id: process.env.STYTCH_PROJECT_ID!,
      secret: process.env.STYTCH_PROJECT_SECRET!,
      custom_base_url: process.env.STYTCH_DOMAIN!,
    });
  }
  return client;
}

export const stytchVerifier = async (token: string): Promise<AuthInfo> => {
  try {
    const { audience, scope, expires_at, ...rest } = await getClient().idp.introspectTokenLocal(token);
    return {
      token,
      clientId: audience as string,
      scopes: scope.split(" "),
      expiresAt: expires_at,
      extra: rest,
    } satisfies AuthInfo;
  } catch (error) {
    console.error('FAILED AUTH')
    console.error(error);
    throw error
  }
};
