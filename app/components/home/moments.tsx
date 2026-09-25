"use client";

import Image from "next/image";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { onFrame, prefersReducedMotion, setStyle } from "./frame";

// Key phrases in the intro paragraph. Hovering one (or tapping it, or
// tabbing to it) brings up a small card that trails the pointer.

export type MomentId =
  | "richie"
  | "cap"
  | "nine"
  | "shipping"
  | "users"
  | "wife"
  | "xara";

type Anchor = { x: number; y: number };

const MomentContext = createContext<{
  show: (id: MomentId, anchor: Anchor, pointer: boolean) => void;
  hide: (id: MomentId) => void;
  poke: (id: MomentId) => void;
}>({ show: () => {}, hide: () => {}, poke: () => {} });

export function Moment({
  id,
  children,
  href,
}: {
  id: MomentId;
  children: ReactNode;
  // Phrases that are also links keep working as links.
  href?: string;
}) {
  const { show, hide, poke } = useContext(MomentContext);
  const pointerType = useRef("mouse");
  const centre = (element: HTMLElement): Anchor => {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top };
  };

  const handlers = {
    "data-moment": id,
    className: "moment",
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") {
        show(id, { x: event.clientX, y: event.clientY }, true);
      }
    },
    onPointerLeave: (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") hide(id);
    },
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      pointerType.current = event.pointerType;
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      // Only keyboard focus; a mouse click shouldn't pin the card.
      if (event.currentTarget.matches(":focus-visible")) {
        show(id, centre(event.currentTarget), false);
      }
    },
    onBlur: () => hide(id),
  };

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...handlers}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      {...handlers}
      onClick={(event) => {
        if (id === "xara") poke(id);
        // Touch has no hover, so a tap opens the card above the phrase.
        if (pointerType.current !== "mouse") {
          show(id, centre(event.currentTarget), false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") hide(id);
      }}
    >
      {children}
    </button>
  );
}

export function Moments({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<MomentId | null>(null);
  const [shown, setShown] = useState<MomentId | null>(null);
  const [pokes, setPokes] = useState(0);
  const card = useRef<HTMLDivElement>(null);
  const target = useRef<Anchor>({ x: 0, y: 0 });
  const followsPointer = useRef(true);
  const isOpen = useRef(false);
  useEffect(() => {
    isOpen.current = active !== null;
  }, [active]);

  // The card springs after the pointer and leans into the direction of
  // travel, like something held on a string.
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const position = { x: 0, y: 0 };
    let lean = 0;
    let placed = false;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !followsPointer.current) return;
      target.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener("pointermove", move, { passive: true });
    const hideOnScroll = () => {
      if (!followsPointer.current) setActive(null);
    };
    window.addEventListener("scroll", hideOnScroll, { passive: true });
    const stop = onFrame(() => {
      const element = card.current;
      if (!element) return;
      const { x, y } = target.current;
      // Nothing to do while the card is closed and has caught up.
      const still =
        Math.abs(x - position.x) < 0.1 &&
        Math.abs(y - position.y) < 0.1 &&
        Math.abs(lean) < 0.01;
      if (!isOpen.current && still) return;
      if (!placed || reduced) {
        position.x = x;
        position.y = y;
        placed = true;
      }
      const dx = (x - position.x) * 0.16;
      position.x += dx;
      position.y += (y - position.y) * 0.16;
      lean += (Math.max(-14, Math.min(14, dx * 0.6)) - lean) * 0.12;
      setStyle(
        element,
        "transform",
        `translate3d(${position.x.toFixed(1)}px, ${position.y.toFixed(1)}px, 0) translate(-50%, calc(-100% - 28px)) rotate(${reduced ? 0 : lean.toFixed(2)}deg)`,
      );
    });
    return () => {
      stop();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", hideOnScroll);
    };
  }, []);

  // Keep the card mounted while it fades out.
  useEffect(() => {
    if (active) {
      setShown(active);
      return;
    }
    const timer = window.setTimeout(() => setShown(null), 350);
    return () => window.clearTimeout(timer);
  }, [active]);

  return (
    <MomentContext.Provider
      value={{
        show: (id, anchor, pointer) => {
          followsPointer.current = pointer;
          target.current = anchor;
          setActive(id);
        },
        hide: (id) => setActive((current) => (current === id ? null : current)),
        poke: (id) => {
          setActive(id);
          setPokes((n) => n + 1);
        },
      }}
    >
      {children}
      <div
        ref={card}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-40"
      >
        <div
          data-open={active !== null}
          className="origin-bottom scale-90 opacity-0 blur-sm transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] data-[open=true]:scale-100 data-[open=true]:opacity-100 data-[open=true]:blur-none"
        >
          {shown && <Card id={shown} pokes={pokes} />}
        </div>
      </div>
    </MomentContext.Provider>
  );
}

const frame =
  "overflow-hidden rounded-2xl bg-zinc-950 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] ring-1 ring-black/10 dark:ring-white/10";

