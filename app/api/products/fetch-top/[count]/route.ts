import { getBusinessContext } from "@/lib/get-business-context";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { productSegment } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

type Params = { params: Promise<{ count: string }> };

const CLUSTER_PRIORITY: Record<string, number> = {
  "Fast Movers": 1,
  "Balanced Performance": 2,
};

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getBusinessContext(req);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { count } = await params;
    const parsedCount = parseInt(count, 10);

    if (isNaN(parsedCount) || parsedCount <= 0) {
      return NextResponse.json({ error: "Invalid count parameter" }, { status: 400 });
    }

    const rows = await db
  .select()
  .from(productSegment)
  .where(
    and(
      // Fixed: changed product.businessId to productSegment.businessId
      eq(productSegment.businessId, ctx.businessId), 
      inArray(productSegment.clusterName, Object.keys(CLUSTER_PRIORITY))
    )
  )
  .orderBy(
    // Best practice: Use sql.raw or a template literal for Drizzle's sql helper
    sql`CASE ${productSegment.clusterName}
      WHEN 'Fast Movers' THEN 1
      WHEN 'Balanced Performance' THEN 2
      ELSE 3
    END`
  )
  .limit(parsedCount);

    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error fetching top products" }, { status: 500 });
  }
}