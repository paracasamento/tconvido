export type InviteHeroMode = "image" | "composition";

/**
 * Base visual configuration for the public invitation.
 * The future visual editor can persist these same values without changing layout structure.
 */
export const inviteDesign = {
  colors: {
    primary: "#0f0a71",
    background: "#fbfaf7",
    surface: "#ffffff",
    muted: "#747080",
    olive: "#7d846a"
  },
  hero: {
    mode: "composition" as InviteHeroMode,
    imageUrl: null as string | null,
    imagePosition: "50% 50%",
    imageOpacity: 1,
    overlayOpacity: 0,
    showTextOnImage: false,
    background: "#fbfaf7"
  }
};
