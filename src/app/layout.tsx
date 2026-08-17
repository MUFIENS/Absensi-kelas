import type { Metadata } from "next";
import { Fredoka, Lilita_One, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const lilitaOne = Lilita_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-lilita",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Absensi QR XI PPLG 1 — SMKN 1 Ciomas",
  description: "Aplikasi Absensi Siswa Kelas XI PPLG 1 SMKN 1 Ciomas Berbasis Dynamic QR Code & Live Camera Selfie Verification",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Absensi XI PPLG 1",
  },
};

export const viewport = {
  themeColor: "#FFD400",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${fredoka.variable} ${lilitaOne.variable} ${plusJakartaSans.variable} scroll-smooth`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-[#F8F8F5] text-[#181818] font-sans antialiased selection:bg-[#FFD400] selection:text-[#181818]"
      >
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
