"use client";

import { useEffect, useRef, useState } from "react";
import {
  measure,
  onFrame,
  pointer,
  prefersReducedMotion,
  setStyle,
} from "./frame";
import type { ReelScene } from "./three/reel-scene";

type Chapter = {
  unit: "Age" | "Year" | "Now";
  value: string;
  title: string;
  body: string;
  image: string;
  // Screenshots are shown whole rather than cropped to fill the frame.
  fit?: "contain";
};

const chapters: Chapter[] = [
  {
    unit: "Age",
    value: "9",
    title: "An h1 tag",
    body: "My uncle, a web developer, showed me how to write my first heading, for a Call of Duty modding site I wanted to build. Watching text appear on screen felt like the coolest thing in the world. That feeling never really went away.",
    image: "/reel/image-three.webp",
  },
  {
    unit: "Age",
    value: "12",
    title: "The motherboard wasn't fried",
    body: "My parents saved for months to buy me PC parts for Christmas. It wouldn't boot, and the repair shop said the board was dead. It wasn't. I'd mounted it without risers. Experts can be wrong, and the answer is usually out there if you keep looking.",
    image: "/reel/image-one.webp",
  },
  {
    unit: "Age",
    value: "13",
    title: "A cheat code to life",
    body: "I re-edited fail compilations in Sony Vegas Pro. Some hit two or three million views. I made about three thousand dollars before I turned fourteen.",
    image: "/reel/maker-studios.webp",
    fit: "contain",
  },
  {
    unit: "Age",
    value: "16",
    title: "Learn by doing",
    body: "I liked learning. I couldn't stand exams. So I left school for an apprenticeship in IT. My first salary was £4,180.80 a year.",
    image: "/reel/first-salary.webp",
    fit: "contain",
  },
  {
    unit: "Age",
    value: "18",
    title: "Fired",
    body: "Running a web design business from your work email isn't the smartest move. With nothing to fall back on, I went all in, building sites for anyone who'd pay and learning at two in the morning.",
    image: "/reel/richie-liv-2016.webp",
  },
  {
    unit: "Age",
    value: "19",
    title: "Days and nights",
    body: "My first professional web development job. Shopify at agencies by day, my own apps by night. Along the way: forty kilograms of memory foam, and a dropshipping weekend that turned into a month of refunds.",
    image: "/reel/richie-liv-docks.webp",
  },
  {
    unit: "Year",
    value: "2020",
    title: "The first exit",
    body: "An app I built during the GPT-3 beta sold in a $100k acquihire. It gave me the confidence to keep building in public.",
    image: "/reel/desk-2020.webp",
  },
  {
    unit: "Year",
    value: "2021",
    title: "Most Technically Challenging",
    body: "Built SEOCopy.ai in 24 days. Won at the first-ever Supabase hackathon with Feature.so. The prize was a gold t-shirt.",
    image: "/reel/supabase-tee.webp",
  },
  {
    unit: "Year",
    value: "2022",
    title: "Sold, shipped, open sourced",
    body: "Sold Recover. Launched Question.to. Open sourced Reflio, because code can outlive a company.",
    image: "/reel/reflio-night.webp",
  },
  {
    unit: "Year",
    value: "2023",
    title: "Show HN: Cap",
    body: "Version 0.0.1 of an open source alternative to Loom. Open the app, hit record, share the link. No hoops.",
    image: "/reel/cap-v001.webp",
  },
  {
    unit: "Year",
    value: "2024",
    title: "Public beta",
    body: "Cap opened to everyone on 25 April 2024. A few weeks later it was the top post on Show HN.",
    image: "/reel/show-hn.webp",
    fit: "contain",
  },
  {
    unit: "Year",
    value: "2025",
    title: "10,000 stars",
    body: "Cap passed 10,000 stars on GitHub, and the team got together in San Francisco.",
    image: "/reel/team-sf.webp",
  },
  {
    unit: "Year",
    value: "2026",
    title: "Married",
    body: "Liv and I got married in front of all our family and friends.",
    image: "/reel/wedding.webp",
  },
  {
    unit: "Now",
    value: "2026",
    title: "Still pressing the power button",
    body: "A solo founder with $1.25M raised, outranked at home by a French Bulldog. There's a lot I want to ship.",
    image: "/reel/richie-xara.webp",
  },
];

const units = ["Age", "Year", "Now"] as const;

