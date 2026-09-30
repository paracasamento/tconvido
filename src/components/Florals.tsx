import Image from "next/image";

export function FloralFrame({ subtle = false }: { subtle?: boolean }) {
  return (
    <div className={`floral-frame ${subtle ? "floral-frame--subtle" : ""}`} aria-hidden>
      <Image
        src="/florals/floral-top-left.webp"
        alt=""
        width={500}
        height={500}
        className="floral floral--tl"
        priority
      />
      <Image
        src="/florals/floral-top-right.webp"
        alt=""
        width={500}
        height={500}
        className="floral floral--tr"
        priority
      />
    </div>
  );
}

export function FloralDivider() {
  return (
    <Image
      src="/florals/floral-divider.webp"
      alt=""
      width={560}
      height={187}
      className="floral-divider"
    />
  );
}
