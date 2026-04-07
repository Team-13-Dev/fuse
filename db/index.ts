// @/db/index.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema"; // Import your schema file

const sql = neon(process.env.DATABASE_URL!);

// Pass the 'schema' object as the second argument
export const db = drizzle(sql, { schema });