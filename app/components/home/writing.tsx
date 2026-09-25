import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export function Writing({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) return null;

  return (
    <section
      id="writing"
      aria-labelledby="writing-label"
      className="mx-auto max-w-6xl space-y-10 px-5 py-32 sm:px-10 sm:py-48"
    >
      <h2
        id="writing-label"
        className="text-lg text-zinc-500 dark:text-zinc-500"
      >
        Writing
      </h2>
      <ul className="writing-list border-t border-zinc-200 dark:border-zinc-800">
        {posts.map((post) => (
          <li
            key={post.slug}
            className="border-b border-zinc-200 dark:border-zinc-800"
          >
            <Link
              href={`/posts/${post.slug}`}
              className="group grid items-baseline gap-x-8 gap-y-3 py-8 transition-opacity duration-500 sm:grid-cols-[1fr_auto] sm:py-10"
            >
              <span className="space-y-3">
                <span className="flex items-center gap-4 font-display text-[clamp(2rem,5.5vw,4.5rem)] leading-[0.95] font-semibold tracking-[-0.035em] text-zinc-900 transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:translate-x-3 dark:text-white">
                  {post.title}
                  <span
                    aria-hidden="true"
                    className="inline-block -translate-x-3 text-[0.6em] opacity-0 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:translate-x-0 group-hover:opacity-100"
                  >
                    →
                  </span>
                </span>
                {post.description && (
                  <span className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr]">
                    <span className="block max-w-xl overflow-hidden text-base text-zinc-500 transition-transform duration-700 group-hover:translate-x-3">
                      {post.description}
                    </span>
                  </span>
                )}
              </span>
              <span className="text-sm text-zinc-500">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span className="mx-2 text-zinc-300 dark:text-zinc-700">·</span>
                {post.readTime}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
