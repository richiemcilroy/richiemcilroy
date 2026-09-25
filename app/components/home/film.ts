"use client";

import { type RefObject, useEffect, useSyncExternalStore } from "react";

// Shared play state for every copy of the film on the page, so one control
// pauses them all. Visitors who prefer reduced motion start paused.
let paused: boolean | null = null;
const listeners = new Set<() => void>();

function isPaused() {
  if (paused === null) {
    paused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return paused;
}

export function toggleFilm() {
  paused = !isPaused();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFilmPaused() {
  return useSyncExternalStore(subscribe, isPaused, () => false);
}

// Plays the video only while it is on screen and the visitor has not paused.
export function useFilm(video: RefObject<HTMLVideoElement | null>) {
  const filmPaused = useFilmPaused();

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let visible = false;

    const sync = () => {
      if (visible && !filmPaused) {
        if (element.preload !== "auto") element.preload = "auto";
        element.play().catch(() => {});
      } else {
        element.pause();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { rootMargin: "25% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [video, filmPaused]);
}
