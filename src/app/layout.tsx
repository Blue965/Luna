import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Luna AI — L'assistant IA pour Roblox Studio",
  description:
    "L'assistant IA conçu pour Roblox Studio. Génère du Luau sécurisé, corrige tes bugs et construis des mécaniques de gameplay plus intelligentes.",
  keywords: ["Luna AI", "Roblox Studio", "Luau", "génération de code", "gameplay", "assistant IA"],
  authors: [{ name: "Luna AI" }],
  openGraph: {
    title: "Luna AI — Code plus vite. Crée sans limites.",
    description:
      "L'assistant IA conçu pour Roblox Studio : génération Luau sécurisée, débogage intelligent et conception de gameplay.",
    siteName: "Luna AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Luna AI — L'assistant IA pour Roblox Studio",
    description: "Génère du Luau sécurisé, corrige tes bugs et construis des mécaniques de gameplay plus intelligentes.",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
