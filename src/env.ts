import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    AWS_REGION: z.string().min(1),
    AWS_S3_BUCKET: z.string().min(1),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    AIRDNA_BASE_URL_NEW: z.string(),
    AIRDNA_CLIENT_TOKEN: z.string(),
    DOCUSIGN_USER_ID: z.string(),
    DOCUSIGN_API_ACCOUNT_ID: z.string(),
    DOCUSIGN_BASE_PATH: z.string(),
    DOCUSIGN_INTEGRATION_KEY_AUTH_CODE: z.string(),
    DOCUSIGN_SECRET_KEY: z.string().optional(),
    DOCUSIGN_OAUTH_SERVER: z.string().optional(),
    DOCUSIGN_RETURN_URL: z.string().optional(),
    DOCUSIGN_RETURN_LIVE_URL: z.string().optional(),
    DOCUSIGN_RETURN_CUSTOMER_LIVE_URL: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().min(1),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().min(1),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js Edge Runtime (e.g.
   * Vercel Edge Functions) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    AIRDNA_BASE_URL_NEW: process.env.AIRDNA_BASE_URL_NEW,
    AIRDNA_CLIENT_TOKEN: process.env.AIRDNA_CLIENT_TOKEN,
    DOCUSIGN_USER_ID: process.env.DOCUSIGN_USER_ID,
    DOCUSIGN_API_ACCOUNT_ID: process.env.DOCUSIGN_API_ACCOUNT_ID,
    DOCUSIGN_BASE_PATH: process.env.DOCUSIGN_BASE_PATH,
    DOCUSIGN_INTEGRATION_KEY_AUTH_CODE: process.env.DOCUSIGN_INTEGRATION_KEY_AUTH_CODE,
    DOCUSIGN_SECRET_KEY: process.env.DOCUSIGN_SECRET_KEY,
    DOCUSIGN_OAUTH_SERVER: process.env.DOCUSIGN_OAUTH_SERVER,
    DOCUSIGN_RETURN_URL: process.env.DOCUSIGN_RETURN_URL,
    DOCUSIGN_RETURN_LIVE_URL: process.env.DOCUSIGN_RETURN_LIVE_URL,
    DOCUSIGN_RETURN_CUSTOMER_LIVE_URL: process.env.DOCUSIGN_RETURN_CUSTOMER_LIVE_URL,
  },
  /**
   * Run `build` or `dev` with SKIP_ENV_VALIDATION to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
