import { InviteVisualBuilder } from "@/components/admin/invite-builder/InviteVisualBuilder";
import { defaultInviteVisualConfig } from "@/lib/invite-builder";
import { getInviteVisualConfig } from "@/lib/invite-builder-server";
import { getInviteEditorPreviewData } from "@/lib/invite-editor-preview";
import { requireOwner } from "@/lib/sessions";

export default async function GestaoInviteEditorPage() {
  const session = await requireOwner("/gestao/editor");
  const [config, previewData] = await Promise.all([
    getInviteVisualConfig(session.event_id),
    getInviteEditorPreviewData(session.event_id),
  ]);

  return (
    <InviteVisualBuilder
      initial={config}
      defaults={defaultInviteVisualConfig}
      previewData={previewData}
    />
  );
}
