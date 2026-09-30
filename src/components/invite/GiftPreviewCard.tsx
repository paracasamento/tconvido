import Image from "next/image";
import type { GiftUi } from "@/components/GiftCard";

export function GiftPreviewCard({ gift }: { gift: GiftUi }) {
  const statusLabel = gift.status === "available"
    ? "Disponível"
    : gift.status === "reserved_by_me"
      ? "Seu presente"
      : "Reservado";

  return (
    <article className="public-gift-card">
      <div className="public-gift-image-wrap">
        {gift.image_url ? (
          <Image src={gift.image_url} alt={gift.name} fill sizes="(max-width: 520px) 44vw, 190px" className="public-gift-image" />
        ) : (
          <div className="public-gift-placeholder">
            <img src="/florals/kitchen-arrangement.webp" alt="" aria-hidden />
          </div>
        )}
        <span className={`public-gift-status public-gift-status--${gift.status}`}>{statusLabel}</span>
      </div>
      <div className="public-gift-body">
        <h3>{gift.name}</h3>
        {gift.description && <p>{gift.description}</p>}
      </div>
    </article>
  );
}
