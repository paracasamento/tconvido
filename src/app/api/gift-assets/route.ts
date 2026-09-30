import { NextResponse } from "next/server";
import { signGiftImage } from "@/lib/storage";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path") || "";

  if (
    path.length < 10 ||
    path.length > 500 ||
    !/^events\/[a-f0-9-]+\/gifts\/[a-f0-9-]+\/[a-f0-9-]+\.(?:jpg|png|webp)$/i.test(path)
  ) {
    return NextResponse.json({ message: "Imagem inválida." }, { status: 400 });
  }

  const signedUrl = await signGiftImage(path);
  if (!signedUrl) {
    return NextResponse.json({ message: "Imagem não encontrada." }, { status: 404 });
  }

  const response = NextResponse.redirect(signedUrl, 307);
  // The source URL is stable while the signed destination is valid for one hour.
  // This prevents repeated signing work during normal navigation/refreshes.
  response.headers.set(
    "Cache-Control",
    "public, max-age=3000, stale-while-revalidate=300"
  );
  return response;
}
