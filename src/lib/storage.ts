import { createClient } from "@supabase/supabase-js";
import { GIFT_IMAGE_MAX_BYTES, GIFT_IMAGE_MAX_MB } from "@/lib/upload-limits";

const bucket = process.env.SUPABASE_BUCKET || "gift-images";

function storageClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase Storage não configurado.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function uploadGiftImage(
  eventId: string,
  giftId: string,
  file: File
) {
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowed.has(file.type)) throw new Error("Formato de imagem não permitido.");
  if (file.size > GIFT_IMAGE_MAX_BYTES) throw new Error(`A imagem deve ter até ${GIFT_IMAGE_MAX_MB} MB.`);

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `events/${eventId}/gifts/${giftId}/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const client = storageClient();
  const { error } = await client.storage.from(bucket).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
    cacheControl: "31536000"
  });
  if (error) throw error;
  return path;
}

export async function deleteGiftImage(path: string | null) {
  if (!path) return;
  const client = storageClient();
  await client.storage.from(bucket).remove([path]);
}

export async function signGiftImage(path: string | null) {
  if (!path) return null;
  const client = storageClient();
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export async function signGiftImages(paths: Array<string | null>) {
  const unique = [...new Set(paths.filter(Boolean) as string[])];
  if (!unique.length) return new Map<string, string>();

  const client = storageClient();
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrls(unique, 60 * 60);
  if (error || !data) return new Map<string, string>();

  const result = new Map<string, string>();
  data.forEach((item, index) => {
    if (item.signedUrl) result.set(unique[index], item.signedUrl);
  });
  return result;
}


export async function uploadInviteAsset(
  eventId: string,
  file: File
) {
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowed.has(file.type)) throw new Error("Formato de imagem não permitido.");
  if (file.size > 4 * 1024 * 1024) throw new Error("A imagem deve ter até 4 MB após otimização.");

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `events/${eventId}/invite-assets/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const client = storageClient();
  const { error } = await client.storage.from(bucket).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
    cacheControl: "31536000"
  });

  if (error) throw error;
  return path;
}


export function giftImageUrl(path: string | null | undefined) {
  if (!path) return null;
  return `/api/gift-assets?path=${encodeURIComponent(path)}`;
}
