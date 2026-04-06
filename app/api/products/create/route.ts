import { NextRequest, NextResponse } from "next/server";

export async function GET(){
    try{

    }catch(error){
        return NextResponse.json({ status: 500, message: `Internal server error : ${error}`});
    }
}