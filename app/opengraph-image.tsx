import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "Richie McIlroy";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const [imageData, geistRegular, geistMedium] = await Promise.all([
    readFile(join(process.cwd(), "public/richie-beach.jpg")),
    fetch(
      "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-400-normal.woff"
    ).then((res) => res.arrayBuffer()),
    fetch(
      "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-500-normal.woff"
    ).then((res) => res.arrayBuffer()),
  ]);

  const imageBase64 = `data:image/jpeg;base64,${imageData.toString("base64")}`;

  const particles = [
    { x: 950, y: 80, size: 4, opacity: 0.6 },
    { x: 1100, y: 150, size: 6, opacity: 0.4 },
    { x: 1050, y: 280, size: 3, opacity: 0.5 },
    { x: 900, y: 180, size: 5, opacity: 0.3 },
    { x: 1150, y: 350, size: 4, opacity: 0.5 },
    { x: 980, y: 420, size: 7, opacity: 0.25 },
    { x: 1080, y: 500, size: 5, opacity: 0.4 },
    { x: 850, y: 520, size: 3, opacity: 0.35 },
    { x: 1120, y: 580, size: 4, opacity: 0.3 },
    { x: 750, y: 100, size: 3, opacity: 0.2 },
    { x: 820, y: 350, size: 5, opacity: 0.25 },
    { x: 1000, y: 550, size: 6, opacity: 0.35 },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#09090b",
          padding: "80px",
          gap: "40px",
          fontFamily: "Geist",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {particles.map((p) => (
          <div
            key={`particle-${p.x}-${p.y}-${p.size}`}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: `rgba(255, 255, 255, ${p.opacity})`,
            }}
          />
        ))}
        <img
          src={imageBase64}
          alt="Richie"
          width={140}
          height={140}
          style={{
            borderRadius: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <h1
            style={{
              fontSize: "72px",
              fontWeight: 500,
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Richie McIlroy
          </h1>
          <p
            style={{
              fontSize: "36px",
              fontWeight: 400,
              color: "#a1a1aa",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Personal website and writings
          </p>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Geist",
          data: geistRegular,
          style: "normal",
          weight: 400,
        },
        {
          name: "Geist",
          data: geistMedium,
          style: "normal",
          weight: 500,
        },
      ],
    }
  );
}
