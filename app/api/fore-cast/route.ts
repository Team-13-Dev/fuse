import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db"; 
import { order } from "@/db/schema";
import { getBusinessContext } from "@/lib/get-business-context";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getBusinessContext(req);

    const businessId = ctx?.businessId

    if (!businessId) {
      return NextResponse.json(
        { error: "Missing businessId parameter" },
        { status: 400 }
      );
    }

    // Aggregate daily revenue using Drizzle SQL operators
    const dailySales = await db
      .select({
        order_date: sql<string>`DATE(${order.createdAt})`,
        // Cast the decimal total to numeric/float so it parses correctly in JSON
        revenue: sql<number>`SUM(${order.total}::numeric)::float`,
      })
      .from(order)
      .where(
        sql`${order.businessId} = ${businessId} AND ${order.status} != 'cancelled'`
      )
      .groupBy(sql`DATE(${order.createdAt})`)
      .orderBy(sql`DATE(${order.createdAt})`);

    return NextResponse.json(dailySales);

  } catch (error) {
    console.error("Failed to fetch forecast data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}