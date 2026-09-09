import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { StructuredData } from "@/app/components/structured-data";
import { getAllPostSlugs, getPostBySlug } from "@/lib/posts";
import { absoluteUrl, author, siteName } from "@/lib/site";
import { Share } from "./share";

const rehypeOptions = {
  theme: "github-dark-default",
  keepBackground: false,
};

function ImageGrid({
  children,
  cols = 2,
}: {
  children: React.ReactNode;
  cols?: number;
}) {
  const gridCols =
    cols === 3 ? "sm:grid-cols-3" : cols === 2 ? "sm:grid-cols-2" : "";
  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-4 not-prose my-8`}>
      {children}
    </div>
  );
}

function Img({ src, alt }: { src: string; alt?: string }) {
  return (
    <div className="relative aspect-[4/4] max-h-[450px] overflow-hidden rounded-lg">
      <Image src={src} alt={alt || ""} fill className="object-cover" />
    </div>
  );
}

const mdxComponents = {
  ImageGrid,
  Img,
};

interface Props {
  params: Promise<{ slug: string }>;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return {
    title: `${post.title} - Richie McIlroy`,
    description: post.description,
    alternates: { canonical: `/posts/${slug}` },
    authors: [{ name: siteName, url: absoluteUrl("/wiki") }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `/posts/${slug}`,
      siteName,
      locale: "en_GB",
      publishedTime: post.date || undefined,
      modifiedTime: post.updated,
      authors: [absoluteUrl("/wiki")],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@richiemcilroy",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const url = absoluteUrl(`/posts/${slug}`);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    url,
    headline: post.title,
    description: post.description,
    datePublished: post.date || undefined,
    dateModified: post.updated,
    inLanguage: "en-GB",
    image: absoluteUrl(`/posts/${slug}/opengraph-image`),
    author,
    publisher: author,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: { "@type": "WebSite", "@id": absoluteUrl("/#website") },
  };

  return (
    <article className="space-y-8">
      <StructuredData id="article-schema" data={structuredData} />
      <header className="space-y-2">
        <h1 className="text-xl font-medium text-zinc-900 dark:text-white">
          {post.title}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          By{" "}
          <Link
            href="/wiki"
            rel="author"
            className="underline decoration-dotted underline-offset-4"
          >
            Richie McIlroy
          </Link>{" "}
          · <time dateTime={post.date}>{formatDate(post.date)}</time> ·{" "}
          {post.readTime}
          {post.updated && (
            <>
              {" "}
              · Updated{" "}
              <time dateTime={post.updated}>{formatDate(post.updated)}</time>
            </>
          )}
        </p>
      </header>

      <div className="prose">
        <MDXRemote
          source={post.content}
          components={mdxComponents}
          options={{
            mdxOptions: {
              rehypePlugins: [[rehypePrettyCode, rehypeOptions]],
            },
            blockJS: false,
          }}
        />
      </div>

      <Share title={post.title} slug={slug} />
    </article>
  );
}
