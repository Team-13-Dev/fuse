import { product } from "@/db/schema";
import { NextResponse } from "next/server";
import { db } from "@/db";


export async function GET(){
    try{
        const allProducts = await db.select().from(product);

        if(!allProducts){
            return NextResponse.json({ status: 400, message: "No data found"})
        }

        return NextResponse.json({ status: 200, products: allProducts });
    }catch(error){
        return NextResponse.json({ status: 500 , message: `Internal server error ${error}`})
    }
}