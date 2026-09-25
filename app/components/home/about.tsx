import Image from "next/image";
import { Moment, Moments } from "./moments";
import { RevealText } from "./reveal-text";

function Chip({ src, alt }: { src: string; alt: string }) {
  return (
    <span data-word className="inline-block align-middle">
      <Image
        src={src}
        alt={alt}
        width={160}
        height={160}
        className="inline-block h-[0.82em] w-[1.3em] -translate-y-[0.06em] rounded-full object-cover"
      />
    </span>
  );
}

export function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-label"
      className="mx-auto max-w-6xl space-y-12 px-5 py-32 sm:px-10 sm:py-48"
    >
      <h2 id="about-label" className="sr-only">
        About
      </h2>
      <Moments>
        <RevealText className="font-display text-[clamp(2rem,5.2vw,4.5rem)] leading-[1.06] font-medium tracking-[-0.025em] text-zinc-400 dark:text-zinc-500">
          Hey, I'm <Moment id="richie">Richie</Moment>{" "}
          <Chip src="/richie-beach.jpg" alt="Richie McIlroy" />. I'm the solo
          founder of{" "}
          <Moment id="cap" href="https://cap.so">
            Cap
          </Moment>{" "}
          and I've been writing code <Moment id="nine">since I was nine</Moment>
          . I believe in empathy, both in code and in life. I believe in{" "}
          <Moment id="shipping">shipping fast</Moment> and learning from{" "}
          <Moment id="users">real users</Moment>. I love{" "}
          <Moment id="wife">my wife</Moment>, my family, my friends, and our
          small French Bulldog, <Moment id="xara">Xara</Moment>{" "}
          <Chip
            src="/xara-cap.jpg"
            alt="Xara the French Bulldog in a Cap hat"
          />
          .
        </RevealText>
      </Moments>
      <p className="max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        You can follow me on <Out href="https://x.com/richiemcilroy">X</Out>,
        see my code on <Out href="https://github.com/richiemcilroy">GitHub</Out>
        , or <Out href="mailto:richie@cap.so">email me</Out>. There's also a{" "}
        <Out href="/wiki">longer biography</Out> if you want the whole story.
      </p>
    </section>
  );
}

function Out({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition-colors hover:decoration-zinc-900 dark:text-white dark:decoration-zinc-700 dark:hover:decoration-white"
    >
      {children}
    </a>
  );
}
