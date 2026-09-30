export function InvitationMessage({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <section className="public-section public-message-section">
      <span className="public-mini-rule" aria-hidden><i />♡<i /></span>
      <p className="public-section-kicker">Com carinho</p>
      <p className="public-message-copy">{message}</p>
    </section>
  );
}
