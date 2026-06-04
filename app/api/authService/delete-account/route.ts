import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import {
  business, customer, product, order, orderItem,
  teamMember, integration, subscription, user,
  analysisJob, productSegment, productClusterSummary,
} from "@/db/schema"
import { eq, inArray } from "drizzle-orm"
import { auth } from "@/lib/auth"

const CHUNK = 500

async function deleteInChunks<T>(
  ids: T[],
  fn: (chunk: T[]) => Promise<unknown>,
) {
  for (let i = 0; i < ids.length; i += CHUNK) {
    await fn(ids.slice(i, i + CHUNK))
  }
}

export async function DELETE(req: NextRequest) {
  // Only needs a valid session — no business context required
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id

  try {
    // 1. All businesses owned by this user
    const ownedBusinesses = await db
      .select({ id: business.id })
      .from(business)
      .where(eq(business.userId, userId))

    for (const biz of ownedBusinesses) {
      const bizId = biz.id

      const customerRows = await db
        .select({ id: customer.id })
        .from(customer)
        .where(eq(customer.businessId, bizId))

      const customerIds = customerRows.map(c => c.id)

      let orderIds: string[] = []
      if (customerIds.length > 0) {
        const chunks = []
        for (let i = 0; i < customerIds.length; i += CHUNK) {
          chunks.push(
            db.select({ id: order.id })
              .from(order)
              .where(inArray(order.customerId, customerIds.slice(i, i + CHUNK)))
          )
        }
        const results = await Promise.all(chunks)
        orderIds = results.flat().map(o => o.id)
      }

      // Delete orderItems first, then orders — chunked to stay under Neon param limit
      await deleteInChunks(orderIds, chunk =>
        db.delete(orderItem).where(inArray(orderItem.orderId, chunk))
      )

      await deleteInChunks(orderIds, chunk =>
        db.delete(order).where(inArray(order.id, chunk))
      )

      await Promise.all([
        db.delete(product ).where(eq(product.businessId,  bizId)),
        db.delete(customer).where(eq(customer.businessId, bizId)),
      ])

      // Segment tables (cascade from analysisJob, but explicit is safer)
      await db.delete(productSegment).where(eq(productSegment.businessId, bizId))
      await db.delete(productClusterSummary).where(eq(productClusterSummary.businessId, bizId))
      await db.delete(analysisJob).where(eq(analysisJob.businessId, bizId))

      await Promise.all([
        db.delete(teamMember  ).where(eq(teamMember.businessId,   bizId)),
        db.delete(integration ).where(eq(integration.businessId,  bizId)),
        db.delete(subscription).where(eq(subscription.businessId, bizId)),
      ])

      await db.delete(business).where(eq(business.id, bizId))
    }

    // 2. Team memberships where user is a member of someone else's business
    await db.delete(teamMember).where(eq(teamMember.userId, userId))

    // 3. Delete the user — cascades to session + account (better-auth tables)
    await db.delete(user).where(eq(user.id, userId))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[delete-account] failed:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Deletion failed" },
      { status: 500 }
    )
  }
}
