export const siteUrl = "https://www.richiemcilroy.com";
export const siteName = "Richie McIlroy";
export const homeTitle = "Richie McIlroy | Software Developer & Founder of Cap";
export const homeDescription =
  "Richie McIlroy is the founder of Cap, the open-source screen recorder. Read his biography and essays on building software, product design, and entrepreneurship.";

// Update these when the corresponding page content changes, not on every build.
export const homeUpdated = "2026-09-09";
export const wikiUpdated = "2026-09-09";

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export const person = {
  "@type": "Person",
  "@id": absoluteUrl("/#person"),
  name: siteName,
  alternateName: "richiemcilroy",
  url: absoluteUrl("/wiki"),
  image: absoluteUrl("/richie-beach.jpg"),
  jobTitle: "Founder of Cap",
  worksFor: {
    "@type": "Organization",
    name: "Cap",
    url: "https://cap.so",
  },
  sameAs: [
    "https://github.com/richiemcilroy",
    "https://x.com/richiemcilroy",
    "https://www.linkedin.com/in/richiemcilroy/",
  ],
};

export const author = {
  "@type": "Person",
  "@id": person["@id"],
  name: siteName,
  url: absoluteUrl("/wiki"),
};
