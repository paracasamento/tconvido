import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminLog } from "@/lib/admin-log";
import { getAdminSession } from "@/lib/sessions";
import { sameOrigin } from "@/lib/security";
const schema=z.object({colors:z.array(z.object({name:z.string().trim().max(40),hex:z.string().regex(/^#[0-9a-fA-F]{6}$/)})).max(8)});
export async function PATCH(request:Request){
  if(!sameOrigin(request))return NextResponse.json({message:"Origem inválida."},{status:403});
  const session=await getAdminSession(); if(!session)return NextResponse.json({message:"Não autorizado."},{status:401});
  const parsed=schema.safeParse(await request.json().catch(()=>null)); if(!parsed.success)return NextResponse.json({message:"Confira as cores informadas."},{status:400});
  const colors=parsed.data.colors.map(c=>({name:c.name.replace(/\s+/g," ").trim(),hex:c.hex.toLowerCase()}));
  const sql=db(); await sql`UPDATE events SET gift_color_preferences=${JSON.stringify(colors)}::jsonb WHERE id=${session.event_id}`;
  await adminLog({eventId:session.event_id,adminId:session.admin_id,action:"gift_color_preferences_updated",entityType:"event",entityId:session.event_id,metadata:{colors}});
  return NextResponse.json({ok:true,colors});
}