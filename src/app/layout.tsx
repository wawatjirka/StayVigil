import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vigil Protocol — AI Skill Verification",
  description:
    "Scan AI agent skills for vulnerabilities, prompt injection, and malicious patterns before installing them.",
  metadataBase: new URL("https://vigil-protocol.vercel.app"),
  openGraph: {
    title: "Vigil Protocol — AI Skill Verification",
    description:
      "Scan AI agent skills for vulnerabilities, prompt injection, and malicious patterns before installing them.",
    siteName: "Vigil Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vigil Protocol — AI Skill Verification",
    description:
      "Scan AI agent skills for vulnerabilities, prompt injection, and malicious patterns before installing them.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
