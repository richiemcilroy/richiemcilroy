"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { lines as glyphLines } from "@/lib/glyphs";
import { useFilm } from "./film";
import {
  createLight,
  easeInOut,
  easeOut,
  filmFrame,
  lerp,
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
  drawThroughGlyph,
  type Frame,
  glyphOnScreen,
  type PlacedLine,
  placeLines,
  sizeCanvas,
  type View,
} from "./knockout";
import type { HeroScene } from "./three/hero-scene";
import type { LaptopScene } from "./three/laptop-scene";

const NAME = [glyphLines.RICHIE, glyphLines.MCILROY];
// The capital I in McIlroy is a plain rectangle: the one letter in colour,
// and the door into the film.
const PORTAL = { line: 1, glyph: 2 };

// Scroll choreography, as fractions of the pinned distance.
const ZOOM = [0.016, 0.3] as const;
const STATEMENT_IN = [
  [0.314, 0.369],
  [0.369, 0.424],
  [0.424, 0.479],
] as const;
const SHRINK = [0.55, 0.7] as const;
// The film is on a laptop all along: the camera pulls back to show it,
// swings round, and the lid shuts.
const ORBIT = [0.72, 0.88] as const;
const CLOSE = [0.9, 1] as const;

const STATEMENT = ["Open the app.", "Hit record.", "Share the link."];

const INTRO_KEY = "rm:intro";

