import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import {
  absoluteUrl,
  homeDescription,
  homeTitle,
  person,
  siteName,
} from "@/lib/site";
import { About } from "./components/home/about";
import { Chapters } from "./components/home/chapters";
import { Hero } from "./components/home/hero";
import { Outro } from "./components/home/outro";
import { RecorderBar } from "./components/home/recorder-bar";
import { SmoothScroll } from "./components/home/smooth-scroll";
import { Writing } from "./components/home/writing";
import { StructuredData } from "./components/structured-data";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      name: siteName,
      alternateName: "richiemcilroy.com",
      url: absoluteUrl("/"),
      description: homeDescription,
      inLanguage: "en-GB",
      publisher: { "@id": person["@id"] },
    },
    person,
  ],
};

export default function Home() {
  const posts = getAllPosts();

  return (
    <>
      <StructuredData id="website-schema" data={structuredData} />
      <noscript>
        <style>{".reveal-word{opacity:1!important}"}</style>
      </noscript>
      <SmoothScroll />
      <Hero />
      <main className="relative bg-white dark:bg-zinc-950">
        <About />
        <Chapters />
        <Writing posts={posts} />
      </main>
      <Outro />
      <RecorderBar />
      <div aria-hidden="true" className="grain" />
    </>
  );
}
