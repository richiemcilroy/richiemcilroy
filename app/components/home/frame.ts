import type Lenis from "lenis";

// One requestAnimationFrame loop for the whole home page. Smooth scrolling
// advances first, then every scroll-linked scene reads the new position.
type Callback = (time: number) => void;

const callbacks = new Set<Callback>();
let frame = 0;
let lenis: Lenis | null = null;

function tick(time: number) {
  lenis?.raf(time);
  for (const callback of callbacks) callback(time);
  frame = callbacks.size > 0 || lenis ? requestAnimationFrame(tick) : 0;
}

export function onFrame(callback: Callback) {
  callbacks.add(callback);
  if (!frame) frame = requestAnimationFrame(tick);
  return () => {
    callbacks.delete(callback);
  };
}

export function setLenis(instance: Lenis | null) {
  lenis = instance;
  if (instance && !frame) frame = requestAnimationFrame(tick);
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

// Maps value from [start, end] onto [0, 1].
export const range = (value: number, start: number, end: number) =>
  clamp((value - start) / (end - start));

export const lerp = (from: number, to: number, t: number) =>
  from + (to - from) * t;

export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

export const easeOut = (t: number) => 1 - (1 - t) ** 4;

// Document-relative bounds, measured on resize rather than every frame.
export function measure(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return { top: rect.top + window.scrollY, height: rect.height };
}

export function timecode(seconds: number, fps = 24) {
  const total = Math.max(0, seconds);
  const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
  const h = total / 3600;
  const m = (total % 3600) / 60;
  const s = total % 60;
  const f = (total % 1) * fps;
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
}

// Last known mouse position in viewport coordinates. Touch input is ignored:
// the light effects that read it only make sense with a hovering pointer.
export const pointer = { x: 0, y: 0, seen: false };
let tracking = false;

export function trackPointer() {
  if (tracking) return;
  tracking = true;
  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "mouse") return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.seen = true;
    },
    { passive: true },
  );
}

// A soft light that trails the pointer.
export function createLight() {
  const light = { x: -1e4, y: -1e4, strength: 0 };
  return {
    light,
    follow(originX: number, originY: number, strength: number) {
      const x = pointer.x - originX;
      const y = pointer.y - originY;
      if (light.x < -1e3) {
        light.x = x;
        light.y = y;
      }
      light.x += (x - light.x) * 0.1;
      light.y += (y - light.y) * 0.1;
      const target = pointer.seen ? strength : 0;
      light.strength += (target - light.strength) * 0.05;
      return `${light.x.toFixed(1)},${light.y.toFixed(1)},${light.strength.toFixed(3)}`;
    },
  };
}

// Writes an inline style only when it changes. Scroll scenes compute their
// styles every frame; rewriting identical values would still make the
// browser recalculate styles each time.
const written = new WeakMap<HTMLElement, Map<string, string>>();

export function setStyle(
  element: HTMLElement | null | undefined,
  property: string,
  value: string,
) {
  if (!element) return;
  let cache = written.get(element);
  if (!cache) {
    cache = new Map();
    written.set(element, cache);
  }
  if (cache.get(property) === value) return;
  cache.set(property, value);
  element.style.setProperty(property, value);
}

// The film's current frame number. A video's currentTime advances on every
// animation frame, but the picture only changes 24 times a second, so
// scenes compare this instead to know whether they need to redraw.
export function filmFrame(video: HTMLVideoElement) {
  return Math.floor(video.currentTime * 24);
}
