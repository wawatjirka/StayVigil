import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { SolanaProvider } from "@/components/SolanaProvider";
import { ChainProvider, BASE_ENABLED } from "@/lib/chain/context";
import { ConditionalBaseProvider } from "@/components/ConditionalBaseProvider";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "STAYVIGIL — AI Skill Verification",
  description:
    "Scan AI agent skills for vulnerabilities, prompt injection, and malicious patterns before they nuke your wallet.",
  metadataBase: new URL("https://vigil-protocol.vercel.app"),
  openGraph: {
    title: "STAYVIGIL — AI Skill Verification",
    description:
      "Scan AI agent skills for vulnerabilities, prompt injection, and malicious patterns before installing them.",
    siteName: "StayVigil",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STAYVIGIL — AI Skill Verification",
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
        <ChainProvider>
          <SolanaProvider>
            <ConditionalBaseProvider baseEnabled={BASE_ENABLED}>
              {children}
            </ConditionalBaseProvider>
          </SolanaProvider>
        </ChainProvider>
      </body>
    </html>
  );
}
