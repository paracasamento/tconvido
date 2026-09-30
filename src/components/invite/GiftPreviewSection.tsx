import Link from "next/link";
import { Gift } from "lucide-react";
import type { GiftUi } from "@/components/GiftCard";
import { GiftPreviewCard } from "@/components/invite/GiftPreviewCard";

export function GiftPreviewSection({
  gifts,
  unlocked,
  hasGuest
}: {
  gifts: GiftUi[];
  unlocked: boolean;
  hasGuest: boolean;
}) {
  return (
    <section id="presentes" className="public-section public-gifts-section">
      <div className="public-section-symbol" aria-hidden><Gift size={18} /></div>
      <p className="public-section-kicker">Lista de presentes</p>
      <h2>Um carinho para a nossa nova casa</h2>
      <p className="public-section-copy">Sua presença já é especial. Se quiser nos presentear, escolha algo da nossa lista.</p>

      {!hasGuest ? (
        <div className="public-gift-lock">
          <strong>Lista protegida</strong>
          <span>Os presentes ficam disponíveis para convidados cadastrados.</span>
        </div>
      ) : !unlocked ? (
        <div className="public-gift-lock">
          <strong>Confirme sua presença primeiro</strong>
          <span>Depois da confirmação, a lista será liberada aqui.</span>
          <a href="#presenca" className="public-secondary-button">Confirmar presença</a>
        </div>
      ) : (
        <>
          {gifts.length > 0 ? (
            <div className="public-gift-grid">
              {gifts.map((gift) => <GiftPreviewCard gift={gift} key={gift.id} />)}
            </div>
          ) : (
            <div className="public-gift-lock">
              <strong>A lista está sendo preparada</strong>
              <span>Em breve os presentes aparecerão por aqui.</span>
            </div>
          )}
          <Link href="/presentes" className="public-primary-button public-primary-button--center">
            Ver todos os presentes
          </Link>
        </>
      )}
    </section>
  );
}
