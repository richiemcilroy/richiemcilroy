"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Variant = "ghost" | "dark";

interface BaseProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

interface ButtonAsButton
  extends BaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> {
  href?: never;
}

interface ButtonAsLink extends BaseProps {
  href: string;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variants: Record<Variant, string> = {
  ghost:
    "text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white",
  dark: "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700",
};

export function Button({
  children,
  className = "",
  variant = "ghost",
  ...props
}: ButtonProps) {
  const baseStyles = `text-xs px-2 py-1 rounded transition-colors ${variants[variant]} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={baseStyles}>
        {children}
      </Link>
    );
  }

  const { href, ...buttonProps } = props as ButtonAsButton;
  return (
    <button type="button" className={baseStyles} {...buttonProps}>
      {children}
    </button>
  );
}
