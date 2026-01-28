import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "OpenCalc - Begrotingssoftware",
  description: "Open source begrotingsprogramma voor de bouwsector",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OpenCalc",
  },
  applicationName: "OpenCalc",
  keywords: ["begroting", "bouw", "calculator", "offerte", "kostenraming"],
  authors: [{ name: "OpenAEC Foundation" }],
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "OpenCalc",
    title: "OpenCalc - Begrotingssoftware",
    description: "Open source begrotingsprogramma voor de bouwsector",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
