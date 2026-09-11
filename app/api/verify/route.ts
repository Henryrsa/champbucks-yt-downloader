import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token, startedAt } = await req.json();
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (secret && token) {
      const form = new FormData();
      form.append("secret", secret);
      form.append("response", token);
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
      if (ip) form.append("remoteip", ip);
      const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
      const j: any = await r.json();
      if (!j.success) return NextResponse.json({ ok: false, error: "Bot verification failed" }, { status: 400 });
      return NextResponse.json({ ok: true });
    }
    if (typeof startedAt === "number") {
      const elapsed = Date.now() - startedAt;
      if (elapsed < 1500) return NextResponse.json({ ok: false, error: "Too fast — confirm you're human" }, { status: 400 });
      if (elapsed > 10 * 60 * 1000) return NextResponse.json({ ok: false, error: "Expired, retry" }, { status: 400 });
    }
    if (!token) return NextResponse.json({ ok: false, error: "Missing verification" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "Verify failed" }, { status: 500 });
  }
}
