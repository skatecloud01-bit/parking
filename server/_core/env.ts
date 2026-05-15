export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Comma-separated list of allowed CORS origins (e.g. your Vercel frontend URL).
  corsOrigin: process.env.CORS_ORIGIN ?? "",
  // Supabase — URL used to fetch JWKS for JWT verification
  supabaseUrl: process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
};
