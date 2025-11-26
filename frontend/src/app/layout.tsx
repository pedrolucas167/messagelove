import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0f0520",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "MessageLove - Crie memórias digitais inesquecíveis",
  description: "Transforme momentos especiais em presentes digitais únicos. Crie páginas personalizadas com fotos, vídeos e músicas para surpreender quem você ama.",
  keywords: ["presente digital", "memória", "surpresa", "cartão virtual", "QR code", "aniversário", "casamento"],
  authors: [{ name: "Pedro Marques" }],
  creator: "MessageLove",
  openGraph: {
    title: "MessageLove - Crie memórias digitais inesquecíveis",
    description: "Transforme momentos especiais em presentes digitais únicos.",
    url: "https://messagelove.app",
    siteName: "MessageLove",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MessageLove - Crie memórias digitais inesquecíveis",
    description: "Transforme momentos especiais em presentes digitais únicos.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
