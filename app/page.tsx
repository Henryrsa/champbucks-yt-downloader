"use client";
import { useState, useEffect, useRef } from "react";

const MP3_QUALITIES = ["64kbps","128kbps","192kbps","256kbps","320kbps"];
const MP4_QUALITIES = ["144p","360p","480p","720p","1080p"];
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export default function Home() {
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState<"mp4"|"mp3">("mp4");
  const [mp3q, setMp3q] = useState("192kbps");
  const [mp4q, setMp4q] = useState("1080p");
  const [info, setInfo] = useState<any>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [checked, setChecked] = useState(false);
  const [token, setToken] = useState("");
  const startedAtRef = useRef<number>(Date.now());
  const turnstileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem("champbucks_verified")==="1") setVerified(true);
    startedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || verified) return;
    const id = "turnstile-script";
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.id = id;
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    document.head.appendChild(s);
    const iv = setInterval(() => {
      const w: any = (window as any).turnstile;
      if (w && turnstileRef.current && !turnstileRef.current.hasChildNodes()) {
        w.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (t: string) => setToken(t),
          "expired-callback": () => setToken(""),
        });
        clearInterval(iv);
      }
    }, 500);
    return () => clearInterval(iv);
  }, [verified]);

  const handleVerify = async () => {
    if (!checked) { setError("Check 'I am not a bot' to continue"); return; }
    if (TURNSTILE_SITE_KEY && !token) { setError("Complete the bot check"); return; }
    setVerifying(true); setError("");
    try {
      const r = await fetch("/api/verify", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ token: token || "fallback-checked", startedAt: startedAtRef.current }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Verification failed");
      setVerified(true);
      sessionStorage.setItem("champbucks_verified","1");
    } catch (e:any) { setError(e.message); }
    finally { setVerifying(false); }
  };

  const fetchInfo = async () => {
    if (!verified) { setError("Sign in to confirm you're not a bot first"); return; }
    setError(""); setInfo(null);
    if (!url.trim()) { setError("Paste a YouTube link first"); return; }
    setLoadingInfo(true);
    try {
      const r = await fetch("/api/info", { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setInfo(j);
    } catch (e:any) { setError(e.message); }
    finally { setLoadingInfo(false); }
  };

  const handleDownload = async () => {
    if (!verified) { setError("Sign in to confirm you're not a bot first"); return; }
    setError("");
    if (!url.trim()) { setError("Paste a YouTube link"); return; }
    setDownloading(true);
    try {
      const quality = tab === "mp3" ? mp3q : mp4q;
      const r = await fetch("/api/download", { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url, type: tab, quality }) });
      if (!r.ok) {
        const j = await r.json().catch(()=>({error:"Download failed"}));
        throw new Error(j.error + (j.hint ? " — "+j.hint : ""));
      }
      const blob = await r.blob();
      const disp = r.headers.get("Content-Disposition");
      const filename = disp?.match(/filename="(.+)"/)?.[1] || `champbucks-${Date.now()}.${tab==="mp3"?"mp3":"mp4"}`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e:any) { setError(e.message); }
    finally { setDownloading(false); }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-amber-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black text-lg">C$</div>
            <span className="font-black text-xl tracking-tight">Champbucks</span>
            <span className="hidden sm:inline text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">YouTube Download</span>
          </div>
          <a href="https://github.com" target="_blank" className="text-sm font-medium text-zinc-600 hover:text-black">GitHub</a>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            YouTube to <span className="text-amber-500">MP3</span> & <span className="text-amber-500">MP4</span>
          </h1>
          <p className="mt-3 text-zinc-600 text-base sm:text-lg">Paste any YouTube link. Pick quality. Download in seconds. Up to <b>320kbps</b> audio and <b>1080p</b> video.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs font-semibold">
            <span className="bg-white border border-amber-200 px-3 py-1 rounded-full">✓ No signup</span>
            <span className="bg-white border border-amber-200 px-3 py-1 rounded-full">✓ Pure Node</span>
            <span className="bg-white border border-amber-200 px-3 py-1 rounded-full">✓ Mobile ready</span>
          </div>
        </div>

        {!verified && (
          <div className="bg-white rounded-3xl shadow-xl border border-amber-100 p-5 sm:p-6 max-w-3xl mx-auto mb-6">
            <h2 className="font-black text-lg text-center">Sign in to confirm you&apos;re not a bot</h2>
            <p className="text-center text-sm text-zinc-500 mt-1">One quick check unlocks Fetch & Download</p>
            <div className="mt-4 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} className="w-5 h-5 rounded border-zinc-300 text-amber-500 focus:ring-amber-400" />
                <span className="font-bold text-sm">I am not a bot</span>
                <span className="ml-auto text-xs text-zinc-400">champbucks</span>
              </label>
              {TURNSTILE_SITE_KEY ? <div ref={turnstileRef} className="flex justify-center min-h-[65px]" /> : <p className="text-[11px] text-zinc-400 text-center">No keys needed — just check the box and continue. Add <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> + <code>TURNSTILE_SECRET_KEY</code> to enable Cloudflare Turnstile.</p>}
            </div>
            {error && <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">{error}</div>}
            <button onClick={handleVerify} disabled={verifying || !checked} className="mt-4 w-full py-3.5 rounded-2xl bg-black text-white font-black hover:bg-zinc-800 disabled:opacity-50">
              {verifying ? "Verifying..." : "Confirm & Continue →"}
            </button>
          </div>
        )}

        <div className={`bg-white rounded-3xl shadow-xl border border-amber-100 p-4 sm:p-6 max-w-3xl mx-auto ${!verified ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">🔗</span>
              <input
                value={url}
                onChange={e=>setUrl(e.target.value)}
                placeholder="https://youtu.be/... or https://youtube.com/watch?v=..."
                className="w-full pl-9 pr-3 py-3.5 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-zinc-50 text-sm sm:text-base"
                onKeyDown={e=>e.key==="Enter" && fetchInfo()}
              />
            </div>
            <button onClick={fetchInfo} disabled={loadingInfo || !verified} className="px-5 sm:px-6 py-3.5 rounded-2xl bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-50 text-sm whitespace-nowrap">
              {loadingInfo ? "Checking..." : "Fetch"}
            </button>
          </div>

          {error && verified && <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">{error}</div>}

          {info && (
            <div className="mt-5 grid sm:grid-cols-[200px_1fr] gap-4 bg-amber-50/70 border border-amber-100 rounded-2xl p-3">
              <img src={info.thumbnail} alt="thumb" className="w-full h-28 sm:h-28 object-cover rounded-xl bg-white" />
              <div className="min-w-0">
                <div className="font-bold leading-tight line-clamp-2 text-sm sm:text-base">{info.title}</div>
                <div className="text-xs text-zinc-600 mt-1">{info.uploader} • {info.durationString || Math.round(info.duration/60)+" min"}</div>
                <div className="text-xs text-zinc-500 mt-1">ID: {info.id}</div>
              </div>
            </div>
          )}

          <div className="mt-6 flex bg-zinc-100 p-1 rounded-2xl w-fit mx-auto">
            <button onClick={()=>setTab("mp4")} className={`px-6 py-2 rounded-xl font-black text-sm transition ${tab==="mp4" ? "bg-white shadow text-amber-600" : "text-zinc-600"}`}>MP4 VIDEO</button>
            <button onClick={()=>setTab("mp3")} className={`px-6 py-2 rounded-xl font-black text-sm transition ${tab==="mp3" ? "bg-white shadow text-amber-600" : "text-zinc-600"}`}>MP3 AUDIO</button>
          </div>

          <div className="mt-4">
            {tab==="mp3" ? (
              <div>
                <div className="text-xs font-bold text-zinc-500 tracking-widest text-center">SELECT MP3 QUALITY (MAX 320kbps)</div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {MP3_QUALITIES.map(q=>(
                    <button key={q} onClick={()=>setMp3q(q)} className={`px-4 py-2 rounded-full border font-bold text-sm ${mp3q===q ? "bg-amber-500 text-white border-amber-500" : "bg-white border-zinc-200 hover:border-amber-300"}`}>
                      {q} {q==="320kbps" && "★"}
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-zinc-500 mt-2">Best available audio • Pure Node, no ffmpeg</p>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold text-zinc-500 tracking-widest text-center">SELECT MP4 QUALITY</div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {MP4_QUALITIES.map(q=>(
                    <button key={q} onClick={()=>setMp4q(q)} className={`px-4 py-2 rounded-full border font-bold text-sm ${mp4q===q ? "bg-amber-500 text-white border-amber-500" : "bg-white border-zinc-200 hover:border-amber-300"}`}>
                      {q} {q==="1080p" && "HD"}
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-zinc-500 mt-2">1080p muxed where available • Pure Node streaming</p>
              </div>
            )}
          </div>

          <button onClick={handleDownload} disabled={downloading || !verified} className="mt-6 w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-base sm:text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {downloading ? (
              <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Converting {tab.toUpperCase()}...</>
            ) : (
              <>⬇ Download {tab.toUpperCase()} {tab==="mp3" ? mp3q : mp4q}</>
            )}
          </button>
          <p className="text-center text-[11px] text-zinc-400 mt-3">For personal use only. Respect copyright. Powered by Pure Node.</p>
        </div>

        <div className="max-w-3xl mx-auto mt-8 grid sm:grid-cols-3 gap-3 text-center">
          <div className="bg-white rounded-2xl p-4 border border-zinc-100"><div className="text-2xl">⚡</div><div className="font-bold text-sm mt-1">Ultra Fast</div><div className="text-xs text-zinc-500">Vercel-native streaming</div></div>
          <div className="bg-white rounded-2xl p-4 border border-zinc-100"><div className="text-2xl">🎧</div><div className="font-bold text-sm mt-1">320kbps MP3</div><div className="text-xs text-zinc-500">Up to highest audio quality</div></div>
          <div className="bg-white rounded-2xl p-4 border border-zinc-100"><div className="text-2xl">📱</div><div className="font-bold text-sm mt-1">Responsive</div><div className="text-xs text-zinc-500">Works on phone & desktop</div></div>
        </div>
      </main>

      <footer className="border-t border-amber-100 bg-white/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-zinc-500">© {new Date().getFullYear()} Champbucks • Built with Next.js + Tailwind • Vercel-native • No python needed</div>
      </footer>
    </div>
  );
}
