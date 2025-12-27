import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function Home() {
  const posts = getAllPosts();

  return (
    <div className="space-y-16">
      <header className="space-y-4">
        <h1 className="text-lg font-medium text-zinc-900 dark:text-white">
          Hello, I'm Richie.
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
          This site is where I share thoughts and write about what I'm learning.
        </p>
        <nav className="flex gap-4 text-sm">
          <a
            href="https://x.com/riaborr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            X
          </a>
          <a
            href="https://github.com/richiemcilroy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            GitHub
          </a>
          <a
            href="mailto:richie@cap.so"
            className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Email
          </a>
        </nav>
      </header>

      {posts.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">
            Writing
          </h2>
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/posts/${post.slug}`}
                  className="group block space-y-1"
                >
                  <h3 className="text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-500">
                    {post.readTime} · {formatDate(post.date)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
