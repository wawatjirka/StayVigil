import { x402ResourceServer } from "@x402/core/server";

// Base Sepolia network identifier (CAIP-2)
export const BASE_SEPOLIA = "eip155:84532";
// Base mainnet
export const BASE_MAINNET = "eip155:8453";

// Use Base Sepolia for now (testnet)
export const NETWORK = BASE_SEPOLIA;

// Price per scan in USDC
export const SCAN_PRICE = "$0.02";

// Receiving wallet address — set via env
export const PAY_TO = process.env.X402_PAY_TO_ADDRESS || "0x0000000000000000000000000000000000000000";

let _server: x402ResourceServer | null = null;

export function getX402Server(): x402ResourceServer {
  if (_server) return _server;

  // No-arg constructor — facilitator is auto-discovered during initialize()
  _server = new x402ResourceServer();

  return _server;
}
