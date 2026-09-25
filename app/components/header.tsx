"use client";

import { Button } from "./button";

export function Header() {
  return (
    <header className="mb-12">
      <Button href="/" variant="dark" className="rounded-full">
        ← Back
      </Button>
    </header>
  );
}