function introSeen() {
  try {
    return sessionStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberIntro() {
  try {
    sessionStorage.setItem(INTRO_KEY, "1");
  } catch {}
}

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const gl = useRef<HTMLCanvasElement>(null);
  const laptopCanvas = useRef<HTMLCanvasElement>(null);
  const mask = useRef<HTMLCanvasElement>(null);
  const portal = useRef<HTMLCanvasElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const statement = useRef<HTMLDivElement>(null);
  const statementLines = useRef<(HTMLSpanElement | null)[]>([]);
  const logo = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const recorder = useRef<HTMLDivElement>(null);
  const recorderTime = useRef<HTMLSpanElement>(null);

  useFilm(video);

  useEffect(() => {
    const sectionEl = section.current;
    const screenEl = screen.current;
    const videoEl = video.current;
    const maskEl = mask.current;
    const portalEl = portal.current;
    const maskCtx = maskEl?.getContext("2d");
    const portalCtx = portalEl?.getContext("2d");
    const glEl = gl.current;
    const laptopEl = laptopCanvas.current;
    if (
      !glEl ||
      !laptopEl ||
      !sectionEl ||
      !screenEl ||
      !videoEl ||
      !maskEl ||
      !portalEl ||
      !maskCtx ||
      !portalCtx
    )
      return;

    videoEl.muted = true;
    trackPointer();
    const reduced = prefersReducedMotion();
    const quick = introSeen() || reduced;
    let readyAt: number | null = null;
    const { light, follow } = createLight();

    let bounds = measure(sectionEl);
    let view: View = { width: 0, height: 0, dpr: 1 };
    let rotate = false;
    let placed: PlacedLine[] = [];
    let door = { x: 0, y: 0, width: 1, height: 1 };
    let maxZoom = 1;
    let target = { scale: 1, inset: 0, offset: 0, radius: 0 };
    let lastKey = "";
    let lastRecorder = "";
    let lastFilm = -1;
    let lastDrawKey = "";
    let heroSettling = false;
    let laptopSettling = false;

    // The 3D name loads while the h1 types. If WebGL is unavailable the page
    // falls back to cutting the letters out of a 2D canvas.
    let scene: HeroScene | null = null;
    let laptop: LaptopScene | null = null;
    let windowRect = { width: 1, height: 1, centerY: 0, radius: 20 };
    let flat = false;
    let sceneSettled = false;
    let filmSettled = false;
    let cancelled = false;
    import("./three/hero-scene")
      .then(({ HeroScene }) => {
        if (cancelled) return;
        scene = new HeroScene(glEl, videoEl, placed, PORTAL);
        scene.layout(view.width, view.height, placed, rotate);
      })
      .catch(() => {
        flat = true;
      })
      .finally(() => {
        if (cancelled) return;
        if (!flat) {
          import("./three/laptop-scene")
            .then(({ LaptopScene }) => {
              if (cancelled) return;
              laptop = new LaptopScene(laptopEl, videoEl);
              laptop.layout(view.width, view.height, windowRect);
            })
            .catch(() => {});
        }
        glEl.style.display = flat ? "none" : "block";
        maskEl.style.display = flat ? "block" : "none";
        portalEl.style.display = flat ? "block" : "none";
        if (flat) layout();
        sceneSettled = true;
        tryReady();
      });

    const layout = () => {
      bounds = measure(sectionEl);
      view = {
        width: screenEl.clientWidth,
        height: screenEl.clientHeight,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      };
      if (flat) {
        view = sizeCanvas(maskEl);
        sizeCanvas(portalEl);
      }
      const { width, height } = view;

      // Tall screens set the name sideways, reading upwards, to fill them.
      rotate = height > width * 1.2;
      const along = rotate ? height : width;
      const across = rotate ? width : height;
      const padAlong = rotate
        ? Math.max(96, height * 0.12)
        : Math.max(16, width * 0.025);
      const padAcross = rotate ? 16 : Math.max(72, height * 0.12);
      placed = placeLines(NAME, {
        x: padAlong,
        y: padAcross,
        width: along - padAlong * 2,
        height: across - padAcross * 2,
      });
      door = glyphOnScreen(placed[PORTAL.line], PORTAL.glyph, view, rotate);
      // Enough zoom for the stem of the I to swallow the whole screen.
      maxZoom = Math.max(
        (width * 1.3) / door.width,
        (height * 1.3) / door.height,
      );

      // Where the film settles once it shrinks back into a window.
      const portrait = width < height;
      // The laptop body is wider than its display, so leave room for it.
      const pad = width < 640 ? 30 : 48;
      let w = portrait
        ? width - pad * 2
        : Math.min(width - pad * 2, width * 0.64);
      // The shape of a 16-inch MacBook Pro display (3456 × 2234), since
      // that's what the window turns out to be.
      let h = w / (3456 / 2234);
      if (h > height * 0.62) {
        h = height * 0.62;
        w = h * (3456 / 2234);
      }
      const scale = w / width;
      const offset = -height * 0.045;
      target = {
        scale,
        inset: (height - h / scale) / 2,
        offset,
        radius: 20 / scale,
      };

      const bottom = height / 2 + offset + h / 2;
      windowRect = {
        width: w,
        height: h,
        centerY: height / 2 + offset,
        radius: 20,
      };
      laptop?.layout(width, height, windowRect);

      if (recorder.current) {
        recorder.current.style.top = `${bottom - 60}px`;
      }
      scene?.layout(width, height, placed, rotate);
      lastKey = "";
    };

    const filmReady = () => {
      filmSettled = true;
      tryReady();
    };
    const tryReady = () => {
      if (readyAt !== null || !filmSettled || !sceneSettled) return;
      readyAt = performance.now();
      document.documentElement.dataset.introDone = "true";
      rememberIntro();
    };

    // The film opens with a fade from black; start on the poster frame so a
    // paused film (reduced motion) still shows a picture inside the letters.
    const skipBlack = () => {
      if (videoEl.currentTime < 0.9) videoEl.currentTime = 0.9;
    };
    if (videoEl.readyState >= 1) skipBlack();
    videoEl.addEventListener("loadedmetadata", skipBlack);
    if (videoEl.readyState >= 3) filmReady();
    videoEl.addEventListener("canplay", filmReady);
    // Never hold the page hostage to a slow connection.
    const fallback = window.setTimeout(filmReady, quick ? 300 : 1500);

    const stagger = quick ? 25 : 80;
    const duration = quick ? 700 : 1400;
    const rise = (line: number, glyph: number, now: number) => {
      if (readyAt === null) return 0;
      const order = line === 0 ? glyph : NAME[0].glyphs.length + glyph;
      return easeOut(range(now - readyAt - order * stagger, 0, duration));
    };
    const introLength =
      (NAME[0].glyphs.length + NAME[1].glyphs.length) * stagger + duration;

    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(sectionEl);
    resizeObserver.observe(document.body);
    layout();

    const stop = onFrame((now) => {
      const p = range(
        window.scrollY - bounds.top,
        0,
        bounds.height - view.height,
      );

      // The name, cut out of black, then the zoom through the I.
      const zoomT = reduced ? 0 : easeInOut(range(p, ...ZOOM));
      const fade = reduced
        ? 1 - range(p, ...ZOOM)
        : 1 - range(p, ZOOM[1] - 0.02, ZOOM[1]);
      const frame: Frame = {
        rotate,
        rise: (line, glyph) => rise(line, glyph, now),
        zoom: {
          scale: maxZoom ** zoomT,
          from: door,
          to: {
            x: lerp(door.x, view.width / 2, zoomT),
            y: lerp(door.y, view.height / 2, zoomT),
          },
        },
      };

      const open = fade > 0;

      // Draw only when something changed: a new film frame, the scroll or
      // pointer, or motion that is still settling. The film runs at 24fps,
      // so this skips well over half the frames even while it plays.
      const film = filmFrame(videoEl);
      const drawKey = `${p}|${pointer.x}|${pointer.y}|${view.width}|${view.height}`;
      // Once the hero has scrolled away entirely there is nothing to draw.
      const inView = window.scrollY < bounds.top + bounds.height;
      const changed = inView && (film !== lastFilm || drawKey !== lastDrawKey);
      lastFilm = film;
      lastDrawKey = drawKey;
      const intro = readyAt === null || now < readyAt + introLength;

      if (scene) {
        setStyle(glEl, "visibility", open ? "visible" : "hidden");
        setStyle(glEl, "opacity", reduced ? String(fade) : "1");
        if (open && inView && (changed || intro || heroSettling)) {
          heroSettling = scene.render({
            now,
            zoom: zoomT,
            rise: (line, glyph) => rise(line, glyph, now),
            pointer: { x: pointer.x, y: pointer.y, active: pointer.seen },
            reduced,
          });
        }
      } else if (flat) {
        const lightKey = follow(0, 0, 0.62 * (1 - range(p, 0, 0.06)));
        const key = `${p.toFixed(5)}|${view.width}|${view.height}|${lightKey}`;
        if (open && (intro || key !== lastKey)) {
          lastKey = key;
          drawKnockout(maskCtx, view, placed, {
            ...frame,
            opacity: fade,
            light: {
              ...light,
              radius: Math.max(view.width, view.height) * 0.26,
            },
          });
          setStyle(maskEl, "background-color", "transparent");
        }
        setStyle(maskEl, "visibility", open ? "visible" : "hidden");

        // The colour film plays inside the I every frame.
        if (open && readyAt !== null) {
          drawThroughGlyph(portalCtx, view, placed, PORTAL, videoEl, frame);
          setStyle(portalEl, "opacity", String(reduced ? fade : 1));
          setStyle(
            portalEl,
            "filter",
            `saturate(${lerp(1.4, 1, range(zoomT, 0.4, 0.95))})`,
          );
        }
        setStyle(portalEl, "visibility", open ? "visible" : "hidden");
      }

      // Once the I fills the screen the film itself can be in colour.
      setStyle(
        videoEl,
        "filter",
        open ? "grayscale(1) contrast(1.12)" : "none",
      );

      // Statement, one line per beat, gone before the camera pulls back.
      const out = range(p, SHRINK[0] - 0.06, SHRINK[0]);
      STATEMENT_IN.forEach(([from, to], i) => {
        const line = statementLines.current[i];
        if (!line) return;
        const t = easeOut(range(p, from, to));
        setStyle(
          line,
          "transform",
          reduced ? "" : `translate3d(0, ${(1 - t) * 105}%, 0)`,
        );
        setStyle(line, "opacity", reduced ? String(t) : "1");
      });
      if (logo.current) {
        setStyle(logo.current, "opacity", String(range(p, ...STATEMENT_IN[0])));
      }
      if (statement.current) {
        setStyle(statement.current, "opacity", String(1 - out));
        setStyle(
          statement.current,
          "transform",
          `translate3d(0, ${-out * 48}px, 0)`,
        );
      }
      if (scrim.current) {
        setStyle(
          scrim.current,
          "opacity",
          String(
            range(p, STATEMENT_IN[0][0] - 0.03, STATEMENT_IN[0][0]) * (1 - out),
          ),
        );
      }

      // Back out into a window: the film as a Cap recording.
      const s = easeInOut(range(p, ...SHRINK));
      setStyle(
        screenEl,
        "transform",
        `translate3d(0, ${target.offset * s}px, 0) scale(${lerp(1, target.scale, s)})`,
      );
      setStyle(
        screenEl,
        "clip-path",
        s > 0
          ? `inset(${target.inset * s}px 0 round ${target.radius * s}px)`
          : "",
      );

      // The laptop takes over from the window, then turns and closes.
      if (p > 0.1) laptop?.load();
      // From the moment the film starts to shrink it is the laptop's
      // display, filling the screen exactly as the video did.
      const onLaptop = laptop?.ready === true && p >= SHRINK[0];
      setStyle(laptopEl, "opacity", onLaptop ? "1" : "0");
      setStyle(laptopEl, "visibility", onLaptop ? "visible" : "hidden");
      // On wide screens the display covers the viewport, so the flat film
      // can go at once. On tall ones it only spans the width, so the flat
      // film fades out around the laptop instead.
      const flatFilm = !onLaptop
        ? 1
        : view.width < view.height
          ? 1 - range(p, SHRINK[0], SHRINK[0] + 0.05)
          : 0;
      setStyle(screenEl, "opacity", String(flatFilm));
      setStyle(screenEl, "visibility", flatFilm > 0 ? "visible" : "hidden");
      if (laptop && onLaptop && inView && (changed || laptopSettling)) {
        laptopSettling = laptop.render({
          reveal: reduced ? 1 : easeInOut(range(p, ...SHRINK)),
          orbit: reduced ? 0 : easeInOut(range(p, ...ORBIT)),
          close: reduced ? 0 : easeInOut(range(p, ...CLOSE)),
          pointer: { x: pointer.x, y: pointer.y, active: pointer.seen },
        });
      }
      const leaving = range(p, ORBIT[0], ORBIT[0] + 0.04);

      const settled =
        range(p, ORBIT[0] + 0.02, ORBIT[0] + 0.08) *
        (1 - range(p, CLOSE[0], CLOSE[0] + 0.03));
      if (caption.current) {
        setStyle(caption.current, "opacity", String(settled));
        setStyle(
          caption.current,
          "transform",
          `translate3d(0, ${(1 - settled) * 16}px, 0)`,
        );
      }
      if (recorder.current) {
        const shown = range(p, SHRINK[1] - 0.08, SHRINK[1]) * (1 - leaving);
        setStyle(recorder.current, "opacity", String(shown));
        setStyle(
          recorder.current,
          "transform",
          `translate3d(-50%, ${(1 - shown) * 12}px, 0) scale(${lerp(0.96, 1, shown)})`,
        );
        const seconds = Math.floor(videoEl.currentTime);
        const text = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
        if (text !== lastRecorder && recorderTime.current) {
          recorderTime.current.textContent = text;
          lastRecorder = text;
        }
      }
    });

    return () => {
      stop();
      resizeObserver.disconnect();
      window.clearTimeout(fallback);
      videoEl.removeEventListener("canplay", filmReady);
      cancelled = true;
      scene?.dispose();
      laptop?.dispose();
      videoEl.removeEventListener("loadedmetadata", skipBlack);
    };
  }, []);

  return (
    <section
      ref={section}
      id="top"
      aria-label="Introduction"
      className="relative h-[520svh] bg-white dark:bg-zinc-950"
    >
      <h1 className="sr-only">Richie McIlroy</h1>
      <div className="sticky top-0 h-svh overflow-hidden">
        <div
          ref={screen}
          className="absolute inset-0 origin-center overflow-hidden bg-black will-change-transform"
        >
          <div aria-hidden="true" className="absolute inset-0">
            <video
              ref={video}
              className="absolute inset-0 size-full object-cover"
              style={{ filter: "grayscale(1) contrast(1.12)" }}
              poster="/film/poster.jpg"
              muted
              loop
              playsInline
              preload="auto"
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

          <div
            ref={scrim}
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 opacity-0"
          />

          <div aria-hidden="true" className="absolute inset-0">
            <canvas
              ref={gl}
              data-knockout
              className="absolute inset-0 size-full bg-black"
            />
            <canvas
              ref={mask}
              data-knockout
              className="absolute inset-0 hidden size-full bg-black"
            />
            <canvas
              ref={portal}
              data-knockout
              className="absolute inset-0 hidden size-full"
            />
          </div>
          <noscript>
            <style>{"[data-knockout]{display:none}"}</style>
          </noscript>

          <div
            ref={statement}
            className="absolute inset-x-0 bottom-0 px-5 pb-28 sm:px-10 sm:pb-16"
          >
            <div ref={logo} className="mb-8 opacity-0">
              <Image
                src="/cap-logo.svg"
                alt="Cap"
                width={98}
                height={30}
                className="h-7 w-auto"
              />
            </div>
            <p className="font-display text-[clamp(3.25rem,10.5vw,10.5rem)] leading-[0.88] font-extrabold font-stretch-condensed tracking-[-0.02em] text-white">
              {STATEMENT.map((line, i) => (
                <span key={line} className="block overflow-hidden pb-[0.06em]">
                  <span
                    ref={(el) => {
                      statementLines.current[i] = el;
                    }}
                    className="block will-change-transform"
                    style={{ transform: "translate3d(0, 105%, 0)" }}
                  >
                    {line}
                  </span>
                </span>
              ))}
            </p>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10"
        >
          <canvas
            ref={laptopCanvas}
            className="invisible absolute inset-0 size-full opacity-0"
          />
        </div>

        <div
          ref={recorder}
          aria-hidden="true"
          className="absolute left-1/2 flex items-center gap-3 rounded-full bg-black/70 py-2 pr-2 pl-3.5 font-mono text-xs text-white opacity-0 ring-1 ring-white/10 backdrop-blur-xl"
          style={{ transform: "translate3d(-50%, 12px, 0)" }}
        >
          <span className="relative flex size-2.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-white/60" />
            <span className="relative size-2.5 rounded-full bg-white" />
          </span>
          <span ref={recorderTime} className="w-9 tabular-nums">
            0:00
          </span>
          <span className="h-4 w-px bg-white/15" />
          <span className="flex size-6 items-center justify-center rounded-full bg-white/10">
            <span className="size-2 rounded-[2px] bg-white" />
          </span>
        </div>

        <div
          ref={caption}
          className="absolute top-24 right-5 z-20 max-w-xs space-y-3 text-sm opacity-0 sm:top-28 sm:right-10"
          style={{ transform: "translate3d(0, 16px, 0)" }}
        >
          <p className="text-zinc-600 dark:text-zinc-400">
            <span className="text-zinc-900 dark:text-white">Cap</span> is the
            open source screen recorder that works on every platform. I build it
            as a solo founder.
          </p>
          <a
            href="https://cap.so"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition-colors hover:decoration-zinc-900 dark:text-white dark:decoration-zinc-700 dark:hover:decoration-white"
          >
            cap.so
          </a>
        </div>
      </div>
    </section>
  );
}
