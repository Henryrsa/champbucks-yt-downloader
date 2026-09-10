import { NextRequest, NextResponse } from "next/server";
import { isValidYoutubeUrl, buildDownloadArgs, getYtDlpCommand } from "@/lib/ytdlp";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { url, type, quality } = await req.json();
    if (!url || !isValidYoutubeUrl(url)) return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    if (!["mp3","mp4"].includes(type)) return NextResponse.json({ error: "Type must be mp3 or mp4" }, { status: 400 });
    if (!quality) return NextResponse.json({ error: "Quality required" }, { status: 400 });

    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "champbucks-"));
    const outTemplate = path.join(tmpDir, "%(title)s.%(ext)s");
    const { cmd, argsPrefix } = getYtDlpCommand();
    const args = [...argsPrefix, ...buildDownloadArgs(type as any, String(quality), outTemplate, url.trim())];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(cmd, args, { windowsHide: true });
      let err = "";
      proc.stderr.on("data", d => err += d.toString());
      proc.on("error", reject);
      proc.on("close", code => code === 0 ? resolve() : reject(new Error(err || `yt-dlp failed ${code}`)));
    });

    const files = await fs.promises.readdir(tmpDir);
    if (!files.length) throw new Error("No file generated. Check ffmpeg is installed.");
    const file = files[0];
    const filePath = path.join(tmpDir, file);
    const stat = await fs.promises.stat(filePath);
    const ext = type === "mp3" ? "mp3" : "mp4";
    const mime = type === "mp3" ? "audio/mpeg" : "video/mp4";
    const buffer = await fs.promises.readFile(filePath);
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
    const safeName = file.replace(/[^\w\-\.\s]/g, "_");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Content-Length": String(stat.size),
        "X-File-Ext": ext,
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Download failed", hint: "Requires python yt-dlp + ffmpeg. For Vercel, deploy via Docker." }, { status: 500 });
  }
}
