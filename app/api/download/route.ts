import { NextRequest, NextResponse } from "next/server";
import { isValidYoutubeUrl, getVideoInfo, getDownloadStream } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { url, type, quality } = await req.json();
    if (!url || !isValidYoutubeUrl(url)) return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    if (!["mp3","mp4"].includes(type)) return NextResponse.json({ error: "Type must be mp3 or mp4" }, { status: 400 });
    if (!quality) return NextResponse.json({ error: "Quality required" }, { status: 400 });

    const info = await getVideoInfo(url.trim());
    const { format, stream } = getDownloadStream(url.trim(), info, type, String(quality));

    const isAudio = type === "mp3";
    const ext = isAudio ? (format.container || "m4a") : "mp4";
    const mime = isAudio ? (format.mimeType?.split(";")[0] || "audio/mp4") : "video/mp4";
    const safeTitle = (info.title || "champbucks").replace(/[^\w\-\s]/g, "_").slice(0,80);
    const filename = `${safeTitle}.${ext}`;

    const webStream = stream as unknown as ReadableStream;
    return new NextResponse(webStream as any, {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-File-Ext": ext,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Download failed", hint: "Pure Node — no python/ffmpeg needed. If blocked, retry." }, { status: 500 });
  }
}
