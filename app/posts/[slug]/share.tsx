"use client";

import { useState } from "react";

interface ShareProps {
  title: string;
  slug: string;
}

export function Share({ title, slug }: ShareProps) {
  const [copied, setCopied] = useState(false);

  const url = `https://richiemcilroy.com/posts/${slug}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title} by @richiemcilroy`)}&url=${encodeURIComponent(url)}`;

  return (
    <div className="flex items-center gap-4 pt-8 border-t border-zinc-200 dark:border-zinc-800">
      <span className="text-sm text-zinc-500 dark:text-zinc-500">Share</span>
      <button
        onClick={copyLink}
        className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        X
      </a>
    </div>
  );
}
