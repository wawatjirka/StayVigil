"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// Lazy-load BaseProvider only when Base is enabled (avoids wagmi/RainbowKit in bundle)
const BaseProvider = dynamic(
  () => import("./BaseProvider").then((m) => ({ default: m.BaseProvider })),
  { ssr: false }
);

export function ConditionalBaseProvider({
  baseEnabled,
  children,
}: {
  baseEnabled: boolean;
  children: ReactNode;
}) {
  if (!baseEnabled) return <>{children}</>;
  return <BaseProvider>{children}</BaseProvider>;
}
