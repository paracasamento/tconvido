import type { ReactNode } from "react";
import type { InviteScreen } from "@/lib/invite-builder";
import {
  InviteCanvas,
  inviteScreenBackgroundStyle,
} from "@/components/invite/InviteCanvas";

function transparentScreen(screen: InviteScreen): InviteScreen {
  return {
    ...screen,
    backgroundColor: "transparent",
    backgroundImage: undefined,
    useGradient: false,
    gradientFrom: undefined,
    gradientTo: undefined,
    backgroundOverlayOpacity: 0,
    paperOpacity: 0,
  };
}

export function InviteContinuousFlow({
  backgroundScreen,
  sections,
}: {
  backgroundScreen: InviteScreen;
  sections: Array<{
    key: string;
    screen: InviteScreen;
    vars?: Record<string, string | undefined>;
    slots?: Record<string, ReactNode>;
  }>;
}) {
  return (
    <div
      className="visual-invite-flow"
      style={inviteScreenBackgroundStyle(backgroundScreen)}
    >
      {backgroundScreen.backgroundOverlayOpacity ? (
        <div
          className="visual-flow-overlay"
          style={{
            background: backgroundScreen.backgroundOverlayColor || "#000",
            opacity: backgroundScreen.backgroundOverlayOpacity,
          }}
        />
      ) : null}

      <div
        className="visual-flow-paper"
        style={{ opacity: backgroundScreen.paperOpacity ?? 0.55 }}
      />

      <div className="visual-flow-sections">
        {sections.map(section => (
          <InviteCanvas
            key={section.key}
            screen={transparentScreen(section.screen)}
            vars={section.vars}
            slots={section.slots}
            className="visual-invite-flow-section"
          />
        ))}
      </div>
    </div>
  );
}
