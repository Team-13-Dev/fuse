import type { Metadata } from "next";
import { cookies } from "next/headers";
import { db } from "@/db";
import { business } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DashboardShell } from "@/app/components/dashboard/DashboardShell";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("business_ctx")?.value;
    const ctx = raw ? JSON.parse(raw) : null;

    if (ctx?.businessId) {
      const [store] = await db
        .select({ name: business.name })
        .from(business)
        .where(eq(business.id, ctx.businessId))
        .limit(1);

      if (store?.name) {
        return {
          title:       `FUSE — ${store.name.toUpperCase()}`,
          description: "Command your market.",
        };
      }
    }
  } catch {
    // Fall through to default
  }

  return {
    title:       "FUSE — Dashboard",
    description: "Command your market.",
  };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}