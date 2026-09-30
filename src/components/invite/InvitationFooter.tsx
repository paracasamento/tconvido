import { Monogram } from "@/components/Monogram";

export function InvitationFooter({ coupleNames }: { coupleNames: string }) {
  return (
    <footer className="public-invite-footer">
      <img className="public-footer-floral" src="/florals/floral-divider.webp" alt="" aria-hidden />
      <Monogram size={44} />
      <strong>{coupleNames}</strong>
      <span>Esperamos você ♡</span>
    </footer>
  );
}
