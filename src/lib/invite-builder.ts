export type InviteScreenId = "cover" | "access" | "invite" | "rsvp" | "gifts";
export type InviteElementType = "text" | "image" | "link" | "slot" | "box";
export type InviteTextAlign = "left" | "center" | "right" | "justify";
export type InviteObjectFit = "contain" | "cover" | "fill" | "none";
export type InviteTextTransform = "none" | "uppercase" | "lowercase" | "capitalize";
export type InviteBorderStyle = "solid" | "dashed" | "dotted" | "double" | "none";
export type InviteBackgroundSize = "cover" | "contain" | "auto" | "100% 100%";
export type InviteBackgroundRepeat = "no-repeat" | "repeat" | "repeat-x" | "repeat-y";

export type InvitePartStyle = {
  text?: string;
  icon?: string;
  color?: string;
  placeholderColor?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: InviteBackgroundSize;
  backgroundRepeat?: InviteBackgroundRepeat;
  backgroundPositionX?: number;
  backgroundPositionY?: number;
  opacity?: number;
  width?: string;
  height?: string;
  minHeight?: number;
  maxWidth?: string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  /** Visual offset inside a functional slot, in pixels. */
  offsetX?: number;
  offsetY?: number;
  /** Hide this internal part without affecting sibling functional scenarios. */
  visible?: boolean;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: InviteBorderStyle;
  borderRadius?: number;
  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowSpread?: number;
  shadowColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline" | "line-through";
  textTransform?: InviteTextTransform;
  textAlign?: InviteTextAlign;
  lineHeight?: number;
  letterSpacing?: number;
  display?: string;
  justifyContent?: string;
  justifyItems?: string;
  alignItems?: string;
  gap?: number;
  flexDirection?: "row" | "column";
  objectFit?: InviteObjectFit;
  objectPositionX?: number;
  objectPositionY?: number;
  customCss?: string;
  hoverCss?: string;
  focusCss?: string;
  activeCss?: string;
};

export type InviteElement = {
  id: string;
  name: string;
  type: InviteElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotate: number;
  scaleX?: number;
  scaleY?: number;
  zIndex: number;
  visible: boolean;
  locked?: boolean;
  /**
   * Functional content such as RSVP can determine its own height.
   * The editor still stores a numeric height for backwards compatibility,
   * but renderers ignore it while autoHeight is enabled.
   */
  autoHeight?: boolean;

  text?: string;
  src?: string;
  href?: string;
  slot?: "access-form" | "rsvp-controls" | "rsvp-status" | "rsvp-flow" | "gift-grid" | "gift-note" | "countdown";
  partStyles?: Record<string, InvitePartStyle>;
  /**
   * Per-scenario internal overrides. RSVP uses this so each step behaves like
   * an independent mini-screen while preserving one functional component.
   */
  scenarioPartStyles?: Record<string, Record<string, InvitePartStyle>>;
  customCss?: string;
  hoverCss?: string;
  focusCss?: string;
  activeCss?: string;

  color?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: InviteBackgroundSize;
  backgroundRepeat?: InviteBackgroundRepeat;
  backgroundPositionX?: number;
  backgroundPositionY?: number;
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
  useGradient?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: InviteBorderStyle;
  borderRadius?: number;
  paddingX?: number;
  paddingY?: number;

  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowSpread?: number;
  shadowColor?: string;

  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline" | "line-through";
  textTransform?: InviteTextTransform;
  textAlign?: InviteTextAlign;
  lineHeight?: number;
  letterSpacing?: number;

  objectFit?: InviteObjectFit;
  objectPositionX?: number;
  objectPositionY?: number;
  brightness?: number;
  contrast?: number;
  saturate?: number;
  grayscale?: number;
  blur?: number;
  flipX?: boolean;
  flipY?: boolean;

  controlHeight?: number;
  controlGap?: number;
  controlRadius?: number;
  controlFontSize?: number;
  controlFontFamily?: string;
  primaryBackground?: string;
  primaryColor?: string;
  secondaryBackground?: string;
  secondaryColor?: string;
  controlBorderColor?: string;
  fieldHeight?: number;
  fieldRadius?: number;
};

export type InviteScreen = {
  id: InviteScreenId;
  name: string;
  backgroundColor: string;
  minHeight: number;
  paperOpacity?: number;
  backgroundImage?: string;
  backgroundSize?: InviteBackgroundSize;
  backgroundRepeat?: InviteBackgroundRepeat;
  backgroundPositionX?: number;
  backgroundPositionY?: number;
  backgroundOpacity?: number;
  backgroundOverlayColor?: string;
  backgroundOverlayOpacity?: number;
  useGradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
  customCss?: string;
  /**
   * Incremented when a screen receives a structural default-layout upgrade.
   * Existing saved designs are migrated once, then remain editable normally.
   */
  layoutRevision?: number;
  /**
   * Tombstones for default elements removed in the visual editor.
   * Without this, normalization would recreate any missing default element.
   */
  deletedElementIds?: string[];
  elements: InviteElement[];
};

export type RsvpScenarioId =
  | "children-question"
  | "form-no-children"
  | "form-children"
  | "confirmed"
  | "error";

export const RSVP_SCENARIO_IDS: RsvpScenarioId[] = [
  "children-question",
  "form-no-children",
  "form-children",
  "confirmed",
  "error",
];

export type InviteRsvpScenarioScreen = {
  id: RsvpScenarioId;
  name: string;
  screenStyle?: Partial<Omit<InviteScreen, "id" | "name" | "elements" | "deletedElementIds">>;
  deletedElementIds?: string[];
  elements: InviteElement[];
};

export type InviteSavedLayout = {
  id: string;
  name: string;
  sourceScreenId: InviteScreenId;
  createdAt: string;
  updatedAt: string;
  /** Version 2 stores decoration image elements only. */
  decorationRevision?: 2;
  /** Background-only screen styling used as a reusable decoration preset. */
  screenStyle: Omit<InviteScreen, "id" | "name" | "elements" | "deletedElementIds" | "layoutRevision">;
  /** Decoration images only. Texts, links and functional slots are never stored here. */
  elements: InviteElement[];
};

export type InviteFlowSettings = {
  continuousBackground?: boolean;
  backgroundSource?: "invite" | "gifts";
  /**
   * Independent invitation composition used only after RSVP confirmation.
   * When absent, the after-confirmation view starts from the regular invite.
   */
  afterInviteScreen?: InviteScreen;
};

export type InviteVisualConfig = {
  version: 2;
  screens: Record<InviteScreenId, InviteScreen>;
  savedLayouts?: Record<string, InviteSavedLayout>;
  rsvpScenarios?: Record<RsvpScenarioId, InviteRsvpScenarioScreen>;
  inviteFlow?: InviteFlowSettings;
};

export type LegacyInviteVisualConfigV1 = {
  version: 1;
  screens: Record<InviteScreenId, InviteScreen>;
};

