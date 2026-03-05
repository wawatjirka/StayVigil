"use client";

import { type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@rainbow-me/rainbowkit/styles.css";

const config = getDefaultConfig({
  appName: "StayVigil",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "PLACEHOLDER",
  chains: [base],
  ssr: true,
});

const queryClient = new QueryClient();

export function BaseProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#00ff00",
            accentColorForeground: "black",
            borderRadius: "none",
            fontStack: "system",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
