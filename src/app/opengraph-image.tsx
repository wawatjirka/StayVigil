import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Vigil Protocol — AI Skill Verification";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Shield */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 64 64"
          fill="none"
        >
          <defs>
            <linearGradient id="og-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <path
            d="M32 4L8 16v16c0 14.4 10.24 27.84 24 32 13.76-4.16 24-17.6 24-32V16L32 4z"
            fill="url(#og-grad)"
          />
          <path d="M24 20l8 20 8-20h-5l-3 10-3-10h-5z" fill="white" />
        </svg>

        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "12px",
            marginTop: "32px",
          }}
        >
          <span
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "#fafafa",
            }}
          >
            Vigil
          </span>
          <span
            style={{
              fontSize: "48px",
              fontWeight: 300,
              color: "#a1a1aa",
            }}
          >
            Protocol
          </span>
        </div>

        {/* Subtitle */}
        <span
          style={{
            fontSize: "22px",
            color: "#71717a",
            marginTop: "16px",
          }}
        >
          AI Skill Verification on Base
        </span>
      </div>
    ),
    { ...size }
  );
}
