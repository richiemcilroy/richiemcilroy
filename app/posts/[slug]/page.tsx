import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { getPostBySlug, getAllPostSlugs } from "@/lib/posts";

const rehypeOptions = {
  theme: "github-dark-default",
  keepBackground: false,
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
      <header className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </Link>
        <div className="space-y-2">
          <h1 className="text-xl font-medium text-zinc-900 dark:text-white">
            {post.title}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            {formatDate(post.date)} · {post.readTime}
          </p>
        </div>
      </header>

      <div className="prose">
        <MDXRemote
          source={post.content}
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
