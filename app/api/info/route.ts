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
    const thumbnails = info.thumbnails || [];
    const thumb = thumbnails[thumbnails.length - 1]?.url || info.thumbnail || "";
    const formats = info.formats || [];
    const hasMp4 = formats.some((f: any) => f.vcodec !== "none" && f.height);
    return NextResponse.json({
      title: info.title,
      thumbnail: thumb,
      duration: info.duration,
      durationString: info.duration_string,
      uploader: info.uploader,
      viewCount: info.view_count,
      formatsAvailable: {
        mp4: [...new Set<number>(formats.filter((f:any)=>f.vcodec!=="none"&&f.height).map((f:any)=>f.height))].sort((a:number,b:number)=>a-b),
        hasMp4
      },
      id: info.id,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch info", hint: "Ensure yt-dlp + ffmpeg installed. On Vercel use Docker or external API." }, { status: 500 });
  }
}
