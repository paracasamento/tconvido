"use client";

import Link from "next/link";
import { Gift, Eye, Undo2 } from "lucide-react";
import { ReleaseGiftButton } from "@/components/ReleaseGiftButton";
import styles from "./CurrentReservationNotice.module.css";

export function CurrentReservationNotice({
  giftId,
  giftName,
}: {
  giftId: string;
  giftName: string;
}) {
  return (
    <aside className={styles.notice} aria-label="Seu presente reservado">
      <div className={styles.icon} aria-hidden>
        <Gift size={20} strokeWidth={1.7} />
      </div>

      <div className={styles.copy}>
        <span>Seu presente reservado</span>
        <strong>{giftName}</strong>
      </div>

      <div className={styles.actions}>
        <Link href="/meu-presente" className={styles.view}>
          <Eye size={14} />
          <span>Ver</span>
        </Link>

        <ReleaseGiftButton
          giftId={giftId}
          name={giftName}
          className={styles.release}
          label="Liberar"
        />
      </div>
    </aside>
  );
}
