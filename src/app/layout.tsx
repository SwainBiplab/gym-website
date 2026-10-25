import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { inkFor } from "@/lib/theme";
import { ThemeScript } from "@/components/theme/theme-script";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: s.name, template: `%s · ${s.name}` },
    description: s.tagline ?? "Memberships, classes, trainers and progress tracking — all in one place.",
    ...(s.logoDataUrl ? { icons: { icon: s.logoDataUrl } } : {}),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ ["--accent" as string]: s.accentColor, ["--on-accent" as string]: inkFor(s.accentColor) }}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <div className="spatial-bg" aria-hidden />
        {children}
      </body>
    </html>
  );
}
