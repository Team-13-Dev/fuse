import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { product } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
    try{
        // const products = await db.select().from(product).where(eq(product.id, Number(params.id)))
    }catch(error){
        return NextResponse.json({ status: 500, message: `Internal server error ${error}`});
    }
}