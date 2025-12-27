import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getPostBySlug, getAllPostSlugs } from "@/lib/posts";

export const runtime = "nodejs";
export const alt = "Blog post";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return new Response("Not found", { status: 404 });
  }

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
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          backgroundColor: "#09090b",
          padding: "80px",
          fontFamily: "Geist",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {particles.map((p, i) => (
          <div
            key={i}
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            maxWidth: "900px",
          }}
        >
          <h1
            style={{
              fontSize: "64px",
              fontWeight: 500,
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {post.title}
          </h1>
          {post.description && (
            <p
              style={{
                fontSize: "32px",
                fontWeight: 400,
                color: "#a1a1aa",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {post.description}
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <img
            src={imageBase64}
            alt="Richie"
            width={88}
            height={88}
            style={{
              borderRadius: "100%",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontSize: "32px",
                fontWeight: 500,
                color: "#ffffff",
              }}
            >
              Richie McIlroy
            </span>
            <span
              style={{
                fontSize: "26px",
                fontWeight: 400,
                color: "#71717a",
              }}
            >
              {post.readTime}
            </span>
          </div>
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