export const SLOT_PARTS: Record<NonNullable<InviteElement["slot"]>, { id: string; name: string }[]> = {
  "access-form": [
    { id: "form", name: "Formulário" },
    { id: "name-label", name: "Label nome" },
    { id: "name-field", name: "Campo nome" },
    { id: "name-icon", name: "Ícone nome" },
    { id: "name-input", name: "Texto/placeholder nome" },
    { id: "code-label", name: "Label código" },
    { id: "code-field", name: "Campo código" },
    { id: "code-icon", name: "Ícone código" },
    { id: "code-input", name: "Texto/placeholder código" },
    { id: "submit-button", name: "Botão abrir" },
    { id: "submit-text", name: "Texto do botão" },
    { id: "submit-icon", name: "Ícone do botão" },
    { id: "error", name: "Mensagem de erro" }
  ],
  "rsvp-controls": [
    { id: "controls", name: "Container" },
    { id: "yes-button", name: "Botão sim" },
    { id: "yes-text", name: "Texto botão sim" },
    { id: "no-button", name: "Botão não" },
    { id: "no-text", name: "Texto botão não" },
    { id: "error", name: "Mensagem de erro" },
    { id: "note", name: "Observação" }
  ],
  "rsvp-status": [
    { id: "status-card", name: "Card de status" },
    { id: "status-title", name: "Título status" },
    { id: "status-copy", name: "Texto status" }
  ],
  "rsvp-flow": [
    { id: "flow", name: "Container geral" },
    { id: "step-label", name: "Etiqueta" },
    { id: "question-title", name: "Pergunta sobre filhos" },
    { id: "yes-button", name: "Botão Sim" },
    { id: "yes-text", name: "Texto Sim" },
    { id: "no-button", name: "Botão Não" },
    { id: "no-text", name: "Texto Não" },
    { id: "form-title", name: "Título formulário" },
    { id: "name-label", name: "Label nome" },
    { id: "name-input", name: "Campo nome" },
    { id: "children-label", name: "Label quantidade de filhos" },
    { id: "stepper", name: "Contador de filhos" },
    { id: "stepper-button", name: "Botões do contador" },
    { id: "stepper-value", name: "Número do contador" },
    { id: "confirm-button", name: "Botão confirmar" },
    { id: "confirm-text", name: "Texto confirmar" },
    { id: "success-icon", name: "Ícone de sucesso" },
    { id: "success-title", name: "Título de sucesso" },
    { id: "success-copy", name: "Texto de sucesso" },
    { id: "success-copy-children", name: "Texto sucesso com filhos" },
    { id: "error-card", name: "Card do erro técnico" },
    { id: "error-title", name: "Título de erro técnico" },
    { id: "error-copy", name: "Texto de erro técnico" },
    { id: "retry-button", name: "Botão tentar novamente" },
    { id: "retry-text", name: "Texto tentar novamente" }
  ],
  "gift-grid": [
    { id: "grid", name: "Grade" },
    { id: "gift-card", name: "Card normal" },
    { id: "gift-card-reserved", name: "Card reservado" },
    { id: "gift-card-mine", name: "Card da minha escolha" },
    { id: "gift-media", name: "Área da imagem" },
    { id: "gift-image", name: "Imagem" },
    { id: "gift-content", name: "Conteúdo do card" },
    { id: "gift-title", name: "Nome do presente" },
    { id: "gift-color-row", name: "Linha de cor" },
    { id: "gift-color-label", name: "Texto cor de preferência" },
    { id: "gift-color-dots", name: "Grupo de bolinhas" },
    { id: "gift-color-dot", name: "Bolinha de cor" },
    { id: "gift-error", name: "Erro do presente" }
  ],
  "gift-note": [
    { id: "note", name: "Container" },
    { id: "note-icon", name: "Ícone" },
    { id: "note-text", name: "Texto" },
    { id: "note-link", name: "Link voltar" }
  ],
  "countdown": [
    { id: "countdown", name: "Contagem regressiva" },
    { id: "unit", name: "Bloco de tempo" },
    { id: "number", name: "Número" },
    { id: "label", name: "Legenda" }
  ]
};

const img = (id: string, name: string, src: string, x: number, y: number, width: number, height: number, zIndex = 1): InviteElement => ({
  id, name, type: "image", src, x, y, width, height, opacity: 1, rotate: 0, scaleX: 1, scaleY: 1, zIndex, visible: true, locked: false,
  objectFit: "contain", objectPositionX: 50, objectPositionY: 50, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, blur: 0
});
const text = (id: string, name: string, value: string, x: number, y: number, width: number, height: number, fontSize: number, zIndex = 3): InviteElement => ({
  id, name, type: "text", text: value, x, y, width, height, opacity: 1, rotate: 0, scaleX: 1, scaleY: 1, zIndex, visible: true, locked: false,
  color: "#0f238d", fontSize, fontFamily: "Cormorant Garamond", fontWeight: 400, fontStyle: "normal", textDecoration: "none", textTransform: "none",
  textAlign: "center", lineHeight: 1.06, letterSpacing: 0, paddingX: 2, paddingY: 2
});
const slot = (id: string, name: string, slotName: InviteElement["slot"], x: number, y: number, width: number, height: number, zIndex = 4): InviteElement => ({
  id, name, type: "slot", slot: slotName, x, y, width, height, opacity: 1, rotate: 0, scaleX: 1, scaleY: 1, zIndex, visible: true, locked: false,
  backgroundColor: "transparent", borderColor: "transparent", borderWidth: 0, borderStyle: "solid", borderRadius: 0,
  controlHeight: 52, controlGap: 12, controlRadius: 999, controlFontSize: 15, controlFontFamily: "Cormorant Garamond",
  primaryBackground: "#0f238d", primaryColor: "#ffffff", secondaryBackground: "#fffdf8", secondaryColor: "#0f238d", controlBorderColor: "#c59b3a",
  fieldHeight: 46, fieldRadius: 12, partStyles: {}
});

