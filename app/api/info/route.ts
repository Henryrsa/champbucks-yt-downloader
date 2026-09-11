import { NextRequest, NextResponse } from "next/server";
import { getVideoInfo, isValidYoutubeUrl } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") return NextResponse.json({ error: "URL required" }, { status: 400 });
    if (!isValidYoutubeUrl(url)) return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    const info = await getVideoInfo(url.trim());
    const formats = info._rawFormats || [];
    const heights = [...new Set<number>(formats.filter((f:any)=>f.hasVideo && f.height).map((f:any)=>f.height))].sort((a:number,b:number)=>a-b);
    return NextResponse.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      durationString: info.durationString,
      uploader: info.uploader,
      viewCount: info.viewCount,
      formatsAvailable: { mp4: heights, hasMp4: heights.length>0 },
      id: info.id,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch info", hint: "Pure Node — no python/ffmpeg needed. If blocked, retry or try another video." }, { status: 500 });
  }
}
