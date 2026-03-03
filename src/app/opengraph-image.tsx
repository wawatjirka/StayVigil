import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "VIGIL PROTOCOL — AI Skill Verification";
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
          backgroundColor: "#0a0a0f",
          fontFamily: "monospace",
          backgroundImage:
            "linear-gradient(rgba(0, 255, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        {/* Eye icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            border: "3px solid #00ff00",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
            boxShadow: "0 0 30px rgba(0, 255, 0, 0.3)",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#00ff00",
            }}
          />
        </div>

        {/* Title */}
        <span
          style={{
            fontSize: "56px",
            fontWeight: 900,
            color: "#00ff00",
            letterSpacing: "0.15em",
            textShadow:
              "0.05em 0 0 rgba(255,0,0,0.5), -0.025em -0.05em 0 rgba(0,255,0,0.5), 0.025em 0.05em 0 rgba(0,0,255,0.5)",
          }}
        >
          VIGIL PROTOCOL
        </span>

        {/* Subtitle */}
        <span
          style={{
            fontSize: "22px",
            color: "#337a33",
            marginTop: "16px",
            letterSpacing: "0.1em",
          }}
        >
          TRUST, BUT VERIFY // AI SKILL VERIFICATION
        </span>
      </div>
    ),
    { ...size }
  );
}
