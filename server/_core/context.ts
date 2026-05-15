import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Cached JWKS fetcher — jose reuses the cached keys automatically
let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJWKS() {
  if (!_jwks) {
    if (!ENV.supabaseUrl) throw new Error("VITE_SUPABASE_URL is not set");
    _jwks = createRemoteJWKSet(new URL(`${ENV.supabaseUrl}/auth/v1/.well-known/jwks.json`));
  }
  return _jwks;
}

async function getUserFromRequest(
  req: CreateExpressContextOptions["req"]
): Promise<User | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, getJWKS());

    const supabaseUserId = payload.sub;
    if (!supabaseUserId) return null;

    const email = (payload.email as string | undefined) ?? null;
    const userMeta = (payload.user_metadata as Record<string, unknown> | undefined) ?? {};
    const appMeta = (payload.app_metadata as Record<string, unknown> | undefined) ?? {};
    const name = ((userMeta.full_name ?? userMeta.name) as string | undefined) ?? null;
    const loginMethod = (appMeta.provider as string | undefined) ?? null;

    let user = await db.getUserByOpenId(supabaseUserId);
    if (!user) {
      await db.upsertUser({
        openId: supabaseUserId,
        email,
        name,
        loginMethod,
        lastSignedIn: new Date(),
      });
      user = await db.getUserByOpenId(supabaseUserId) ?? null;
    }

    return user ?? null;
  } catch (error) {
    console.error("[Auth] JWT verification or DB lookup failed:", error);
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const user = await getUserFromRequest(opts.req);
  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
