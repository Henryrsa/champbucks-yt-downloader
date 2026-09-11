import ytdl from "@distube/ytdl-core";

export function isValidYoutubeUrl(url: string) {
  try {
    const u = new URL(url);
    return /^(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)$/.test(u.hostname) || url.includes("youtube") || url.includes("youtu.be");
  } catch { return false; }
}

export async function getVideoInfo(url: string) {
  const info = await ytdl.getInfo(url);
  const d = info.videoDetails;
  const thumbnails = d.thumbnails;
  const thumb = thumbnails[thumbnails.length - 1]?.url || "";
  const formats = info.formats || [];
  return {
    title: d.title,
    thumbnail: thumb,
    duration: Number(d.lengthSeconds),
    durationString: d.lengthSeconds ? `${Math.floor(Number(d.lengthSeconds)/60)}:${String(Number(d.lengthSeconds)%60).padStart(2,"0")}` : "",
    uploader: d.author?.name || d.ownerChannelName || "",
    viewCount: d.viewCount,
    id: d.videoId,
    _rawFormats: formats,
    _details: d,
    _info: info,
  };
}

export function pickFormat(info: any, type: "mp3"|"mp4", quality: string) {
  const formats = info._rawFormats || info.formats || [];
  if (type === "mp3") {
    const q = parseInt(quality.replace("kbps","").replace("k",""), 10) || 192;
    const audioOnly = formats.filter((f:any)=> f.hasAudio && !f.hasVideo);
    const sorted = audioOnly.sort((a:any,b:any)=> (b.audioBitrate||0)-(a.audioBitrate||0));
    let chosen = sorted.find((f:any)=> (f.audioBitrate||0) <= q) || sorted[0] || formats.find((f:any)=>f.hasAudio);
    if (!chosen) throw new Error("No audio format found");
    return chosen;
  } else {
    const h = parseInt(quality.replace("p","").replace("P",""), 10) || 1080;
    const withVideo = formats.filter((f:any)=> f.hasVideo);
    const muxed = withVideo.filter((f:any)=> f.hasAudio && f.hasVideo);
    const candidates = muxed.length ? muxed : withVideo;
    const eligible = candidates.filter((f:any)=> (f.height||0) <= h);
    const pool = eligible.length ? eligible : candidates;
    pool.sort((a:any,b:any)=> (b.height||0)-(a.height||0) || (b.bitrate||0)-(a.bitrate||0));
    const chosen = pool[0];
    if (!chosen) throw new Error("No video format found");
    return chosen;
  }
}

export function getDownloadStream(url: string, info: any, type: "mp3"|"mp4", quality: string) {
  const format = pickFormat(info, type, quality);
  const stream = ytdl.downloadFromInfo(info._info, { format });
  return { format, stream };
}