export function Chapters() {
  const list = useRef<HTMLOListElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const element = list.current;
    const stageEl = stage.current;
    const canvasEl = canvas.current;
    if (!element || !stageEl || !canvasEl) return;
    const items = Array.from(element.children) as HTMLElement[];
    let bounds = items.map(measure);
    let whole = measure(element);
    let scene: ReelScene | null = null;
    let cancelled = false;
    let visible = false;
    const reduced = prefersReducedMotion();

    const layout = () => {
      bounds = items.map(measure);
      whole = measure(element);
      scene?.layout(stageEl.clientWidth, stageEl.clientHeight);
      lastPosition = -1;
    };
    const observer = new ResizeObserver(layout);
    observer.observe(document.body);
    observer.observe(stageEl);

    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    seen.observe(stageEl);

    // The reel and its photos load only as the timeline comes close.
    const start = () => {
      import("./three/reel-scene")
        .then(({ ReelScene }) => {
          if (cancelled) return;
          scene = new ReelScene(
            canvasEl,
            chapters.map((chapter) => ({
              image: chapter.image,
              fit: chapter.fit,
              label: chapter.value,
            })),
          );
          scene.layout(stageEl.clientWidth, stageEl.clientHeight);
          canvasEl.dataset.ready = "true";
        })
        .catch(() => {});
    };
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        start();
      },
      { rootMargin: "150% 0px" },
    );
    near.observe(stageEl);

    let current = -1;
    let lastPosition = -1;
    let lastPointer = "";
    let settling = false;
    const stop = onFrame((now) => {
      const middle = window.scrollY + window.innerHeight * 0.5;

      // A continuous chapter position: 3 when chapter 3 is centred, 3.5
      // halfway to the next one.
      const centres = bounds.map((b) => b.top + b.height / 2);
      let position = 0;
      if (middle >= centres[centres.length - 1]) {
        position = centres.length - 1;
      } else if (middle > centres[0]) {
        const i = centres.findIndex(
          (c, j) => middle >= c && middle < centres[j + 1],
        );
        position = i + (middle - centres[i]) / (centres[i + 1] - centres[i]);
      }
      const index = Math.round(position);
      if (index !== current) {
        current = index;
        setActive(index);
      }
      if (progress.current) {
        const t = (middle - whole.top) / whole.height;
        setStyle(
          progress.current,
          "transform",
          `scaleY(${Math.min(1, Math.max(0, t))})`,
        );
      }

      // The reel only moves when scrolled or pointed at, so it's only
      // drawn then.
      const pointerKey = `${pointer.x}|${pointer.y}`;
      if (
        scene &&
        visible &&
        (position !== lastPosition || pointerKey !== lastPointer || settling)
      ) {
        lastPosition = position;
        lastPointer = pointerKey;
        const rect = stageEl.getBoundingClientRect();
        settling = scene.render(
          now,
          position,
          {
            x: (pointer.x - rect.left) / rect.width - 0.5,
            y: (pointer.y - rect.top) / rect.height - 0.5,
            active: pointer.seen,
          },
          reduced,
        );
      }
    });
    return () => {
      cancelled = true;
      stop();
      observer.disconnect();
      seen.disconnect();
      near.disconnect();
      scene?.dispose();
    };
  }, []);

  return (
    <section
      id="chapters"
      aria-labelledby="chapters-label"
      className="mx-auto max-w-6xl px-5 py-24 sm:px-10 sm:py-32"
    >
      <h2
        id="chapters-label"
        className="text-lg text-zinc-500 dark:text-zinc-500"
      >
        How I got here
      </h2>

      <div className="mt-16 grid gap-x-16 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div
          aria-hidden="true"
          className="sticky top-0 z-10 -mx-5 flex h-[46svh] flex-col self-start bg-white/90 px-5 pt-4 pb-3 backdrop-blur-md md:mx-0 md:h-svh md:bg-transparent md:px-0 md:py-10 md:backdrop-blur-none dark:bg-zinc-950/90 md:dark:bg-transparent"
        >
          <div ref={stage} className="relative min-h-0 flex-1">
            <canvas
              ref={canvas}
              className="absolute inset-0 size-full opacity-0 transition-opacity duration-1000 data-[ready]:opacity-100"
            />
          </div>
          <div className="flex items-end justify-between gap-6 pt-3">
            <div>
              <Roller
                items={units}
                active={units.indexOf(chapters[active].unit)}
                className="text-base text-zinc-500"
              />
              <Roller
                items={chapters.map((c) => c.value)}
                active={active}
                className="font-display text-[3.25rem] md:text-[clamp(4.5rem,8vw,7.5rem)] leading-[0.9] font-extrabold tracking-[-0.03em] font-stretch-condensed tabular-nums text-zinc-900 dark:text-white"
              />
            </div>
            <div className="mb-2 hidden items-center gap-1.5 md:flex">
              {chapters.map((chapter, i) => (
                <span
                  key={chapter.title}
                  className={`h-5 w-[3px] origin-bottom rounded-full transition-all duration-700 ease-[cubic-bezier(0.7,0,0.2,1)] ${
                    i === active
                      ? "scale-y-100 bg-zinc-900 dark:bg-white"
                      : i < active
                        ? "scale-y-50 bg-zinc-400 dark:bg-zinc-600"
                        : "scale-y-50 bg-zinc-200 dark:bg-zinc-800"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-0 bottom-0 left-0 hidden w-px bg-zinc-200 md:block dark:bg-zinc-800">
            <div
              ref={progress}
              className="h-full w-full origin-top scale-y-0 bg-zinc-900 dark:bg-white"
            />
          </div>
          <ol ref={list} className="md:pl-12">
            {chapters.map((chapter, i) => (
              <li
                key={chapter.title}
                data-active={i === active}
                className="flex min-h-[60svh] flex-col justify-center gap-6 py-12 transition-opacity duration-700 md:opacity-25 md:data-[active=true]:opacity-100"
              >
                <p className="text-sm text-zinc-500">
                  {chapter.unit === "Age"
                    ? `Age ${chapter.value}`
                    : chapter.unit === "Now"
                      ? `Now, ${chapter.value}`
                      : chapter.value}
                </p>
                <h3 className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1] font-semibold tracking-[-0.03em] text-zinc-900 dark:text-white">
                  {chapter.title}
                </h3>
                <p className="max-w-md text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {chapter.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// A slot machine column: every value stacked, translated to the active one.
function Roller({
  items,
  active,
  className,
}: {
  items: readonly string[];
  active: number;
  className: string;
}) {
  return (
    <div className={`relative h-[1lh] overflow-hidden ${className}`}>
      <div
        className="transition-transform duration-[900ms] ease-[cubic-bezier(0.7,0,0.2,1)]"
        style={{ transform: `translate3d(0, ${-active}lh, 0)` }}
      >
        {items.map((item, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: Values repeat.
            key={i}
            className="h-[1lh] transition-[opacity,filter] duration-700"
            style={{
              opacity: i === active ? 1 : 0,
              filter: i === active ? "blur(0)" : "blur(6px)",
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
