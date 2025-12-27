"use client";

import { usePathname } from "next/navigation";
import { Button } from "./button";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) return null;

  return (
    <header className="mb-12">
      <Button href="/" variant="dark" className="rounded-full">
        ← Back
      </Button>
    </header>
  );
}
