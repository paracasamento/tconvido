import type { CSSProperties } from "react";
import type { InviteElement, InvitePartStyle, InviteScreen } from "@/lib/invite-builder";

export function inviteFontStack(font?: string) {
  if (font === "Inter") return "var(--font-body), Inter, Arial, sans-serif";
  if (font === "Cormorant Garamond") return "var(--font-display), 'Cormorant Garamond', Georgia, serif";
  return `${font || "var(--font-display)"}, serif`;
}

function cssValue(value: string | number | undefined, suffix = "") {
  return value === undefined ? undefined : `${value}${suffix}`;
}

function backgroundValue(value: Pick<InviteElement, "useGradient" | "gradientAngle" | "gradientFrom" | "gradientTo" | "backgroundImage" | "backgroundColor">) {
  if (value.useGradient) {
    return `linear-gradient(${value.gradientAngle ?? 180}deg, ${value.gradientFrom || "#fff"}, ${value.gradientTo || "#eee"})`;
  }
  if (value.backgroundImage) {
    return `url("${String(value.backgroundImage).replace(/"/g, "%22")}")`;
  }
  return value.backgroundColor ?? "transparent";
}

export function elementStyleFromConfig(el: InviteElement): CSSProperties & Record<string, unknown> {
  const sx = (el.scaleX ?? 1) * (el.flipX ? -1 : 1);
  const sy = (el.scaleY ?? 1) * (el.flipY ? -1 : 1);

  return {
    position: "absolute",
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: `${el.width}%`,
    height: el.autoHeight ? "auto" : `${el.height}%`,
    minHeight: el.autoHeight ? 0 : undefined,
    opacity: el.opacity,
    transform: `rotate(${el.rotate}deg) scale(${sx}, ${sy})`,
    transformOrigin: "center",
    zIndex: el.zIndex,
    display: el.visible ? "flex" : "none",
    alignItems: el.autoHeight ? "flex-start" : "center",
    justifyContent: "center",
    boxSizing: "border-box",
    overflow: el.type === "slot" ? "visible" : "hidden",
    color: el.color,
    background: backgroundValue(el),
    backgroundSize: el.backgroundSize || "cover",
    backgroundRepeat: el.backgroundRepeat || "no-repeat",
    backgroundPosition: `${el.backgroundPositionX ?? 50}% ${el.backgroundPositionY ?? 50}%`,
    border: `${el.borderWidth || 0}px ${el.borderStyle || "solid"} ${el.borderColor || "transparent"}`,
    borderRadius: el.borderRadius ?? 0,
    padding: `${el.paddingY || 0}px ${el.paddingX || 0}px`,
    boxShadow: `${el.shadowX || 0}px ${el.shadowY || 0}px ${el.shadowBlur || 0}px ${el.shadowSpread || 0}px ${el.shadowColor || "transparent"}`,
    fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
    fontFamily: inviteFontStack(el.fontFamily),
    fontWeight: el.fontWeight,
    fontStyle: el.fontStyle,
    textDecoration: el.textDecoration,
    textTransform: el.textTransform,
    textAlign: el.textAlign,
    lineHeight: el.lineHeight ?? 1.06,
    letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
    whiteSpace: "pre-wrap",
  };
}

