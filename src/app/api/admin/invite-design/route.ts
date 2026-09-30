import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/sessions";
import { sameOriginStrict } from "@/lib/security";
import { db } from "@/lib/db";
import { adminLog } from "@/lib/admin-log";
import {
  defaultInviteVisualConfig,
  normalizeInviteVisualConfig,
  type InviteVisualConfig
} from "@/lib/invite-builder";
import { getInviteVisualConfig } from "@/lib/invite-builder-server";

function validConfig(value: any): value is InviteVisualConfig {
  if (!value || value.version !== 2 || !value.screens) return false;

  const ids = ["cover", "access", "invite", "rsvp", "gifts"];

  const safeHref = (href: unknown) => {
    if (href == null || href === "") return true;
    if (typeof href !== "string" || href.length > 2000) return false;

    // Dynamic links are stored in the visual config as template variables
    // and resolved only when the public invitation is rendered.
    // Example: {{maps_url}}.
    if (/^\{\{[a-z0-9_]+\}\}$/i.test(href)) return true;

    return (
      href.startsWith("/") ||
      href.startsWith("#") ||
      href.startsWith("https://") ||
      href.startsWith("http://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    );
  };

  const cssOk = (css: unknown) =>
    css == null || (typeof css === "string" && css.length <= 20_000);

  const safeImageRef = (value: unknown) => {
    if (value == null || value === "") return true;
    if (typeof value !== "string" || value.length > 750_000) return false;

    // Existing saved designs may still contain optimized data URLs.
    if (/^data:image\/(?:png|jpeg|webp);base64,/i.test(value)) return true;

    return (
      value.startsWith("/") ||
      value.startsWith("https://") ||
      value.startsWith("http://")
    );
  };

  const validElement = (element: any) => {
    if (!element || typeof element.id !== "string" || element.id.length > 160) return false;
    if (!safeHref(element.href)) return false;
    if (!safeImageRef(element.src) || !safeImageRef(element.backgroundImage)) return false;
    if (typeof element.text === "string" && element.text.length > 10_000) return false;
    if (!cssOk(element.customCss) || !cssOk(element.hoverCss) || !cssOk(element.focusCss) || !cssOk(element.activeCss)) {
      return false;
    }

    const validateParts = (parts: any) => {
      if (!parts || typeof parts !== "object" || Array.isArray(parts)) return false;
      const entries = Object.entries(parts);
      if (entries.length > 100) return false;

      for (const [key, part] of entries) {
        if (key.length > 160 || !part || typeof part !== "object") return false;
        const p = part as any;
        if (typeof p.text === "string" && p.text.length > 10_000) return false;
        if (typeof p.visible !== "undefined" && typeof p.visible !== "boolean") return false;
        if (!safeImageRef(p.backgroundImage)) return false;
        if (!cssOk(p.customCss) || !cssOk(p.hoverCss) || !cssOk(p.focusCss) || !cssOk(p.activeCss)) {
          return false;
        }
      }
      return true;
    };

    const parts = element.partStyles;
    if (parts && !validateParts(parts)) return false;

    const scenarioPartStyles = element.scenarioPartStyles;
    if (scenarioPartStyles != null) {
      if (!scenarioPartStyles || typeof scenarioPartStyles !== "object" || Array.isArray(scenarioPartStyles)) return false;
      const scenarios = Object.entries(scenarioPartStyles);
      if (scenarios.length > 12) return false;
      for (const [scenarioId, scenarioParts] of scenarios) {
        if (scenarioId.length > 80 || !validateParts(scenarioParts)) return false;
      }
    }
    return true;
  };

  const rsvpScenarios = value.rsvpScenarios;
  if (rsvpScenarios != null) {
    if (!rsvpScenarios || typeof rsvpScenarios !== "object" || Array.isArray(rsvpScenarios)) return false;
    const allowed = new Set(["children-question","form-no-children","form-children","confirmed","error"]);
    const entries = Object.entries(rsvpScenarios);
    if (entries.length > 5) return false;
    for (const [scenarioId, raw] of entries) {
      if (!allowed.has(scenarioId) || !raw || typeof raw !== "object") return false;
      const scenario = raw as any;
      if (!Array.isArray(scenario.elements) || scenario.elements.length > 120) return false;
      if (!scenario.elements.every(validElement)) return false;
      if (scenario.screenStyle != null && (typeof scenario.screenStyle !== "object" || Array.isArray(scenario.screenStyle))) return false;
      if (!safeImageRef(scenario.screenStyle?.backgroundImage)) return false;
      if (!cssOk(scenario.screenStyle?.customCss)) return false;
      if (scenario.deletedElementIds != null && !Array.isArray(scenario.deletedElementIds)) return false;
    }
  }

  const inviteFlow = value.inviteFlow;
  if (inviteFlow != null) {
    if (!inviteFlow || typeof inviteFlow !== "object" || Array.isArray(inviteFlow)) return false;
    if (
      typeof inviteFlow.continuousBackground !== "undefined" &&
      typeof inviteFlow.continuousBackground !== "boolean"
    ) return false;
    if (
      typeof inviteFlow.backgroundSource !== "undefined" &&
      inviteFlow.backgroundSource !== "invite" &&
      inviteFlow.backgroundSource !== "gifts"
    ) return false;

    const afterScreen = inviteFlow.afterInviteScreen;
    if (afterScreen != null) {
      if (
        !afterScreen ||
        typeof afterScreen !== "object" ||
        Array.isArray(afterScreen) ||
        afterScreen.id !== "invite" ||
        !Array.isArray(afterScreen.elements) ||
        afterScreen.elements.length > 120 ||
        typeof afterScreen.backgroundColor !== "string" ||
        typeof afterScreen.minHeight !== "number" ||
        !cssOk(afterScreen.customCss) ||
        !safeImageRef(afterScreen.backgroundImage) ||
        !afterScreen.elements.every(validElement)
      ) {
        return false;
      }
    }
  }

  const savedLayouts = value.savedLayouts;
  if (savedLayouts != null) {
    if (!savedLayouts || typeof savedLayouts !== "object" || Array.isArray(savedLayouts)) return false;
    const layouts = Object.entries(savedLayouts);
    if (layouts.length > 30) return false;

    for (const [layoutId, raw] of layouts) {
      if (layoutId.length > 160 || !raw || typeof raw !== "object") return false;
      const layout = raw as any;
      if (typeof layout.id !== "string" || layout.id !== layoutId) return false;
      if (typeof layout.name !== "string" || layout.name.trim().length < 1 || layout.name.length > 80) return false;
      if (!ids.includes(layout.sourceScreenId)) return false;
      if (!layout.screenStyle || typeof layout.screenStyle !== "object") return false;
      if (!Array.isArray(layout.elements) || layout.elements.length > 120) return false;
      if (!layout.elements.every((element: any) => element?.type === "image" && validElement(element))) return false;

      if (!safeImageRef(layout.screenStyle.backgroundImage)) return false;
      if (!cssOk(layout.screenStyle.customCss)) return false;
    }
  }

  return ids.every(id => {
    const screen = value.screens[id];
    if (!screen || !Array.isArray(screen.elements) || screen.elements.length > 120) {
      return false;
    }

    if (!cssOk(screen.customCss)) return false;
    if (!safeImageRef(screen.backgroundImage)) return false;

    return screen.elements.every(validElement);
  });
}

export async function GET() {
  const session = await getOwnerSession();
  if (!session) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  const config = await getInviteVisualConfig(session.event_id);
  return NextResponse.json({ config, defaults: defaultInviteVisualConfig });
}

export async function PUT(request: Request) {
  if (!sameOriginStrict(request)) return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const session = await getOwnerSession();
  if (!session) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.config || body.config.version !== 2 || !body.config.screens) {
    return NextResponse.json({ message: "Configuração visual inválida." }, { status: 400 });
  }

  const normalized = normalizeInviteVisualConfig(body.config as InviteVisualConfig);
  if (!validConfig(normalized)) {
    return NextResponse.json({ message: "Configuração visual inválida." }, { status: 400 });
  }

  const serialized = JSON.stringify(normalized);
  if (serialized.length > 2_000_000) return NextResponse.json({ message: "Configuração visual muito grande (limite de 2 MB)." }, { status: 413 });

  const sql = db();
  await sql`
    INSERT INTO invite_visual_designs (event_id, config, updated_at)
    VALUES (${session.event_id}, ${serialized}::jsonb, now())
    ON CONFLICT (event_id) DO UPDATE SET config = EXCLUDED.config, updated_at = now()
  `;
  await adminLog({ eventId: session.event_id, adminId: session.admin_id, action: "invite_visual_design_updated", entityType: "event", entityId: session.event_id });
  return NextResponse.json(
    { ok: true, config: normalized, savedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
