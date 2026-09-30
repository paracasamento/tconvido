"use client";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import type { InviteScreen } from "@/lib/invite-builder";
import { InviteCanvas } from "@/components/invite/InviteCanvas";
export function InviteEntryFlow({ screen }: { screen: InviteScreen }) {
  const router=useRouter(); const startY=useRef<number|null>(null); const open=()=>router.push('/acesso');
  return <div onClick={open} onTouchStart={e=>startY.current=e.touches[0]?.clientY??null} onTouchEnd={e=>{if(startY.current!==null && (e.changedTouches[0]?.clientY??startY.current)-startY.current < -35) open(); startY.current=null}}><InviteCanvas screen={screen} className="visual-invite-cover"/></div>;
}
