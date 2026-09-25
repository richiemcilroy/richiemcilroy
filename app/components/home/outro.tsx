"use client";

import { useEffect, useRef, useState } from "react";
import { lines as glyphLines } from "@/lib/glyphs";
import { useFilm } from "./film";
import {
  createLight,
  easeOut,
  filmFrame,
  measure,
  onFrame,
  pointer,
  prefersReducedMotion,
  range,
  setStyle,
  trackPointer,
} from "./frame";
import {
  drawKnockout,
  type PlacedLine,
  placeLines,
  placeRow,
  sizeCanvas,
  type View,
} from "./knockout";
import type { PlaygroundScene } from "./three/playground-scene";

const WORDS = [glyphLines.SAY, glyphLines.HELLO];

export function Outro() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const gl = useRef<HTMLCanvasElement>(null);
  const flatCanvas = useRef<HTMLCanvasElement>(null);
  const reset = useRef<(() => void) | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [mode, setMode] = useState<"loading" | "toy" | "flat">("loading");
  const [grabbing, setGrabbing] = useState<"none" | "hover" | "held">("none");

  useFilm(video);

  // Local time in Liverpool, rendered after mount to keep hydration stable.
  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      minute: "2-digit",
    });
    const update = () => setTime(format.format(new Date()));
    update();
    const interval = window.setInterval(update, 10_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const sectionEl = section.current;
    const stageEl = stage.current;
    const videoEl = video.current;
    const glEl = gl.current;
    const flatEl = flatCanvas.current;
    const ctx = flatEl?.getContext("2d");
    if (!sectionEl || !stageEl || !videoEl || !glEl || !flatEl || !ctx) return;
    const reduced = prefersReducedMotion();
    trackPointer();
    const { light, follow } = createLight();

    let bounds = measure(sectionEl);
    let view: View = { width: 0, height: 0, dpr: 1 };
    let placed: PlacedLine[] = [];
    let lastKey = "";
    let scene: PlaygroundScene | null = null;
    let flat = false;
    let cancelled = false;
    let visible = false;
    let lastFilm = -1;
    let lastPointer = "";
    let moving = false;

    const layout = () => {
      bounds = measure(sectionEl);
      view = flat
        ? sizeCanvas(flatEl)
        : {
            width: stageEl.clientWidth,
            height: stageEl.clientHeight,
            dpr: Math.min(window.devicePixelRatio || 1, 2),
          };
      const pad = Math.max(16, view.width * 0.025);
      const box = {
        x: pad,
        y: pad * 3,
        width: view.width - pad * 2,
        height: view.height - pad * 4,
      };
      // Wide screens stand the words side by side on the floor, which the
      // physics can keep upright; tall ones stack them.
      placed =
        !flat && view.width > view.height
          ? placeRow(WORDS, box)
          : placeLines(WORDS, box, 0.06);
      scene?.layout(view.width, view.height, placed);
      lastKey = "";
      lastFilm = -1;
    };
    const observer = new ResizeObserver(layout);
    observer.observe(stageEl);
    observer.observe(document.body);
    layout();

    // The physics engine only loads as the footer comes close.
    const start = () =>
      import("./three/playground-scene")
        .then(({ PlaygroundScene }) => {
          if (cancelled) return;
          scene = new PlaygroundScene(glEl, videoEl, placed);
          scene.layout(view.width, view.height, placed);
          reset.current = () => scene?.drop(performance.now());
          if (visible) scene.drop(performance.now(), reduced);
          setMode("toy");
        })
        .catch(() => {
          if (cancelled) return;
          flat = true;
          setMode("flat");
          layout();
        });
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        start();
      },
      { rootMargin: "150% 0px" },
    );
    near.observe(stageEl);

    // The letters fall in the first time the footer comes into view.
    const seen = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && scene && !scene.dropped) {
          scene.drop(performance.now(), reduced);
        }
      },
      { threshold: 0.35 },
    );
    seen.observe(stageEl);

    // Mouse: pick letters up and throw them. Touch: flick them, so the
    // footer can still be scrolled past.
    const local = (event: PointerEvent) => {
      const rect = glEl.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const down = (event: PointerEvent) => {
      if (!scene) return;
      const { x, y } = local(event);
      if (event.pointerType === "mouse") {
        if (scene.grab(x, y)) {
          glEl.setPointerCapture(event.pointerId);
          setGrabbing("held");
        }
      } else {
        scene.flick(x, y);
      }
    };
    const move = (event: PointerEvent) => {
      if (!scene || event.pointerType !== "mouse") return;
      const { x, y } = local(event);
      scene.move(x, y);
      const over = scene.hovering(x, y);
      setGrabbing((state) =>
        state === "held" ? state : over ? "hover" : "none",
      );
    };
    const up = (event: PointerEvent) => {
      scene?.release();
      if (glEl.hasPointerCapture(event.pointerId)) {
        glEl.releasePointerCapture(event.pointerId);
      }
      setGrabbing("none");
    };
    glEl.addEventListener("pointerdown", down);
    glEl.addEventListener("pointermove", move);
    glEl.addEventListener("pointerup", up);
    glEl.addEventListener("pointercancel", up);

    const stop = onFrame((now) => {
      if (scene) {
        if (!visible) return;
        // Redraw for new film frames, the pointer, or letters in motion.
        const film = filmFrame(videoEl);
        const pointerKey = `${pointer.x}|${pointer.y}`;
        if (
          film === lastFilm &&
          pointerKey === lastPointer &&
          !moving &&
          !scene.awake
        ) {
          return;
        }
        lastFilm = film;
        lastPointer = pointerKey;
        const rect = glEl.getBoundingClientRect();
        moving = scene.render(now, {
          x: pointer.x - rect.left,
          y: pointer.y - rect.top,
          active: pointer.seen,
        });
        return;
      }
      if (!flat) return;

      // Without WebGL: the letters cut out of black, rising into place.
      const vh = window.innerHeight;
      const t = reduced
        ? 1
        : range(
            window.scrollY + vh,
            bounds.top + vh * 0.15,
            bounds.top + vh * 0.85,
          );
      if (t <= 0 && lastKey) return;
      const rect = flatEl.getBoundingClientRect();
      const inside =
        pointer.y >= rect.top &&
        pointer.y <= rect.bottom &&
        pointer.x >= rect.left &&
        pointer.x <= rect.right;
      const lightKey = follow(rect.left, rect.top, inside ? 0.45 : 0);
      const key = `${t.toFixed(4)}|${view.width}|${view.height}|${lightKey}`;
      if (key === lastKey) return;
      lastKey = key;
      drawKnockout(ctx, view, placed, {
        light: { ...light, radius: Math.max(view.width, view.height) * 0.25 },
        rise: (line, glyph) => {
          const order = line * WORDS[0].glyphs.length + glyph;
          return easeOut(range(t, order * 0.05, order * 0.05 + 0.5));
        },
      });
      setStyle(flatEl, "background-color", "transparent");
    });

    return () => {
      cancelled = true;
      stop();
      observer.disconnect();
      seen.disconnect();
      near.disconnect();
      glEl.removeEventListener("pointerdown", down);
      glEl.removeEventListener("pointermove", move);
      glEl.removeEventListener("pointerup", up);
      glEl.removeEventListener("pointercancel", up);
      scene?.dispose();
      reset.current = null;
    };
  }, []);

  return (
    <footer
      ref={section}
      id="contact"
      className="relative flex min-h-svh flex-col bg-black text-white"
    >
      <h2 className="sr-only">Say hello</h2>
      <div ref={stage} className="relative flex-1 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0">
          <video
            ref={video}
            className="absolute inset-0 size-full object-cover grayscale"
            poster="/film/poster.jpg"
            muted
            loop
            playsInline
            preload="none"
            disablePictureInPicture
          >
            <source
              src="/film/reel-720-av1.mp4"
              type='video/mp4; codecs="av01.0.08M.08"'
              media="(max-width: 767px)"
            />
            <source
              src="/film/reel-720.mp4"
              type="video/mp4"
              media="(max-width: 767px)"
            />
            <source
              src="/film/reel-1080-av1.mp4"
              type='video/mp4; codecs="av01.0.08M.08"'
            />
            <source src="/film/reel-1080.mp4" type="video/mp4" />
          </video>
        </div>
        <div aria-hidden="true" className="absolute inset-0">
          <canvas
            ref={gl}
            data-knockout
            className={`absolute inset-0 size-full touch-pan-y bg-black ${
              mode === "flat" ? "hidden" : ""
            } ${
              grabbing === "held"
                ? "cursor-grabbing"
                : grabbing === "hover"
                  ? "cursor-grab"
                  : ""
            }`}
          />
          <canvas
            ref={flatCanvas}
            data-knockout
            className={`absolute inset-0 size-full bg-black ${
              mode === "flat" ? "" : "hidden"
            }`}
          />
        </div>
        {mode === "toy" && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-4 px-5 pt-6 text-sm sm:px-10">
            <p className="text-zinc-500">
              <span className="hidden sm:inline">
                Go on, pick one up and throw it.
              </span>
              <span className="sm:hidden">Tap a letter.</span>
            </p>
            <button
              type="button"
              onClick={() => reset.current?.()}
              className="pointer-events-auto text-zinc-500 underline decoration-zinc-700 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
            >
              Drop them again
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-3 px-5 pt-8 pb-28 text-sm sm:grid-cols-3 sm:px-10">
        <p className="text-white">Thanks for watching.</p>
        <p className="text-zinc-500 sm:text-center">
          It's{" "}
          <span className="tabular-nums text-zinc-300" suppressHydrationWarning>
            {time ?? "--:--"}
          </span>{" "}
          in Liverpool
        </p>
        <a
          href="mailto:richie@cap.so"
          className="text-zinc-500 underline decoration-zinc-700 underline-offset-4 transition-colors hover:text-white hover:decoration-white sm:text-right"
        >
          Say hello: richie@cap.so
        </a>
        <p className="text-xs text-zinc-600 sm:col-span-3">
          MacBook Pro model by{" "}
          <a
            href="https://sketchfab.com/3d-models/macbook-pro-m3-16-inch-2024-8e34fc2b303144f78490007d91ff57c4"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-zinc-800 underline-offset-2 hover:text-zinc-400"
          >
            jackbaeten
          </a>
          ,{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-zinc-800 underline-offset-2 hover:text-zinc-400"
          >
            CC BY 4.0
          </a>
          , recoloured and relabelled.
        </p>
      </div>
    </footer>
  );
}
