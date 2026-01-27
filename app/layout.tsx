import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PolicySprint AI",
  description: "Generate AI Use Policies, staff guides and training content in minutes.",
  icons: {
    icon: [
      {
        url: "/branding/logo/policysprint-app-icon-128.png",
        sizes: "128x128",
        type: "image/png",
      },
      {
        url: "/branding/logo/policysprint-app-icon-256.png",
        sizes: "256x256",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/branding/logo/policysprint-app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}
      >
        <div className="min-h-screen flex flex-col">
          <Header />

          {/* Content should start immediately under the header.
              If Header is fixed, handle spacing inside Header itself (or we can re-add a precise offset). */}
          <main className="flex-1">{children}</main>

          <Footer />
        </div>
      </body>
    </html>
  );
}
