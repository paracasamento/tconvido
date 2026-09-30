"use client";

import Link from "next/link";
import type { InviteElement, InviteScreen } from "@/lib/invite-builder";
import {
  buildScreenScopedCss,
  elementStyleFromConfig,
} from "@/components/invite/renderer/visual-style";

function resolveText(
  value: string | undefined,
  vars: Record<string, string | undefined>
) {
  return (value || "").replace(
    /\{\{([a-zA-Z0-9_]+)\}\}/g,
    (_, key) => vars[key] ?? ""
  );
}

export function InviteCanvas({
  screen,
  vars = {},
  slots = {},
  className = "",
  getElementProps,
  renderElementAdornment,
}: {
  screen: InviteScreen;
  vars?: Record<string, string | undefined>;
  slots?: Record<string, React.ReactNode>;
  className?: string;
  getElementProps?: (element: InviteElement) => React.HTMLAttributes<HTMLElement> & Record<string, unknown>;
  renderElementAdornment?: (element: InviteElement) => React.ReactNode;
}) {
  const bg: React.CSSProperties = {
    backgroundColor: screen.backgroundColor,
    aspectRatio: `390 / ${screen.minHeight}`,
    backgroundImage: screen.useGradient
      ? `linear-gradient(${screen.gradientAngle ?? 180}deg, ${screen.gradientFrom || "#fff"}, ${screen.gradientTo || "#eee"})`
      : screen.backgroundImage
        ? `url("${screen.backgroundImage}")`
        : undefined,
    backgroundSize: screen.backgroundSize || "cover",
    backgroundRepeat: screen.backgroundRepeat || "no-repeat",
    backgroundPosition: `${screen.backgroundPositionX ?? 50}% ${screen.backgroundPositionY ?? 50}%`,
  };

  return (
    <main
      data-screen-id={screen.id}
      className={`visual-invite-screen ${className}`}
      style={bg}
    >
      <style dangerouslySetInnerHTML={{ __html: buildScreenScopedCss(screen) }} />

      {screen.backgroundOverlayOpacity ? (
        <div
          className="visual-screen-overlay"
          style={{
            background: screen.backgroundOverlayColor || "#000",
            opacity: screen.backgroundOverlayOpacity,
          }}
        />
      ) : null}

      <div
        className="visual-paper"
        style={{ opacity: screen.paperOpacity ?? 0.55 }}
      />

      {screen.elements.map(el => {
        const content =
          el.type === "image" ? (
            <img
              src={el.src}
              alt=""
              draggable={false}
              loading={el.y > 65 ? "lazy" : "eager"}
              decoding="async"
              style={{
                width: "100%",
                height: "100%",
                objectFit: el.objectFit || "contain",
                objectPosition: `${el.objectPositionX ?? 50}% ${el.objectPositionY ?? 50}%`,
                filter: `brightness(${el.brightness ?? 100}%) contrast(${el.contrast ?? 100}%) saturate(${el.saturate ?? 100}%) grayscale(${el.grayscale ?? 0}%) blur(${el.blur ?? 0}px)`,
              }}
            />
          ) : el.type === "slot" ? (
            slots[el.slot || ""]
          ) : (
            resolveText(el.text, vars)
          );

        const extra = getElementProps?.(el) || {};
        const common = {
          ...extra,
          "data-visual-id": el.id,
          style: {
            ...elementStyleFromConfig(el),
            ...((extra as any).style || {}),
          },
          className: `visual-element visual-${el.type}${
            el.slot ? ` visual-slot--${el.slot}` : ""
          } ${String((extra as any).className || "")}`.trim(),
        };

        const inner = (
          <>
            {el.overlayOpacity ? (
              <span
                className="visual-element-overlay"
                style={{
                  background: el.overlayColor || "#000",
                  opacity: el.overlayOpacity,
                }}
              />
            ) : null}
            {content}
            {renderElementAdornment?.(el)}
          </>
        );

        if (el.type === "link") {
          return (
            <Link key={el.id} {...(common as any)} href={resolveText(el.href, vars) || "#"}>
              {inner}
            </Link>
          );
        }

        return (
          <div key={el.id} {...common}>
            {inner}
          </div>
        );
      })}
    </main>
  );
}
