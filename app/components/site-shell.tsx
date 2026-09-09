"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Header } from "./header";
import { PageTransitionProvider } from "./page-transition";

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/wiki") return children;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Header />
      <PageTransitionProvider>{children}</PageTransitionProvider>
    </main>
  );
}
