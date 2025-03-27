import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cargo Update",
  description: "A container stacking game where you update Rust dependencies",
  metadataBase: new URL('https://cargo-update-game.vercel.app'),
  openGraph: {
    title: 'Cargo Update',
    description: 'Stack containers and update your Rust dependencies in this unique puzzle game',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Cargo Update - Container Stacking Game',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cargo Update',
    description: 'Stack containers and update your Rust dependencies in this unique puzzle game',
    images: ['/api/og'],
  },
  icons: {
    icon: '/api/icon',
    shortcut: '/api/icon',
    apple: '/api/icon',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/api/icon" type="image/svg+xml" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
