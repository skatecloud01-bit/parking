import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

async function getUserFromRequest(
  req: CreateExpressContextOptions["req"]
): Promise<User | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  if (!ENV.supabaseJwtSecret) {
    console.warn("[Auth] SUPABASE_JWT_SECRET is not set");
    return null;
  }

  try {
    const secret = new TextEncoder().encode(ENV.supabaseJwtSecret);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

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
  } catch {
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
