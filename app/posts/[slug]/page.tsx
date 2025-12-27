import { notFound } from "next/navigation";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { getPostBySlug, getAllPostSlugs } from "@/lib/posts";

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
  return <div className={`grid grid-cols-1 ${gridCols} gap-4 not-prose my-8`}>{children}</div>;
}

function Img({ src, alt }: { src: string; alt?: string }) {
  return (
    <div className="relative aspect-[4/3] max-h-[350px] sm:max-h-none overflow-hidden rounded-lg">
      <Image
        src={src}
        alt={alt || ""}
        fill
        className="object-cover"
      />
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

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.title} - Richie McIlroy`,
    description: post.description,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-xl font-medium text-zinc-900 dark:text-white">
          {post.title}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          {formatDate(post.date)} · {post.readTime}
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
          }}
        />
      </div>
    </article>
  );
}
