"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./button";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome)
    return (
      <nav
        aria-label="Main navigation"
        className="mb-8 flex justify-end text-sm"
      >
        <Link
          href="/wiki"
          className="text-zinc-500 underline decoration-dotted underline-offset-4 hover:text-zinc-900 dark:hover:text-white"
        >
          Wiki
        </Link>
      </nav>
    );

  return (
    <header className="mb-12">
      <Button href="/" variant="dark" className="rounded-full">
        ← Back
      </Button>
    </header>
  );
}
