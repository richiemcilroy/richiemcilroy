"use client";

import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
