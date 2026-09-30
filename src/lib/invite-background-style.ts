import type { CSSProperties } from "react";
import type { InviteScreen } from "@/lib/invite-builder";

export function inviteScreenBackgroundStyle(screen: InviteScreen): CSSProperties {
  return {
    backgroundColor: screen.backgroundColor,
    backgroundImage: screen.useGradient
      ? `linear-gradient(${screen.gradientAngle ?? 180}deg, ${screen.gradientFrom || "#fff"}, ${screen.gradientTo || "#eee"})`
      : screen.backgroundImage
        ? `url("${screen.backgroundImage}")`
        : undefined,
    backgroundSize: screen.backgroundSize || "cover",
    backgroundRepeat: screen.backgroundRepeat || "no-repeat",
    backgroundPosition: `${screen.backgroundPositionX ?? 50}% ${screen.backgroundPositionY ?? 50}%`,
  };
}
