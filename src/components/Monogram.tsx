import Image from "next/image";

export function Monogram({
  size = 132,
  priority = false
}: {
  size?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/monograma-pl.png"
      alt="Monograma PL"
      width={size}
      height={size}
      priority={priority}
      className="monogram"
    />
  );
}