const accessSlot = (id: string, name: string, x: number, y: number, width: number, height: number, zIndex = 4): InviteElement => ({
  ...slot(id, name, "access-form", x, y, width, height, zIndex),
  controlHeight: undefined,
  controlGap: undefined,
  controlRadius: undefined,
  controlFontSize: undefined,
  controlFontFamily: undefined,
  primaryBackground: undefined,
  primaryColor: undefined,
  secondaryBackground: undefined,
  secondaryColor: undefined,
  controlBorderColor: undefined,
  fieldHeight: undefined,
  fieldRadius: undefined,
  partStyles: {
    form: {
      width: "100%",
      height: "100%",
      display: "grid",
      gap: 15,
      textAlign: "left",
    },
    "name-label": {
      color: "#12308e",
      fontFamily: "Inter",
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: 1.43,
      textTransform: "uppercase",
    },
    "code-label": {
      color: "#12308e",
      fontFamily: "Inter",
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: 1.43,
      textTransform: "uppercase",
    },
    "name-field": {
      width: "100%",
      height: "58px",
      backgroundColor: "rgba(255,255,255,.52)",
      borderColor: "rgba(198,154,58,.95)",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 20,
      display: "grid",
      alignItems: "center",
      gap: 9,
      paddingTop: 0,
      paddingRight: 17,
      paddingBottom: 0,
      paddingLeft: 17,
      color: "#c69a3a",
      customCss: "grid-template-columns:34px minmax(0,1fr);min-width:0;outline:none;",
    },
    "code-field": {
      width: "100%",
      height: "58px",
      backgroundColor: "rgba(255,255,255,.52)",
      borderColor: "rgba(198,154,58,.95)",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 20,
      display: "grid",
      alignItems: "center",
      gap: 9,
      paddingTop: 0,
      paddingRight: 17,
      paddingBottom: 0,
      paddingLeft: 17,
      color: "#c69a3a",
      customCss: "grid-template-columns:34px minmax(0,1fr);min-width:0;outline:none;",
    },
    "name-icon": {
      color: "#c69a3a",
      fontSize: 22,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    "code-icon": {
      color: "#c69a3a",
      fontSize: 22,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    "name-input": {
      width: "100%",
      height: "100%",
      color: "#0d277b",
      placeholderColor: "#b9afa2",
      backgroundColor: "transparent",
      borderWidth: 0,
      borderStyle: "none",
      borderColor: "transparent",
      fontFamily: "Cormorant Garamond",
      fontSize: 18,
      fontWeight: 500,
      lineHeight: 1,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      customCss: "min-width:0;outline:none;box-shadow:none;",
    },
    "code-input": {
      width: "100%",
      height: "100%",
      color: "#0d277b",
      placeholderColor: "#b9afa2",
      backgroundColor: "transparent",
      borderWidth: 0,
      borderStyle: "none",
      borderColor: "transparent",
      fontFamily: "Cormorant Garamond",
      fontSize: 18,
      fontWeight: 500,
      lineHeight: 1,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      customCss: "min-width:0;outline:none;box-shadow:none;",
    },
    "submit-button": {
      width: "100%",
      height: "60px",
      marginTop: 3,
      color: "#ffffff",
      borderColor: "#c69a3a",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 22,
      display: "grid",
      alignItems: "center",
      paddingTop: 0,
      paddingRight: 18,
      paddingBottom: 0,
      paddingLeft: 46,
      fontFamily: "Cormorant Garamond",
      fontSize: 18,
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: 2.34,
      textTransform: "uppercase",
      shadowX: 0,
      shadowY: 12,
      shadowBlur: 28,
      shadowSpread: 0,
      shadowColor: "rgba(11,42,132,.16)",
      customCss: "grid-template-columns:minmax(0,1fr) 28px;min-width:0;overflow:hidden;cursor:pointer;background:linear-gradient(135deg,#173da6 0%,#0b2a84 100%);",
    },
    "submit-text": {
      color: "#ffffff",
      fontFamily: "Cormorant Garamond",
      fontSize: 18,
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: 2.34,
      textTransform: "uppercase",
      textAlign: "center",
      customCss: "min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;",
    },
    "submit-icon": {
      color: "#c69a3a",
      width: "28px",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Georgia",
      fontSize: 30,
      fontWeight: 300,
      lineHeight: 1,
    },
    error: {
      color: "#9a2430",
      fontFamily: "Inter",
      fontSize: 12,
      fontWeight: 600,
      lineHeight: 1.4,
      textAlign: "center",
      marginTop: -2,
    },
  },
});

const rsvpFlowSlot = (id: string, name: string, x: number, y: number, width: number, height: number, zIndex = 4): InviteElement => ({
  ...slot(id, name, "rsvp-flow", x, y, width, height, zIndex),
  autoHeight: true,
  partStyles: {
    flow: {
      width: "100%",
      paddingTop: 24,
      paddingRight: 20,
      paddingBottom: 24,
      paddingLeft: 20,
      backgroundColor: "rgba(255,255,255,.50)",
      borderColor: "rgba(198,154,58,.78)",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 28,
    },
    "step-label": {
      color: "#9b7727",
      fontFamily: "Inter",
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      textAlign: "center",
    },
    "question-title": {
      color: "#12308e",
      fontFamily: "Cormorant Garamond",
      fontSize: 29,
      fontWeight: 500,
      lineHeight: 1.08,
      textAlign: "center",
      text: "Possui filhos que irão junto?",
    },
    "yes-button": {
      minHeight: 52,
      backgroundColor: "#12308e",
      color: "#fff",
      borderColor: "#12308e",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 999,
    },
    "yes-text": {
      color: "#fff",
      fontFamily: "Inter",
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: .8,
      textAlign: "center",
      text: "SIM",
    },
    "no-button": {
      minHeight: 52,
      backgroundColor: "rgba(255,253,248,.82)",
      color: "#12308e",
      borderColor: "rgba(198,154,58,.76)",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 999,
    },
    "no-text": {
      color: "#12308e",
      fontFamily: "Inter",
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: .8,
      textAlign: "center",
      text: "NÃO",
    },
    "form-title": {
      color: "#12308e",
      fontFamily: "Cormorant Garamond",
      fontSize: 29,
      fontWeight: 500,
      lineHeight: 1.05,
      textAlign: "center",
      text: "Confirme sua presença",
    },
    "name-label": {
      color: "#12308e",
      fontFamily: "Inter",
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: .7,
      textTransform: "uppercase",
      text: "Nome e sobrenome",
    },
    "name-input": {
      width: "100%",
      minHeight: 54,
      paddingLeft: 16,
      paddingRight: 16,
      backgroundColor: "rgba(255,253,248,.82)",
      color: "#12308e",
      borderColor: "rgba(198,154,58,.78)",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 17,
      fontFamily: "Inter",
      fontSize: 15,
    },
    "children-label": {
      color: "#12308e",
      fontFamily: "Inter",
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: .7,
      textTransform: "uppercase",
      text: "Quantidade de filhos",
    },
    stepper: {
      width: "100%",
      paddingTop: 8,
      paddingRight: 8,
      paddingBottom: 8,
      paddingLeft: 8,
      backgroundColor: "rgba(255,253,248,.82)",
      borderColor: "rgba(198,154,58,.62)",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 18,
    },
    "stepper-button": {
      minHeight: 42,
      backgroundColor: "rgba(18,48,142,.07)",
      color: "#12308e",
      borderColor: "rgba(18,48,142,.10)",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 13,
    },
    "stepper-value": {
      color: "#12308e",
      fontFamily: "Cormorant Garamond",
      fontSize: 30,
      fontWeight: 600,
      textAlign: "center",
    },
    "confirm-button": {
      width: "100%",
      minHeight: 54,
      backgroundColor: "#12308e",
      color: "#fff",
      borderColor: "#12308e",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 999,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    },
    "confirm-text": {
      color: "#fff",
      fontFamily: "Inter",
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: .8,
      textTransform: "uppercase",
      textAlign: "center",
      text: "CONFIRMAR PRESENÇA",
    },
    "success-icon": {
      backgroundColor: "rgba(18,48,142,.08)",
      color: "#12308e",
    },
    "success-title": {
      color: "#12308e",
      fontFamily: "Cormorant Garamond",
      fontSize: 31,
      fontWeight: 550,
      textAlign: "center",
      text: "Presença confirmada",
    },
    "success-copy": {
      color: "#40528d",
      fontFamily: "Cormorant Garamond",
      fontSize: 17,
      fontWeight: 500,
      textAlign: "center",
      text: "Obrigado por confirmar. Esperamos você!",
    },
    "success-copy-children": {
      color: "#40528d",
      fontFamily: "Cormorant Garamond",
      fontSize: 18,
      fontWeight: 500,
      textAlign: "center",
      text: "Você + 2 filho(s).",
    },
    "error-card": {
      width: "100%",
      display: "grid",
      gap: 14,
      justifyItems: "center",
      textAlign: "center",
    },
    "error-title": {
      color: "#12308e",
      fontFamily: "Cormorant Garamond",
      fontSize: 27,
      fontWeight: 550,
      textAlign: "center",
      text: "Não foi possível confirmar agora",
    },
    "error-copy": {
      color: "#40528d",
      fontFamily: "Cormorant Garamond",
      fontSize: 16,
      fontWeight: 500,
      textAlign: "center",
      text: "Tente novamente em alguns instantes.",
    },
    "retry-button": {
      width: "100%",
      minHeight: 54,
      backgroundColor: "#12308e",
      color: "#fff",
      borderColor: "#12308e",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 999,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    },
    "retry-text": {
      color: "#fff",
      fontFamily: "Inter",
      fontSize: 10,
      fontWeight: 800,
      textTransform: "uppercase",
      textAlign: "center",
      text: "TENTAR NOVAMENTE",
    },
  },
});

const rsvpControlsSlot = (id: string, name: string, x: number, y: number, width: number, height: number, zIndex = 4): InviteElement => ({
  ...slot(id, name, "rsvp-controls", x, y, width, height, zIndex),
  controlHeight: undefined,
  controlGap: undefined,
  controlRadius: undefined,
  controlFontSize: undefined,
  controlFontFamily: undefined,
  primaryBackground: undefined,
  primaryColor: undefined,
  secondaryBackground: undefined,
  secondaryColor: undefined,
  controlBorderColor: undefined,
  partStyles: {
    controls: {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 12,
      paddingTop: 24,
      paddingRight: 20,
      paddingBottom: 18,
      paddingLeft: 20,
      backgroundColor: "rgba(255,255,255,.42)",
      borderColor: "#c69a3a",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 28,
      shadowX: 0,
      shadowY: 14,
      shadowBlur: 40,
      shadowSpread: 0,
      shadowColor: "rgba(60,43,12,.04)",
    },
    "yes-button": {
      width: "100%",
      minHeight: 58,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#12308e",
      color: "#ffffff",
      borderColor: "#12308e",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 999,
      paddingTop: 0,
      paddingRight: 17,
      paddingBottom: 0,
      paddingLeft: 17,
      customCss: "cursor:pointer;",
    },
    "yes-text": {
      color: "#ffffff",
      fontFamily: "Cormorant Garamond",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: 1.28,
      textTransform: "uppercase",
      textAlign: "center",
    },
    "no-button": {
      width: "100%",
      minHeight: 58,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,.45)",
      color: "#12308e",
      borderColor: "#c69a3a",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 999,
      paddingTop: 0,
      paddingRight: 17,
      paddingBottom: 0,
      paddingLeft: 17,
      customCss: "cursor:pointer;",
    },
    "no-text": {
      color: "#12308e",
      fontFamily: "Cormorant Garamond",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: 1.28,
      textTransform: "uppercase",
      textAlign: "center",
    },
    note: {
      color: "#29458c",
      fontFamily: "Cormorant Garamond",
      fontSize: 16,
      fontWeight: 500,
      lineHeight: 1.3,
      textAlign: "center",
      marginTop: 2,
      text: "Sua resposta poderá ser atualizada até a data do evento.",
    },
    error: {
      color: "#9a2430",
      fontFamily: "Inter",
      fontSize: 12,
      fontWeight: 600,
      lineHeight: 1.4,
      textAlign: "center",
      text: "Mensagem de erro",
    },
  },
});

const rsvpStatusSlot = (id: string, name: string, x: number, y: number, width: number, height: number, zIndex = 4): InviteElement => ({
  ...slot(id, name, "rsvp-status", x, y, width, height, zIndex),
  controlHeight: undefined,
  controlGap: undefined,
  controlRadius: undefined,
  controlFontSize: undefined,
  controlFontFamily: undefined,
  primaryBackground: undefined,
  primaryColor: undefined,
  secondaryBackground: undefined,
  secondaryColor: undefined,
  controlBorderColor: undefined,
  partStyles: {
    "status-card": {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingTop: 16,
      paddingRight: 18,
      paddingBottom: 16,
      paddingLeft: 18,
      backgroundColor: "rgba(244,249,255,.72)",
      borderColor: "#aac3e7",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 28,
      textAlign: "center",
    },
    "status-title": {
      color: "#12308e",
      fontFamily: "Cormorant Garamond",
      fontSize: 30,
      fontWeight: 500,
      lineHeight: 1,
      textAlign: "center",
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      text: "Presença confirmada",
    },
    "status-copy": {
      color: "#29458c",
      fontFamily: "Cormorant Garamond",
      fontSize: 17,
      fontWeight: 500,
      lineHeight: 1.3,
      textAlign: "center",
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      text: "Ficamos felizes em celebrar com você.",
    },
  },
});


const giftGridSlot = (id: string, name: string, x: number, y: number, width: number, height: number, zIndex = 4): InviteElement => ({
  ...slot(id, name, "gift-grid", x, y, width, height, zIndex),
  partStyles: {
    grid: {
      width: "100%",
      height: "100%",
      display: "grid",
      gap: 10,
      customCss: "grid-template-columns:repeat(2,minmax(0,1fr));align-content:start;",
    },
    "gift-card": {
      minHeight: 212,
      backgroundColor: "rgba(255,253,248,.78)",
      borderColor: "rgba(198,154,58,.9)",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 18,
      display: "flex",
      flexDirection: "column",
      customCss: "min-width:0;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease;",
      hoverCss: "transform:translateY(-1px);box-shadow:0 8px 22px rgba(18,48,142,.07);",
    },
    "gift-media": {
      width: "100%",
      minHeight: 132,
      backgroundColor: "rgba(255,255,255,.54)",
      customCss: "position:relative;aspect-ratio:1.18/1;overflow:hidden;",
    },
    "gift-image": {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      objectPositionX: 50,
      objectPositionY: 50,
      paddingTop: 9,
      paddingRight: 9,
      paddingBottom: 7,
      paddingLeft: 9,
      backgroundColor: "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    "gift-content": {
      minHeight: 72,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingTop: 8,
      paddingRight: 8,
      paddingBottom: 10,
      paddingLeft: 8,
      textAlign: "center",
    },
    "gift-card-reserved": {
      opacity: .66,
      backgroundColor: "rgba(250,248,243,.72)",
      borderColor: "rgba(154,132,91,.45)",
      shadowX: 0,
      shadowY: 0,
      shadowBlur: 0,
      shadowSpread: 0,
      shadowColor: "transparent",
    },
    "gift-card-mine": {
      backgroundColor: "rgba(241,245,255,.88)",
      borderColor: "rgba(18,48,142,.68)",
      borderWidth: 1,
      shadowX: 0,
      shadowY: 10,
      shadowBlur: 26,
      shadowSpread: 0,
      shadowColor: "rgba(18,48,142,.09)",
    },
    "gift-title": {
      color: "#12308e",
      fontFamily: "Cormorant Garamond",
      fontSize: 20,
      fontWeight: 500,
      lineHeight: 1.05,
      textAlign: "center",
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      customCss: "max-width:100%;overflow-wrap:anywhere;",
    },
    "gift-color-row": {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      customCss: "flex-wrap:wrap;",
    },
    "gift-color-label": {
      color: "#66739b",
      fontFamily: "Cormorant Garamond",
      fontSize: 12,
      fontWeight: 600,
      lineHeight: 1,
      textAlign: "center",
      text: "Cor de preferência",
    },
    "gift-color-dots": {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    "gift-color-dot": {
      width: "14px",
      height: "14px",
      borderColor: "rgba(18,48,142,.16)",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 999,
      customCss: "display:inline-block;flex:0 0 auto;box-shadow:inset 0 0 0 1px rgba(255,255,255,.38);",
    },
    "gift-error": {
      color: "#9a2430",
      fontFamily: "Inter",
      fontSize: 10,
      fontWeight: 600,
      lineHeight: 1.25,
      textAlign: "center",
    },
  },
});

const giftNoteSlot = (id: string, name: string, x: number, y: number, width: number, height: number, zIndex = 4): InviteElement => ({
  ...slot(id, name, "gift-note", x, y, width, height, zIndex),
  partStyles: {
    note: {
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(255,255,255,.40)",
      color: "#12308e",
      borderColor: "#c69a3a",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 24,
      display: "grid",
      alignItems: "center",
      gap: 14,
      paddingTop: 14,
      paddingRight: 18,
      paddingBottom: 14,
      paddingLeft: 18,
      textAlign: "left",
      customCss: "grid-template-columns:52px 1fr auto;",
    },
    "note-icon": {
      icon: "gift",
      color: "#c69a3a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 24,
    },
    "note-text": {
      color: "#12308e",
      fontFamily: "Cormorant Garamond",
      fontSize: 19,
      fontWeight: 500,
      lineHeight: 1.2,
      text: "Ao selecionar um presente, ele ficará reservado em seu nome.",
    },
    "note-link": {
      color: "#12308e",
      fontFamily: "Inter",
      fontSize: 10,
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: 1,
      textTransform: "uppercase",
      textDecoration: "underline",
      text: "Voltar",
    },
  },
});

const link = (id: string, name: string, label: string, href: string, x: number, y: number, width: number, height: number, zIndex = 4): InviteElement => ({
  id, name, type: "link", text: label, href, x, y, width, height, opacity: 1, rotate: 0, scaleX: 1, scaleY: 1, zIndex, visible: true, locked: false,
  color: "#0f238d", backgroundColor: "#fffdf8", borderColor: "#c59b3a", borderWidth: 1, borderStyle: "solid", borderRadius: 999,
  fontSize: 15, fontFamily: "Cormorant Garamond", fontWeight: 600, textAlign: "center", lineHeight: 1, letterSpacing: 1.5, paddingX: 18, paddingY: 8
});

const box = (
  id: string,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex = 2
): InviteElement => ({
  id,
  name,
  type: "box",
  x,
  y,
  width,
  height,
  opacity: 1,
  rotate: 0,
  scaleX: 1,
  scaleY: 1,
  zIndex,
  visible: true,
  locked: false,
  backgroundColor: "rgba(255,253,248,.62)",
  borderColor: "rgba(198,154,58,.72)",
  borderWidth: 1,
  borderStyle: "solid",
  borderRadius: 24,
  shadowX: 0,
  shadowY: 12,
  shadowBlur: 36,
  shadowSpread: 0,
  shadowColor: "rgba(18,48,142,.055)",
});

const countdownSlot = (
  id: string,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex = 4
): InviteElement => ({
  ...slot(id, name, "countdown", x, y, width, height, zIndex),
  partStyles: {
    countdown: {
      width: "100%",
      height: "100%",
      display: "grid",
      gap: 7,
      customCss: "grid-template-columns:repeat(4,minmax(0,1fr));",
    },
    unit: {
      minHeight: 68,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      backgroundColor: "rgba(255,253,248,.74)",
      borderColor: "rgba(198,154,58,.62)",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 18,
      shadowX: 0,
      shadowY: 7,
      shadowBlur: 20,
      shadowSpread: 0,
      shadowColor: "rgba(18,48,142,.045)",
    },
    number: {
      color: "#12308e",
      fontFamily: "Cormorant Garamond",
      fontSize: 29,
      fontWeight: 500,
      lineHeight: 1,
      textAlign: "center",
    },
    label: {
      color: "#9a7527",
      fontFamily: "Inter",
      fontSize: 8,
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: .8,
      textTransform: "uppercase",
      textAlign: "center",
    },
  },
});

export const defaultInviteVisualConfig: InviteVisualConfig = {
  version: 2,
  savedLayouts: {},
  inviteFlow: {
    continuousBackground: false,
    backgroundSource: "invite",
  },
  screens: {
    cover: { id:"cover", name:"Capa", backgroundColor:"#fbfaf5", minHeight:844, paperOpacity:.5, elements:[
      img("cover-floral-left","Floral superior esquerdo","/florals/floral-top-left.webp",-8,-5,47,37,1), img("cover-floral-right","Floral superior direito","/florals/floral-top-right.webp",61,-5,47,37,1), img("cover-monogram","Monograma","/brand/monograma-pl.png",36,12,28,18,3), img("cover-divider","Divisor floral","/florals/floral-divider.webp",17,31,66,12,2), text("cover-names","Nomes","PEDRO & LETÍCIA",10,43,80,7,24), text("cover-title","Título","Chá de Panela",7,50,86,10,43), img("cover-kitchen","Arranjo de cozinha","/florals/kitchen-arrangement.webp",8,60,84,30,2), text("cover-open","Instrução","DESLIZE PARA ABRIR\n⌃",15,91,70,7,13,5)
    ]},
    access: { id:"access", name:"Login", backgroundColor:"#fbfaf5", minHeight:844, paperOpacity:.5, elements:[
      img("access-floral-left","Floral superior esquerdo","/florals/floral-top-left.webp",-10,-5,43,34,1), img("access-floral-right","Floral superior direito","/florals/floral-top-right.webp",67,-5,43,34,1), img("access-monogram","Monograma","/brand/monograma-pl.png",40,6,20,14,3), img("access-divider","Divisor floral","/florals/floral-divider.webp",24,21,52,9,2), text("access-heading","Título","Seu convite\nestá reservado",8,31,84,16,40), text("access-copy","Instrução","Informe seu nome e o código enviado pelos noivos para abrir seu convite.",12,49,76,8,17), accessSlot("access-form","Formulário de acesso",9,58,82,31,5), img("access-kitchen","Arranjo inferior","/florals/kitchen-arrangement.webp",53,82,53,23,2)
    ]},
    invite: { id:"invite", name:"Convite", backgroundColor:"#fbfaf5", minHeight:1080, paperOpacity:.46, layoutRevision:2, elements:[
      img("invite-floral-left","Floral superior esquerdo","/florals/floral-top-left.webp",-10,-4,43,28,1),
      img("invite-floral-right","Floral superior direito","/florals/floral-top-right.webp",67,-4,43,28,1),

      text("invite-names","Nomes","{{couple_names}}",16,4,68,4.5,18,4),
      img("invite-monogram","Monograma","/brand/monograma-pl.png",39,9,22,12,3),
      img("invite-divider","Divisor floral","/florals/floral-divider.webp",25,21,50,6,2),

      text("invite-title","Título","{{title}}",8,28,84,7,43,4),
      text("invite-intro","Mensagem","Reserve essa data para celebrar com a gente.",11,36,78,5,18,4),

      box("invite-date-card","Card de data",8,43,84,18,2),
      text("invite-weekday","Dia da semana","{{weekday}}",11,46,22,4,11,4),
      text("invite-day","Dia","{{day}}",35,44,30,9,55,4),
      text("invite-month","Mês","{{month}}",67,46,22,4,11,4),
      text("invite-year","Ano","{{year}}",11,52,22,3,10,4),
      text("invite-time","Horário","ÀS {{time}}",67,52,22,3,12,4),
      box("invite-date-line-left","Separador esquerdo",31.5,46,0.3,10,3),
      box("invite-date-line-right","Separador direito",68.2,46,0.3,10,3),

      text("invite-location-label","Label local","LOCAL DA COMEMORAÇÃO",14,63,72,3,9,4),
      text("invite-location","Local","{{venue}}\n{{city}}",10,66,80,7,20,4),

      link("invite-map","Botão mapa","VER NO MAPA","{{maps_url}}",29,74,42,5.2,5),

      text("invite-countdown-label","Título contagem","CONTAGEM REGRESSIVA",14,81,72,3,9,4),
      countdownSlot("invite-countdown","Contagem regressiva",9,84.5,82,7.5,5),

      link("invite-rsvp","Botão confirmar presença","CONFIRMAR PRESENÇA","/presenca",8,94,40,5.5,5),
      link("invite-gifts","Botão lista de presentes","LISTA DE PRESENTES","/presentes",52,94,40,5.5,5)
    ]},
    rsvp: { id:"rsvp", name:"Presença", backgroundColor:"#fbfaf5", minHeight:1100, paperOpacity:.5, layoutRevision:3, elements:[
      img("rsvp-floral-left","Floral superior esquerdo","/florals/floral-top-left.webp",-10,-5,43,32,1),
      img("rsvp-floral-right","Floral superior direito","/florals/floral-top-right.webp",67,-5,43,32,1),
      img("rsvp-monogram","Monograma","/brand/monograma-pl.png",40,4,20,12,3),
      text("rsvp-title","Título","Confirmar presença",7,17,86,7,39),
      img("rsvp-divider","Divisor floral","/florals/floral-divider.webp",22,25,56,8,2),
      text("rsvp-greeting","Mensagem","Encontre seu nome na lista e confirme quem estará com você.",9,34,82,8,19),
      rsvpFlowSlot("rsvp-flow","Fluxo de confirmação",6,45,88,45,5),
      img("rsvp-kitchen","Arranjo inferior","/florals/kitchen-arrangement.webp",14,92,72,22,2)
    ]},
    gifts: { id:"gifts", name:"Presentes", backgroundColor:"#fbfaf5", minHeight:1250, paperOpacity:.5, elements:[
      img("gifts-floral-left","Floral superior esquerdo","/florals/floral-top-left.webp",-9,-3,39,25,1), img("gifts-floral-right","Floral superior direito","/florals/floral-top-right.webp",70,-3,39,25,1), img("gifts-monogram","Monograma","/brand/monograma-pl.png",42,4,16,10,3), text("gifts-title","Título","Lista de presentes",8,14,84,8,39), img("gifts-divider","Divisor floral","/florals/floral-divider.webp",22,23,56,8,2), text("gifts-copy","Introdução","Sua presença já é muito especial.\nSe desejar, você pode nos presentear com carinho.",11,31,78,10,20), giftGridSlot("gift-grid","Grade de presentes",5,43,90,45,5), giftNoteSlot("gift-note","Aviso dos presentes",7,90,86,8,5)
    ]}
  }
};


const inviteDefault = defaultInviteVisualConfig.screens.invite;
const inviteById = new Map(inviteDefault.elements.map(element => [element.id, element]));

Object.assign(inviteById.get("invite-intro") || {}, {
  color: "#40528d",
  fontSize: 17,
  fontStyle: "italic",
  lineHeight: 1.2,
});

for (const id of ["invite-weekday", "invite-month", "invite-year", "invite-time", "invite-location-label", "invite-countdown-label"]) {
  Object.assign(inviteById.get(id) || {}, {
    fontFamily: "Inter",
    fontWeight: 700,
    letterSpacing: 1.25,
    textTransform: "uppercase",
  });
}

Object.assign(inviteById.get("invite-weekday") || {}, { color: "#8c6b25" });
Object.assign(inviteById.get("invite-month") || {}, { color: "#8c6b25" });
Object.assign(inviteById.get("invite-year") || {}, { color: "#65709a" });
Object.assign(inviteById.get("invite-time") || {}, { color: "#12308e" });
Object.assign(inviteById.get("invite-day") || {}, {
  color: "#12308e",
  fontWeight: 500,
  lineHeight: .9,
});
Object.assign(inviteById.get("invite-location-label") || {}, { color: "#a27a25" });
Object.assign(inviteById.get("invite-countdown-label") || {}, { color: "#a27a25" });
Object.assign(inviteById.get("invite-location") || {}, {
  color: "#12308e",
  fontWeight: 500,
  lineHeight: 1.08,
});
Object.assign(inviteById.get("invite-map") || {}, {
  backgroundColor: "rgba(255,253,248,.72)",
  fontFamily: "Inter",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 1.1,
  shadowX: 0,
  shadowY: 8,
  shadowBlur: 22,
  shadowSpread: 0,
  shadowColor: "rgba(18,48,142,.05)",
});
Object.assign(inviteById.get("invite-rsvp") || {}, {
  backgroundColor: "#12308e",
  color: "#ffffff",
  borderColor: "#12308e",
  fontFamily: "Inter",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: .9,
  shadowX: 0,
  shadowY: 10,
  shadowBlur: 24,
  shadowSpread: 0,
  shadowColor: "rgba(18,48,142,.14)",
});
Object.assign(inviteById.get("invite-gifts") || {}, {
  backgroundColor: "rgba(255,253,248,.76)",
  color: "#12308e",
  fontFamily: "Inter",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: .9,
});

const legacyInviteDefaultIds = new Set([
  "invite-floral-left",
  "invite-floral-right",
  "invite-names",
  "invite-divider",
  "invite-monogram",
  "invite-title",
  "invite-event",
  "invite-rsvp",
  "invite-gifts",
  "invite-kitchen",
]);


function normalizeLegacyPartOverride(
  partId: string,
  fallback: InvitePartStyle,
  saved: InvitePartStyle
): InvitePartStyle {
  const next: InvitePartStyle = { ...saved };

  // Older editor versions rendered undefined numeric fields as 0. If the user
  // interacted with one of those inputs, 0 could be persisted and collapse
  // text/media inside functional slots. Treat impossible typography values as
  // missing so the current default can safely take over.
  if (typeof next.fontSize === "number" && next.fontSize <= 0) delete next.fontSize;
  if (typeof next.fontWeight === "number" && next.fontWeight <= 0) delete next.fontWeight;
  if (typeof next.lineHeight === "number" && next.lineHeight <= 0) delete next.lineHeight;

  // Previous RSVP generations reserved one tall card for every possible
  // scenario. The new RSVP renders only the active scenario, so those old
  // default min-heights must not keep producing a giant empty card.
  if (partId === "flow" && (next.minHeight === 430 || next.minHeight === 330)) {
    delete next.minHeight;
  }

  if (partId.startsWith("gift-")) {
    const collapsed = (value: unknown) =>
      typeof value === "string" && /^(?:0|0px|0%|0rem|0em)$/i.test(value.trim());

    if (collapsed(next.width) && fallback.width && !collapsed(fallback.width)) delete next.width;
    if (collapsed(next.height) && fallback.height && !collapsed(fallback.height)) delete next.height;

    // Upgrade the known legacy proportions produced by earlier builder versions.
    // Custom user values outside these old defaults are preserved.
    if (partId === "gift-card" && (next.minHeight === 0 || next.minHeight === 240)) delete next.minHeight;
    if (partId === "gift-media" && next.minHeight === 140) delete next.minHeight;
    if (partId === "gift-content" && next.minHeight === 92) delete next.minHeight;
    if (partId === "gift-title" && next.fontSize === 24) delete next.fontSize;
    if (partId.startsWith("gift-status-") && typeof next.customCss === "string") {
      next.customCss = next.customCss.replace(/min-width\s*:\s*110px\s*;?/gi, "").trim();
      if (!next.customCss) delete next.customCss;
    }

    if ((partId === "gift-card" || partId === "gift-media" || partId === "gift-content") && typeof next.minHeight === "number" && next.minHeight <= 0) {
      delete next.minHeight;
    }
  }

  return next;
}


export function resolveRsvpScenarioScreen(
  config: InviteVisualConfig,
  scenarioId: RsvpScenarioId
): InviteScreen {
  const base = config.screens.rsvp;
  const scenario = config.rsvpScenarios?.[scenarioId];
  if (!scenario) return structuredClone(base);

  return {
    ...structuredClone(base),
    ...(scenario.screenStyle || {}),
    id: "rsvp",
    name: scenario.name || base.name,
    deletedElementIds: [...(scenario.deletedElementIds || [])],
    elements: structuredClone(scenario.elements || base.elements),
  };
}

function buildRsvpScenarios(
  base: InviteScreen,
  raw: InviteVisualConfig["rsvpScenarios"] | undefined
): Record<RsvpScenarioId, InviteRsvpScenarioScreen> {
  const names: Record<RsvpScenarioId, string> = {
    "children-question": "Pergunta sobre filhos",
    "form-no-children": "Formulário sem filhos",
    "form-children": "Formulário com filhos",
    confirmed: "Presença confirmada",
    error: "Erro técnico",
  };

  const baseFlow = base.elements.find(el => el.slot === "rsvp-flow");

  return Object.fromEntries(
    RSVP_SCENARIO_IDS.map(scenarioId => {
      const saved = raw?.[scenarioId];

      if (saved) {
        const deleted = new Set(saved.deletedElementIds || []);
        const savedById = new Map((saved.elements || []).map(el => [el.id, el]));
        const mergedDefaults = base.elements
          .filter(el => !deleted.has(el.id))
          .map(el => {
            const own = savedById.get(el.id);
            return own ? { ...structuredClone(el), ...structuredClone(own) } : structuredClone(el);
          });

        const baseIds = new Set(base.elements.map(el => el.id));
        const custom = (saved.elements || []).filter(el => !baseIds.has(el.id));

        return [scenarioId, {
          id: scenarioId,
          name: saved.name || names[scenarioId],
          screenStyle: structuredClone(saved.screenStyle || {}),
          deletedElementIds: [...deleted],
          elements: [...mergedDefaults, ...structuredClone(custom)],
        }];
      }

      const elements = structuredClone(base.elements);
      const flow = elements.find(el => el.slot === "rsvp-flow");
      const oldOverrides = baseFlow?.scenarioPartStyles?.[scenarioId] || {};
      if (flow && Object.keys(oldOverrides).length) {
        flow.partStyles = {
          ...(flow.partStyles || {}),
          ...Object.fromEntries(
            Object.entries(oldOverrides).map(([partId, override]) => [
              partId,
              { ...(flow.partStyles?.[partId] || {}), ...structuredClone(override) },
            ])
          ),
        };
      }
      if (flow) delete flow.scenarioPartStyles;

      return [scenarioId, {
        id: scenarioId,
        name: names[scenarioId],
        screenStyle: {},
        deletedElementIds: [],
        elements,
      }];
    })
  ) as Record<RsvpScenarioId, InviteRsvpScenarioScreen>;
}

export function normalizeInviteVisualConfig(
  config: InviteVisualConfig | LegacyInviteVisualConfigV1
): InviteVisualConfig {
  const rawSavedLayouts =
    config && typeof (config as InviteVisualConfig).savedLayouts === "object"
      ? ((config as InviteVisualConfig).savedLayouts || {})
      : {};

  // Older "decoration" presets stored both the individual floral/logo images
  // AND a whole screen background. Applying that preset could therefore render
  // the same visual twice. Remember those old background values so a screen
  // that clearly came from that legacy apply can be repaired on read.
  const legacyDecorationBackgrounds = new Set(
    Object.values(rawSavedLayouts)
      .filter(layout => !layout.decorationRevision)
      .map(layout => layout.screenStyle?.backgroundImage)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  );

  const screens = Object.fromEntries(
    (Object.keys(defaultInviteVisualConfig.screens) as InviteScreenId[]).map(screenId => {
      const fallbackScreen = defaultInviteVisualConfig.screens[screenId];
      const savedScreen = config.screens?.[screenId];

      if (!savedScreen) return [screenId, structuredClone(fallbackScreen)];

      // The invitation screen received a new editorial/event-information layout.
      // Old saved designs are upgraded once so the new composition becomes the
      // editable baseline instead of keeping the former paragraph-only layout.
      const upgradeInviteLayout =
        screenId === "invite" && (savedScreen.layoutRevision ?? 1) < (fallbackScreen.layoutRevision ?? 1);
      const hasNewRsvpFlow =
        screenId !== "rsvp" ||
        savedScreen.elements.some(element => element.type === "slot" && element.slot === "rsvp-flow");

      const upgradeRsvpLayout =
        screenId === "rsvp" &&
        (
          (savedScreen.layoutRevision ?? 1) < (fallbackScreen.layoutRevision ?? 1) ||
          !hasNewRsvpFlow
        );

      if (upgradeRsvpLayout) {
        const oldRsvpIds = new Set([
          "rsvp-floral-left",
          "rsvp-floral-right",
          "rsvp-monogram",
          "rsvp-title",
          "rsvp-divider",
          "rsvp-greeting",
          "rsvp-controls",
          "rsvp-status",
          "rsvp-kitchen",
        ]);
        const newDefaultIds = new Set(fallbackScreen.elements.map(element => element.id));
        const customElements = savedScreen.elements.filter(
          element => !oldRsvpIds.has(element.id) && !newDefaultIds.has(element.id)
        );

        const migrated = structuredClone(fallbackScreen);

        return [
          screenId,
          {
            ...migrated,
            backgroundColor: savedScreen.backgroundColor ?? migrated.backgroundColor,
            backgroundImage: savedScreen.backgroundImage ?? migrated.backgroundImage,
            backgroundSize: savedScreen.backgroundSize ?? migrated.backgroundSize,
            backgroundRepeat: savedScreen.backgroundRepeat ?? migrated.backgroundRepeat,
            backgroundPositionX: savedScreen.backgroundPositionX ?? migrated.backgroundPositionX,
            backgroundPositionY: savedScreen.backgroundPositionY ?? migrated.backgroundPositionY,
            backgroundOverlayColor: savedScreen.backgroundOverlayColor ?? migrated.backgroundOverlayColor,
            backgroundOverlayOpacity: savedScreen.backgroundOverlayOpacity ?? migrated.backgroundOverlayOpacity,
            useGradient: savedScreen.useGradient ?? migrated.useGradient,
            gradientFrom: savedScreen.gradientFrom ?? migrated.gradientFrom,
            gradientTo: savedScreen.gradientTo ?? migrated.gradientTo,
            gradientAngle: savedScreen.gradientAngle ?? migrated.gradientAngle,
            paperOpacity: savedScreen.paperOpacity ?? migrated.paperOpacity,
            customCss: savedScreen.customCss ?? migrated.customCss,
            deletedElementIds: [],
            elements: [...migrated.elements, ...customElements],
          },
        ];
      }

      if (upgradeInviteLayout) {
        const newDefaultIds = new Set(fallbackScreen.elements.map(element => element.id));
        const customElements = savedScreen.elements.filter(
          element => !legacyInviteDefaultIds.has(element.id) && !newDefaultIds.has(element.id)
        );

        return [
          screenId,
          {
            ...structuredClone(fallbackScreen),
            deletedElementIds: [],
            elements: [...structuredClone(fallbackScreen.elements), ...customElements],
          },
        ];
      }

      const deletedElementIds = new Set(savedScreen.deletedElementIds || []);
      const savedById = new Map(savedScreen.elements.map(element => [element.id, element]));
      const normalizedDefaultElements = fallbackScreen.elements
        .filter(fallbackElement => !deletedElementIds.has(fallbackElement.id))
        .map(fallbackElement => {
          const savedElement = savedById.get(fallbackElement.id);
          if (!savedElement) return structuredClone(fallbackElement);

          const fallbackParts = fallbackElement.partStyles || {};
          const savedParts = savedElement.partStyles || {};
          const partIds = new Set([...Object.keys(fallbackParts), ...Object.keys(savedParts)]);
          const partStyles = Object.fromEntries(
            [...partIds].map(partId => {
              const fallbackPart = fallbackParts[partId] || {};
              const savedPart = normalizeLegacyPartOverride(
                partId,
                fallbackPart,
                savedParts[partId] || {}
              );
              return [
                partId,
                {
                  ...fallbackPart,
                  ...savedPart,
                },
              ];
            })
          );

          return {
            ...fallbackElement,
            ...savedElement,
            partStyles,
          };
        });

      // Preserve custom elements created by the editor that do not exist in defaults.
      const defaultIds = new Set(fallbackScreen.elements.map(element => element.id));
      const customElements = savedScreen.elements.filter(element => !defaultIds.has(element.id));

      const hasAppliedDecorationCopies = savedScreen.elements.some(
        element => element.type === "image" && element.id.startsWith("decor-copy-")
      );
      const removeLegacyDuplicatedBackground =
        hasAppliedDecorationCopies &&
        typeof savedScreen.backgroundImage === "string" &&
        legacyDecorationBackgrounds.has(savedScreen.backgroundImage);

      return [
        screenId,
        {
          ...fallbackScreen,
          ...savedScreen,
          backgroundImage: removeLegacyDuplicatedBackground
            ? undefined
            : savedScreen.backgroundImage,
          deletedElementIds: [...deletedElementIds],
          elements: [...normalizedDefaultElements, ...customElements],
        },
      ];
    })
  ) as Record<InviteScreenId, InviteScreen>;

  const savedLayouts = Object.fromEntries(
    Object.entries(rawSavedLayouts).map(([layoutId, rawLayout]) => {
      const layout = structuredClone(rawLayout);
      const screenStyle = { ...(layout.screenStyle || {}) } as InviteSavedLayout["screenStyle"];

      // Decoration presets are intentionally image-only. Full screen backgrounds
      // remain a property of each individual screen and are edited under "Tela".
      delete screenStyle.backgroundImage;
      delete screenStyle.backgroundSize;
      delete screenStyle.backgroundRepeat;
      delete screenStyle.backgroundPositionX;
      delete screenStyle.backgroundPositionY;
      delete screenStyle.backgroundOpacity;

      return [
        layoutId,
        {
          ...layout,
          decorationRevision: 2 as const,
          screenStyle,
          elements: (layout.elements || []).filter(element => element.type === "image"),
        },
      ];
    })
  ) as Record<string, InviteSavedLayout>;

  const rsvpScenarios = buildRsvpScenarios(
    screens.rsvp,
    (config as InviteVisualConfig).rsvpScenarios
  );

  const rawInviteFlow = (config as InviteVisualConfig).inviteFlow;

  const rawAfterInvite = rawInviteFlow?.afterInviteScreen;
  const afterInviteScreen: InviteScreen =
    rawAfterInvite && Array.isArray(rawAfterInvite.elements)
      ? {
          ...structuredClone(screens.invite),
          ...structuredClone(rawAfterInvite),
          id: "invite",
          name: rawAfterInvite.name || "Convite após confirmação",
          elements: structuredClone(rawAfterInvite.elements),
        }
      : {
          ...structuredClone(screens.invite),
          id: "invite",
          name: "Convite após confirmação",
        };

  const inviteFlow: InviteFlowSettings = {
    continuousBackground: rawInviteFlow?.continuousBackground === true,
    backgroundSource: rawInviteFlow?.backgroundSource === "gifts" ? "gifts" : "invite",
    afterInviteScreen,
  };

  return {
    version: 2,
    screens,
    savedLayouts,
    rsvpScenarios,
    inviteFlow,
  };
}

export function resolveInviteFlowScreen(
  config: InviteVisualConfig,
  state: "before" | "after"
): InviteScreen {
  if (state === "after" && config.inviteFlow?.afterInviteScreen) {
    return structuredClone(config.inviteFlow.afterInviteScreen);
  }

  return structuredClone(config.screens.invite);
}

export function migrateInviteVisualConfig(
  value: InviteVisualConfig | LegacyInviteVisualConfigV1
): InviteVisualConfig {
  // v1 and v2 currently share the same visual shape. The explicit migration
  // boundary lets future schema changes evolve without leaking into renderers.
  return normalizeInviteVisualConfig(value);
}

