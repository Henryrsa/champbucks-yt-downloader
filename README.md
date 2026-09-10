# Champbucks YT Downloader

YouTube to MP3 (up to 320kbps) & MP4 (up to 1080p) — fast, free, responsive. Built with Next.js + Tailwind + yt-dlp + ffmpeg.

## Features
- Paste any YouTube link, fetch info, choose quality
- MP3: 64/128/192/256/320kbps (ffmpeg audio extract)
- MP4: 144p/360p/480p/720p/1080p (merged via ffmpeg)
- Responsive UI

## Getting Started
```bash
npm install
# requires: python + yt-dlp (pip install yt-dlp) + ffmpeg on PATH
npm run dev
```
Open http://localhost:3000

## API
- `POST /api/info` { url } → title, thumbnail, duration
- `POST /api/download` { url, type: "mp3"|"mp4", quality } → file download

## Deploy
Vercel needs Docker for yt-dlp/ffmpeg, or use external API.

## License
For personal use only. Respect copyright.
