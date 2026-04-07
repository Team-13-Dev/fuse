import { db } from "@/db";
import { customer } from "@/db/schema";
import { getBusinessContext } from "@/lib/get-business-context";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest){
    try{
        const ctx = await getBusinessContext(req);
        const { fullName, email, phoneNumber, segment } = await req.json();

        if(!ctx) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }   

        if(!ctx.businessId){
            return NextResponse.json({ status: 401 , error: "No Business ID was found."})
        }
        
        await db
        .insert(customer)
        .values({
            fullName,
            email,
            phoneNumber,
            segment,
            businessId: ctx.businessId
        })
        .returning();

        return NextResponse.json({ status: 200, message: "New customer created"});
    }catch(error){
        return NextResponse.json({ status: 500, message: `Internal server error: ${error}` })
    }
}