function Photo({
  src,
  alt,
  width,
  height,
  caption,
  tall = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  tall?: boolean;
}) {
  return (
    <figure className={`${frame} w-56 p-2`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="224px"
        className={`${tall ? "aspect-[9/16]" : "aspect-[4/5]"} w-full rounded-xl object-cover`}
      />
      {caption && (
        <figcaption className="px-1 pt-2 pb-0.5 text-xs text-zinc-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function Card({ id, pokes }: { id: MomentId; pokes: number }) {
  switch (id) {
    case "richie":
      return (
        <Photo
          src="/photos/la-portrait.jpg"
          alt=""
          width={960}
          height={1200}
          caption="Santa Monica, 2024."
        />
      );
    case "wife":
      return (
        <Photo
          src="/photos/nyc-2023-2026.jpg"
          alt=""
          width={675}
          height={1200}
          tall
          caption="Engaged in New York in 2023. Back there married in 2026."
        />
      );
    case "xara":
      return <Xara pokes={pokes} />;
    case "cap":
      return <CapClip />;
    case "nine":
      return <FirstLine />;
    case "shipping":
      return <Shipped />;
    case "users":
      return <Comments />;
  }
}

function CapClip() {
  return (
    <div className={`${frame} w-72`}>
      <video
        src="/film/cap-loop.mp4"
        className="aspect-[480/314] w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      />
      <p className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400">
        <span>Open the app, hit record.</span>
        <span className="text-zinc-500">cap.so</span>
      </p>
    </div>
  );
}

const CODE = "<h1>Hello, world</h1>";

function FirstLine() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const interval = window.setInterval(
      () => setCount((n) => (n >= CODE.length + 12 ? 0 : n + 1)),
      70,
    );
    return () => window.clearInterval(interval);
  }, []);
  return (
    <div className={`${frame} w-64`}>
      <Image
        src="/image-three.jpg"
        alt=""
        width={960}
        height={954}
        sizes="256px"
        className="aspect-[4/3] w-full object-cover"
      />
      <p className="px-3 py-2.5 font-mono text-xs text-zinc-300">
        {CODE.slice(0, count)}
        <span className="caret ml-px inline-block h-[1.1em] w-[0.5em] translate-y-[0.2em] bg-zinc-300" />
      </p>
    </div>
  );
}

const SHIPPED = [
  ["SEOCopy.ai", "2021"],
  ["Feature.so", "2021"],
  ["Recover", "2021"],
  ["Question.to", "2022"],
  ["Reflio", "2022"],
  ["Cap", "2023"],
] as const;

// A departure board of things shipped.
function Shipped() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = window.setInterval(
      () => setIndex((n) => (n + 1) % SHIPPED.length),
      900,
    );
    return () => window.clearInterval(interval);
  }, []);
  return (
    <div className={`${frame} w-72 p-3`}>
      <div className="flex items-center justify-between px-1 pb-2 text-[11px] text-zinc-500">
        <span>Shipped</span>
        <span>{String(index + 1).padStart(2, "0")} / 06</span>
      </div>
      <div className="relative h-16 overflow-hidden rounded-lg bg-zinc-900 [perspective:400px]">
        {SHIPPED.map(([name, year], i) => (
          <div
            key={name}
            className="absolute inset-0 flex items-center justify-between px-4 font-display text-2xl font-semibold tracking-[-0.02em] text-white transition-[rotate,opacity] duration-500 ease-[cubic-bezier(0.7,0,0.2,1)] [backface-visibility:hidden]"
            style={{
              rotate: `x ${i === index ? 0 : i < index ? 90 : -90}deg`,
              opacity: i === index ? 1 : 0,
            }}
          >
            <span>{name}</span>
            <span className="font-mono text-sm font-normal text-zinc-500">
              {year}
            </span>
          </div>
        ))}
        <span className="absolute inset-x-0 top-1/2 h-px bg-black/60" />
      </div>
    </div>
  );
}

// Comments on a Cap recording, as they appear in the film.
function Comments() {
  return (
    <div className={`${frame} w-72 space-y-2 p-3`}>
      {[
        ["T", "Tim", "ok this is awesome"],
        ["R", "Richie", "thanks tim"],
      ].map(([initial, name, text], i) => (
        <div
          key={name}
          className="flex animate-[bubble_0.5s_cubic-bezier(0.2,0.8,0.2,1)_both] gap-2.5 rounded-xl bg-zinc-900 p-2.5"
          style={{ animationDelay: `${i * 420}ms` }}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[11px] text-white">
            {initial}
          </span>
          <span className="text-sm">
            <span className="block text-xs text-zinc-500">{name} · now</span>
            <span className="text-zinc-100">{text}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Xara({ pokes }: { pokes: number }) {
  return (
    <figure className={`${frame} relative w-56 p-2`}>
      <Image
        key={pokes}
        src="/photos/richie-xara.jpg"
        alt=""
        width={900}
        height={1200}
        sizes="224px"
        className={`aspect-[4/5] w-full rounded-xl object-cover ${pokes ? "animate-[woof_0.45s_ease-in-out]" : ""}`}
      />
      {pokes > 0 && (
        <span
          key={`woof-${pokes}`}
          className="absolute top-5 right-5 animate-[bubble_0.4s_cubic-bezier(0.2,0.8,0.2,1)_both] rounded-full bg-white px-3 py-1 text-sm font-medium text-zinc-900"
        >
          woof.
        </span>
      )}
      <figcaption className="px-1 pt-2 pb-0.5 text-xs text-zinc-400">
        Xara. She runs the house.{" "}
        <span className="text-zinc-500">Click her name.</span>
      </figcaption>
    </figure>
  );
}