export function partStyleFromConfig(style: InvitePartStyle = {}): CSSProperties {
  const result: CSSProperties = {
    display: style.visible === false ? "none" : style.display,
    color: style.color,
    backgroundColor: style.backgroundColor,
    opacity: style.opacity,
    width: style.width,
    height: style.height,
    minHeight: style.minHeight,
    maxWidth: style.maxWidth,
    marginTop: style.marginTop,
    marginRight: style.marginRight,
    marginBottom: style.marginBottom,
    marginLeft: style.marginLeft,
    position: style.offsetX !== undefined || style.offsetY !== undefined ? "relative" : undefined,
    left: style.offsetX !== undefined ? `${style.offsetX}px` : undefined,
    top: style.offsetY !== undefined ? `${style.offsetY}px` : undefined,
    paddingTop: style.paddingTop,
    paddingRight: style.paddingRight,
    paddingBottom: style.paddingBottom,
    paddingLeft: style.paddingLeft,
    borderWidth: style.borderWidth,
    borderStyle: style.borderStyle,
    borderColor: style.borderColor,
    borderRadius: style.borderRadius,
    boxShadow: [style.shadowX, style.shadowY, style.shadowBlur, style.shadowSpread, style.shadowColor].some(v => v !== undefined)
      ? `${style.shadowX || 0}px ${style.shadowY || 0}px ${style.shadowBlur || 0}px ${style.shadowSpread || 0}px ${style.shadowColor || "transparent"}`
      : undefined,
    fontSize: style.fontSize,
    fontFamily: style.fontFamily ? inviteFontStack(style.fontFamily) : undefined,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    textDecoration: style.textDecoration,
    textTransform: style.textTransform,
    textAlign: style.textAlign,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    justifyContent: style.justifyContent,
    alignItems: style.alignItems,
    gap: style.gap,
    flexDirection: style.flexDirection,
    objectFit: style.objectFit,
    objectPosition:
      style.objectPositionX !== undefined || style.objectPositionY !== undefined
        ? `${style.objectPositionX ?? 50}% ${style.objectPositionY ?? 50}%`
        : undefined,
    boxSizing: "border-box",
  };

  if (style.backgroundImage) {
    result.backgroundImage = `url("${String(style.backgroundImage).replace(/"/g, "%22")}")`;
    result.backgroundSize = style.backgroundSize || "cover";
    result.backgroundRepeat = style.backgroundRepeat || "no-repeat";
    result.backgroundPosition = `${style.backgroundPositionX ?? 50}% ${style.backgroundPositionY ?? 50}%`;
  }

  return result;
}

export function declarationCss(style: InvitePartStyle = {}) {
  const out: string[] = [];
  const add = (key: string, value: unknown) => {
    if (value !== undefined && value !== "") out.push(`${key}:${value}`);
  };

  add("color", style.color);
  if (style.backgroundImage) add("background-image", `url("${String(style.backgroundImage).replace(/"/g, "%22")}")`);
  add("background-color", style.backgroundColor);
  add("background-size", style.backgroundSize);
  add("background-repeat", style.backgroundRepeat);
  if (style.backgroundPositionX !== undefined || style.backgroundPositionY !== undefined) {
    add("background-position", `${style.backgroundPositionX ?? 50}% ${style.backgroundPositionY ?? 50}%`);
  }
  add("opacity", style.opacity);
  add("width", style.width);
  add("height", style.height);
  add("min-height", cssValue(style.minHeight, "px"));
  add("max-width", style.maxWidth);
  add("margin-top", cssValue(style.marginTop, "px"));
  add("margin-right", cssValue(style.marginRight, "px"));
  add("margin-bottom", cssValue(style.marginBottom, "px"));
  add("margin-left", cssValue(style.marginLeft, "px"));
  if (style.offsetX !== undefined || style.offsetY !== undefined) add("position", "relative");
  add("left", cssValue(style.offsetX, "px"));
  add("top", cssValue(style.offsetY, "px"));
  add("padding-top", cssValue(style.paddingTop, "px"));
  add("padding-right", cssValue(style.paddingRight, "px"));
  add("padding-bottom", cssValue(style.paddingBottom, "px"));
  add("padding-left", cssValue(style.paddingLeft, "px"));
  if (style.borderWidth !== undefined) add("border-width", `${style.borderWidth}px`);
  add("border-style", style.borderStyle);
  add("border-color", style.borderColor);
  add("border-radius", cssValue(style.borderRadius, "px"));
  if ([style.shadowX, style.shadowY, style.shadowBlur, style.shadowSpread, style.shadowColor].some(v => v !== undefined)) {
    add("box-shadow", `${style.shadowX || 0}px ${style.shadowY || 0}px ${style.shadowBlur || 0}px ${style.shadowSpread || 0}px ${style.shadowColor || "transparent"}`);
  }
  add("font-size", cssValue(style.fontSize, "px"));
  if (style.fontFamily) add("font-family", inviteFontStack(style.fontFamily));
  add("font-weight", style.fontWeight);
  add("font-style", style.fontStyle);
  add("text-decoration", style.textDecoration);
  add("text-transform", style.textTransform);
  add("text-align", style.textAlign);
  add("line-height", style.lineHeight);
  add("letter-spacing", cssValue(style.letterSpacing, "px"));
  add("display", style.visible === false ? "none" : style.display);
  add("justify-content", style.justifyContent);
  add("align-items", style.alignItems);
  add("gap", cssValue(style.gap, "px"));
  add("flex-direction", style.flexDirection);
  add("object-fit", style.objectFit);
  if (style.objectPositionX !== undefined || style.objectPositionY !== undefined) {
    add("object-position", `${style.objectPositionX ?? 50}% ${style.objectPositionY ?? 50}%`);
  }
  if (style.customCss) out.push(style.customCss.replace(/[{}]/g, ""));
  return out.join(";");
}

