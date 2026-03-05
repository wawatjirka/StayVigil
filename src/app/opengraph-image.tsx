import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "STAYVIGIL — AI Skill Verification";
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
          backgroundColor: "#1a1410",
          fontFamily: "monospace",
          backgroundImage:
            "linear-gradient(rgba(218, 119, 86, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(218, 119, 86, 0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        {/* Eye icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            border: "3px solid #da7756",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
            boxShadow: "0 0 30px rgba(218, 119, 86, 0.3)",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#da7756",
            }}
          />
        </div>

        {/* Title */}
        <span
          style={{
            fontSize: "56px",
            fontWeight: 900,
            color: "#da7756",
            letterSpacing: "0.15em",
            textShadow:
              "0.05em 0 0 rgba(218,119,86,0.5), -0.025em -0.05em 0 rgba(255,160,100,0.3), 0.025em 0.05em 0 rgba(180,80,50,0.3)",
          }}
        >
          STAYVIGIL
        </span>

        {/* Subtitle */}
        <span
          style={{
            fontSize: "22px",
            color: "#8a5a3a",
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
