// app/api/products/top/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { product, orderItem, order, productSegment } from "@/db/schema";
import { eq, sql, desc, asc } from "drizzle-orm";
import { getBusinessContext } from "@/lib/get-business-context";

const SEGMENT_PRIORITY: Record<string, number> = {
  "Premium Stars":       1,
  "Fast Movers":         2,
  "Balanced Performance": 3,
};

export async function GET(req: NextRequest) {
    const ctx = await getBusinessContext(req);
    const businessId = ctx?.businessId;
    const count = Math.max(3, Math.min(
        parseInt(req.nextUrl.searchParams.get("count") ?? "3", 10),
        50
    ));

    if (!businessId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const rows = await db
    .select({
      id:           product.id,
      name:         product.name,
      description:  product.description,
      price:        product.price,
      imagesUrl:    product.imagesUrl,
      stock:        product.stock,
      clusterName:  productSegment.clusterName,
      totalRevenue: sql<number>`
        SUM(
          (${orderItem.quantity} * ${orderItem.unitPrice})
          - COALESCE(${orderItem.itemDiscount}, 0)
        )
      `.as("total_revenue"),
      totalSold: sql<number>`SUM(${orderItem.quantity})`.as("total_sold"),
    })
    .from(product)
    .innerJoin(orderItem,      eq(orderItem.productId,    product.id))
    .innerJoin(order,          eq(order.id,               orderItem.orderId))
    .leftJoin(productSegment,  eq(productSegment.productId, product.id))   // LEFT so unclassified products still show
    .where(eq(product.businessId, businessId))
    .groupBy(
      product.id,
      product.name,
      product.description,
      product.price,
      product.imagesUrl,
      product.stock,
      productSegment.clusterName,
    )
    .orderBy(
      // Priority tier first (NULLs / unknown segments go last)
      sql`CASE ${productSegment.clusterName}
            WHEN 'Premium Stars'        THEN 1
            WHEN 'Fast Movers'          THEN 2
            WHEN 'Balanced Performance' THEN 3
            ELSE                             4
          END`,
      desc(sql`total_revenue`),   // within each tier, best revenue first
    )
    .limit(count);

  return NextResponse.json({ products: rows });
}