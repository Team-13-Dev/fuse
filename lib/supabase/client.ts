import { createClient } from "@supabase/supabase-js"

const supabaseUrl   = process.env.SUPABASE_URL!
const supabaseKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
  )
}

/**
 * Server-only Supabase client using the service role key.
 * Never expose this on the client — it bypasses Row Level Security.
 * Use only inside API routes and server actions.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

/** The storage bucket name for pipeline imports. */
export const IMPORT_BUCKET = "pipeline-imports"