export function buildScreenScopedCss(screen: InviteScreen, rootAttribute = "data-visual-id") {
  let css = "";

  for (const el of screen.elements) {
    const root = `[${rootAttribute}="${el.id}"]`;
    if (el.customCss) css += `${root}{${el.customCss.replace(/[{}]/g, "")}}\n`;
    if (el.hoverCss) css += `${root}:hover{${el.hoverCss.replace(/[{}]/g, "")}}\n`;
    if (el.focusCss) css += `${root}:focus,${root}:focus-within{${el.focusCss.replace(/[{}]/g, "")}}\n`;
    if (el.activeCss) css += `${root}:active{${el.activeCss.replace(/[{}]/g, "")}}\n`;

    for (const [part, style] of Object.entries(el.partStyles || {})) {
      const base = `${root} [data-part="${part}"]`;
      css += `${base}{${declarationCss(style)}}\n`;
      if (style.hoverCss) css += `${base}:hover{${style.hoverCss.replace(/[{}]/g, "")}}\n`;
      if (style.focusCss) css += `${base}:focus,${base}:focus-within{${style.focusCss.replace(/[{}]/g, "")}}\n`;
      if (style.activeCss) css += `${base}:active{${style.activeCss.replace(/[{}]/g, "")}}\n`;
      if ((part === "name-input" || part === "code-input") && style.placeholderColor) {
        css += `${base}::placeholder{color:${style.placeholderColor};opacity:1}\n`;
      }
    }

    for (const [scenario, parts] of Object.entries(el.scenarioPartStyles || {})) {
      for (const [part, style] of Object.entries(parts || {})) {
        const base = `${root} [data-rsvp-scenario="${scenario}"] [data-part="${part}"]`;
        css += `${base}{${declarationCss(style)}}\n`;
        if (style.hoverCss) css += `${base}:hover{${style.hoverCss.replace(/[{}]/g, "")}}\n`;
        if (style.focusCss) css += `${base}:focus,${base}:focus-within{${style.focusCss.replace(/[{}]/g, "")}}\n`;
        if (style.activeCss) css += `${base}:active{${style.activeCss.replace(/[{}]/g, "")}}\n`;
        if (part === "name-input" && style.placeholderColor) {
          css += `${base}::placeholder{color:${style.placeholderColor};opacity:1}\n`;
        }
      }
    }
  }

  if (screen.customCss) {
    css += `.visual-invite-screen[data-screen-id="${screen.id}"]{${screen.customCss.replace(/[{}]/g, "")}}`;
  }

  return css;
}
