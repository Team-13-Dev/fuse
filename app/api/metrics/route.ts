import { db } from "@/db"
import { order, customer, product } from "@/db/schema"
import { getBusinessContext } from "@/lib/get-business-context"
import { eq, sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const ctx = await getBusinessContext(req);

    if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ctx.businessId) {
      return Response.json(
        { error: "businessId is required" },
        { status: 400 }
      )
    }
    const businessId = ctx.businessId;

    const result = await db
    .select({
        customers: sql<number>`(
        select count(*) from ${customer}
        where ${customer.businessId} = ${businessId}
        )`,
        products: sql<number>`(
        select count(*) from ${product}
        where ${product.businessId} = ${businessId}
        )`,
        orders: sql<number>`(
        select count(*) from ${order}
        where ${order.businessId} = ${businessId}
        )`,
        revenue: sql<number>`(
        select coalesce(sum(${order.total}), 0)
        from ${order}
        where ${order.businessId} = ${businessId}
        )`,
    })
    .from(sql`(select 1) as t`)
    .limit(1)

    return Response.json(result[0])
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}