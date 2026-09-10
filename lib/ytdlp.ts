import { spawn } from "child_process";

export function isValidYoutubeUrl(url: string) {
  try {
    const u = new URL(url);
    return /^(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)$/.test(u.hostname) || url.includes("youtube") || url.includes("youtu.be");
  } catch { return false; }
}

export function getYtDlpCommand(): { cmd: string; argsPrefix: string[] } {
  return { cmd: "python", argsPrefix: ["-m", "yt_dlp"] };
}

export async function getVideoInfo(url: string) {
  const { cmd, argsPrefix } = getYtDlpCommand();
  const args = [...argsPrefix, "--dump-single-json", "--no-playlist", "--skip-download", url];
  return new Promise<any>((resolve, reject) => {
    const proc = spawn(cmd, args, { windowsHide: true });
    let out = "";
    let err = "";
    proc.stdout.on("data", d => out += d);
    proc.stderr.on("data", d => err += d);
    proc.on("error", reject);
    proc.on("close", code => {
      if (code !== 0) return reject(new Error(err || `yt-dlp exited ${code}`));
      try { resolve(JSON.parse(out)); } catch (e) { reject(e); }
    });
  });
}

export function buildDownloadArgs(type: "mp3"|"mp4", quality: string, outputTemplate: string, url: string) {
  const base = ["--no-playlist", "--no-warnings"];
  if (type === "mp3") {
    const q = quality.replace("kbps","").replace("k","");
    return [...base, "-x", "--audio-format", "mp3", "--audio-quality", `${q}K`, "-o", outputTemplate, url];
  } else {
    const h = quality.replace("p","").replace("P","");
    const fmt = `bv*[height<=${h}]+ba/b[height<=${h}]/b`;
    return [...base, "-f", fmt, "--merge-output-format", "mp4", "-o", outputTemplate, url];
  }
}
