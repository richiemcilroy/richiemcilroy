import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import Image from "next/image";

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
      <header className="space-y-6">
        <div>
          <Image
            src="/richie-beach.jpg"
            alt="Richie at the beach"
            width={500}
            height={500}
            className="w-28 h-28 rounded-full object-cover"
          />
        </div>
        <h1 className="text-xl font-medium text-zinc-900 dark:text-white">
          Hey, I'm Richie.
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          I'm the solo founder of
          <Link href="https://cap.so" target="_blank">
            <img
              src="/cap-logo.svg"
              alt="Cap"
              className="w-[65px] h-auto inline-block align-middle ml-2 mr-1.5 -mt-[3px]"
            />
          </Link>
          and I've been coding for over 10 years. I believe in empathy, both in
          code and in life. I believe in shipping fast and learning from real
          users. I love my fiancée, family, friends and our small French Bulldog
          Xara.
        </p>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          You can follow me on{" "}
          <a
            href="https://x.com/richiemcilroy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            X
          </a>
          , see my code on{" "}
          <a
            href="https://github.com/richiemcilroy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            GitHub
          </a>
          , or{" "}
          <a
            href="mailto:richie@cap.so"
            className="text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            email me
          </a>
          .
        </p>
      </header>

      {posts.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-500 dark:text-zinc-500">
            Writing
          </h2>
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/posts/${post.slug}`}
                  className="group block space-y-1"
                >
                  <h3 className="text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors underline decoration-dotted">
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
