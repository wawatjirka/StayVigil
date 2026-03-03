import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@solana/wallet-adapter-react-ui",
    "@solana/wallet-adapter-wallets",
  ],
};

export default nextConfig;
