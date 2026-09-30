import Image from "next/image";

export function InviteFloralBackdrop({ soft = false }: { soft?: boolean }) {
  return (
    <div className={`invite-floral-scene ${soft ? "invite-floral-scene--soft" : ""}`} aria-hidden>
      <div className="invite-paper-pattern" />
      <Image
        src="/florals/floral-top-left.webp"
        alt=""
        width={1200}
        height={1200}
        className="invite-corner invite-corner--tl"
        priority
      />
      <Image
        src="/florals/floral-top-right.webp"
        alt=""
        width={1200}
        height={1200}
        className="invite-corner invite-corner--tr"
        priority
      />
      <Image
        src="/florals/floral-top-right.webp"
        alt=""
        width={1200}
        height={1200}
        className="invite-corner invite-corner--bl"
      />
      <Image
        src="/florals/floral-top-left.webp"
        alt=""
        width={1200}
        height={1200}
        className="invite-corner invite-corner--br"
      />
    </div>
  );
}
