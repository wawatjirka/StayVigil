import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "VIGIL PROTOCOL — AI Skill Verification",
  description:
    "Scan AI agent skills for vulnerabilities, prompt injection, and malicious patterns before they nuke your wallet.",
  metadataBase: new URL("https://vigil-protocol.vercel.app"),
  openGraph: {
    title: "VIGIL PROTOCOL — AI Skill Verification",
    description:
      "Scan AI agent skills for vulnerabilities, prompt injection, and malicious patterns before installing them.",
    siteName: "Vigil Protocol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIGIL PROTOCOL — AI Skill Verification",
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
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${jetbrainsMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
