"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { toggleFilm, useFilmPaused } from "./film";
import { onFrame, setStyle } from "./frame";

const sections = [
  { label: "About", href: "#about" },
  { label: "Chapters", href: "#chapters" },
  { label: "Writing", href: "#writing" },
  { label: "Contact", href: "#contact" },
];

// Navigation dressed as a recording in progress: the timer counts how long
// you've been here, and the bar underneath is how far through you are.
export function RecorderBar() {
  const bar = useRef<HTMLDivElement>(null);
  const elapsed = useRef<HTMLSpanElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const paused = useFilmPaused();

  useEffect(() => {
    const start = performance.now();
    let lastText = "";
    let lastShown: boolean | null = null;
    // Reading the page height every frame would force layout, so it's
    // measured only when the page changes size.
    let max = 0;
    const measure = () => {
      max = document.documentElement.scrollHeight - window.innerHeight;
    };
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener("resize", measure);
    measure();

    const stop = onFrame((now) => {
      const seconds = Math.floor((now - start) / 1000);
      const text = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
      if (text !== lastText && elapsed.current) {
        elapsed.current.textContent = text;
        lastText = text;
      }
      const t = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      setStyle(progress.current, "transform", `scaleX(${t.toFixed(4)})`);

      const shown = document.documentElement.dataset.introDone === "true";
      if (shown !== lastShown && bar.current) {
        bar.current.dataset.shown = String(shown);
        lastShown = shown;
      }
    });
    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      ref={bar}
      data-shown="false"
      className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 transition-[opacity,translate] delay-500 duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)] data-[shown=false]:pointer-events-none data-[shown=false]:translate-y-6 data-[shown=false]:opacity-0 has-[:focus-visible]:translate-y-0 has-[:focus-visible]:opacity-100 sm:bottom-6"
    >
      <nav
        aria-label="Main navigation"
        className="relative flex items-center gap-1 overflow-hidden rounded-full bg-zinc-950/75 p-1.5 text-[13px] text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-xl"
      >
        <button
          type="button"
          onClick={toggleFilm}
          aria-label={paused ? "Play background film" : "Pause background film"}
          aria-pressed={paused}
          className="flex items-center gap-2.5 rounded-full py-2 pr-3 pl-3 transition-colors hover:bg-white/10"
        >
          <span className="relative flex size-2">
            {!paused && (
              <span className="absolute inset-0 animate-ping rounded-full bg-white/70" />
            )}
            <span
              className={`relative size-2 rounded-full transition-colors ${paused ? "bg-zinc-500" : "bg-white"}`}
            />
          </span>
          <span
            ref={elapsed}
            className="w-8 text-left font-mono text-xs tabular-nums"
          >
            0:00
          </span>
        </button>
        <span className="h-4 w-px bg-white/15" />
        <ul className="hidden items-center sm:flex">
          {sections.map((section) => (
            <li key={section.href}>
              <a
                href={section.href}
                className="block rounded-full px-3 py-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#writing"
          className="block rounded-full px-3 py-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white sm:hidden"
        >
          Writing
        </a>
        <Link
          href="/wiki"
          className="block rounded-full bg-white px-3.5 py-2 text-zinc-950 transition-colors hover:bg-zinc-200"
        >
          Wiki
        </Link>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 bottom-0 h-px overflow-hidden"
        >
          <span
            ref={progress}
            className="block h-full w-full origin-left scale-x-0 bg-white/50"
          />
        </span>
      </nav>
    </div>
  );
}
