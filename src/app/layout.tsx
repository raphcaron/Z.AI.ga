import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/yoga/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Boho Yoga - Find Your Inner Peace Through Movement",
  description: "Join our community for live yoga sessions, a vast library of classes, and personalized journeys for every level. Transform your practice today.",
  keywords: ["yoga", "yoga classes", "live yoga", "vinyasa", "hatha", "yin yoga", "meditation", "wellness"],
  authors: [{ name: "Boho Yoga Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Boho Yoga - Find Your Inner Peace",
    description: "Live yoga sessions and a vast library of classes for every level",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Boho Yoga",
    description: "Live yoga sessions and a vast library of classes for every level",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
