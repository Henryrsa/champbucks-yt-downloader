import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Champbucks — YouTube to MP3 & MP4",
  description: "Champbucks YouTube Download — Convert YouTube to MP3 (up to 320kbps) and MP4 (up to 1080p) fast, free, and responsive.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} min-h-full flex flex-col bg-[#FFFBEB]`}>{children}</body>
    </html>
  );
}
