import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Pub DB – Probably the world's best database of pubs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f4f4f0",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              background: "#111111",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "28px",
              fontWeight: "700",
            }}
          >
            P
          </div>
          <span
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#111111",
              letterSpacing: "-0.5px",
            }}
          >
            Pub DB
          </span>
        </div>
        <div
          style={{
            fontSize: "64px",
            fontWeight: "800",
            color: "#111111",
            lineHeight: "1.1",
            letterSpacing: "-2px",
            marginBottom: "24px",
            maxWidth: "800px",
          }}
        >
          Probably the world&apos;s best pub database.
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "#6b7280",
            fontWeight: "400",
            maxWidth: "700px",
          }}
        >
          Browse, search, and contribute to a growing collection of pubs.
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            right: "80px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#111111",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "20px",
            fontWeight: "600",
          }}
        >
          thepubdb.com
        </div>
      </div>
    ),
    { ...size }
  );
}
