# Champbucks YT Downloader

YouTube to MP3 & MP4 — fast, free, responsive. Built with Next.js + Tailwind + @distube/ytdl-core (Pure Node, Vercel-native).

## Features
- Paste any YouTube link, fetch info, choose quality
- MP3: 64/128/192/256/320kbps (best available audio, no transcode)
- MP4: 144p/360p/480p/720p/1080p (muxed where available, Pure Node streaming)
- Responsive UI

## Getting Started
```bash
npm install
npm run dev
```
Open http://localhost:3000 — no python/ffmpeg needed.

## API
- `POST /api/info` { url } → title, thumbnail, duration
- `POST /api/download` { url, type: "mp3"|"mp4", quality } → file stream

## Deploy
Vercel-native — `npm i` only. No Docker, no python/ffmpeg. Push to GitHub → auto deploy.

## License
For personal use only. Respect copyright.
