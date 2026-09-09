import type { Metadata } from "next";
import Image from "next/image";
import { StructuredData } from "@/app/components/structured-data";
import { absoluteUrl, person, siteName, wikiUpdated } from "@/lib/site";
import { sources } from "./sources";
import { WikiShell } from "./wiki-shell";
import "./wiki.css";

const title = "Richie McIlroy | Cap Founder, Biography & Career";
const description =
  "Richie McIlroy is a software developer from Liverpool and founder of Cap. Explore his biography, career, open-source projects and Supabase hackathon award.";
const profileImage = {
  url: "/richie-beach.jpg",
  width: 1407,
  height: 1807,
  alt: "Richie McIlroy, software developer and founder of Cap",
};

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/wiki" },
  authors: [{ name: siteName, url: absoluteUrl("/wiki") }],
  openGraph: {
    title,
    description,
    url: "/wiki",
    siteName,
    locale: "en_GB",
    type: "profile",
    firstName: "Richie",
    lastName: "McIlroy",
    username: "richiemcilroy",
    images: [profileImage],
  },
  twitter: {
    card: "summary",
    creator: "@richiemcilroy",
    title,
    description,
    images: [profileImage],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": absoluteUrl("/wiki#profile"),
  url: absoluteUrl("/wiki"),
  name: title,
  description,
  inLanguage: "en-GB",
  dateModified: wikiUpdated,
  isPartOf: { "@type": "WebSite", "@id": absoluteUrl("/#website") },
  mainEntity: {
    ...person,
    description:
      "Software developer and entrepreneur from Liverpool, England, and founder of Cap.",
    award:
      "Most Technically Challenging — first Supabase hackathon (2021), Feature.so",
  },
};

function Ref({ n, id }: { n: number; id?: string }) {
  return (
    <sup className="wiki-ref" id={id}>
      <a
        href={`#ref-${n}`}
        aria-label={`Reference ${n}: ${sources[n - 1].title}`}
        title={sources[n - 1].title}
      >
        [{n}]
      </a>
    </sup>
  );
}

function Heading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id}>
      {children}
      <a
        className="wiki-section-link"
        href={`#${id}`}
        aria-label={`Link to ${children}`}
      >
        [ link ]
      </a>
    </h2>
  );
}

export default function WikiPage() {
  return (
    <WikiShell>
      <StructuredData id="richie-profile-schema" data={structuredData} />
      <p className="wiki-origin">
        From Richie’s Wiki, the personal encyclopedia
      </p>
      <p className="wiki-hatnote">
        This is a personal page on richiemcilroy.com, styled after Wikipedia.
      </p>

      <aside
        className="wiki-infobox"
        aria-label="Richie McIlroy biography at a glance"
      >
        <div className="wiki-infobox-name">Richie McIlroy</div>
        <figure>
          <Image
            src="/richie-beach.jpg"
            alt="Richie McIlroy at the beach"
            width={1407}
            height={1807}
            style={{ height: "auto" }}
            priority
            sizes="(max-width: 600px) 280px, 260px"
          />
          <figcaption>McIlroy, pictured on his personal website</figcaption>
        </figure>
        <table>
          <tbody>
            <tr>
              <th scope="row">From</th>
              <td>
                <a href="https://en.wikipedia.org/wiki/Liverpool">Liverpool</a>,
                England
                <Ref n={1} />
              </td>
            </tr>
            <tr>
              <th scope="row">Occupations</th>
              <td>
                Software developer
                <br />
                Entrepreneur
              </td>
            </tr>
            <tr>
              <th scope="row">Known for</th>
              <td>
                <a href="#cap">Cap</a>
                <br />
                <a href="#independent-products">SEOCopy.ai · Recover</a>
              </td>
            </tr>
            <tr>
              <th scope="row">Work</th>
              <td>
                Founder of <a href="https://cap.so">Cap</a>
                <Ref n={2} />
              </td>
            </tr>
            <tr>
              <th scope="row">Spouse</th>
              <td>
                <a href="#personal-life">Olivia Mae Hanlon</a>
                <Ref n={27} />
              </td>
            </tr>
            <tr>
              <th scope="row">Website</th>
              <td>
                <a href="/">richiemcilroy.com</a>
              </td>
            </tr>
          </tbody>
        </table>
      </aside>

      <p>
        <b>Richie McIlroy</b> is a software developer and entrepreneur from{" "}
        <a href="https://en.wikipedia.org/wiki/Liverpool">Liverpool</a>,
        England. He is the solo founder of <a href="https://cap.so">Cap</a>, an
        open-source screen recording and sharing application with millions of
        downloads.
        <Ref n={31} /> His earlier projects include the AI copywriting service{" "}
        <b>SEOCopy.ai</b> and the Stripe checkout recovery tool <b>Recover</b>.
        <Ref n={1} />
        <Ref n={2} />
        <Ref n={3} />
        <Ref n={4} />
      </p>
      <p>
        McIlroy began coding as a child, entered the technology industry through
        an IT apprenticeship, and worked in web development before building
        independent software products. He has documented his projects through
        personal essays,{" "}
        <a href="https://www.indiehackers.com">Indie Hackers</a>, and social
        media, sharing both product milestones and the difficulties of running a
        software business.
        <Ref n={1} />
        <Ref n={5} />
        <Ref n={10} />
      </p>
      <p>
        McIlroy raised US$1.25 million for Cap as a solo founder.
        <Ref n={14} /> Cap was presented on{" "}
        <a href="https://news.ycombinator.com/item?id=38445731">Hacker News</a>{" "}
        in November 2023 and entered public beta in April 2024. Its subsequent
        development centred on local recording, editing, and sharing, with
        source code published on GitHub.
        <Ref n={6} />
        <Ref n={7} />
        <Ref n={8} />
      </p>

      <Heading id="early-life">Early life and education</Heading>
      <p>
        In his autobiographical essay <i>My story so far</i>, McIlroy describes
        growing up in Liverpool and writing his first HTML at nine for a Call of
        Duty modding website, with help from his uncle. At twelve, he assembled
        his first PC and began recruiting YouTube creators for multi-channel
        networks. He later earned money editing compilation videos. He left
        school at sixteen to begin an IT apprenticeship.
        <Ref n={1} />
      </p>

      <Heading id="career">Career</Heading>
      <h3 id="early-career">Web development</h3>
      <p>
        McIlroy writes that he lost his IT job at eighteen, after starting a web
        design business on the side. He continued building client websites
        independently. At nineteen, he obtained his first professional
        web-development position, followed by work at web agencies, principally
        on Shopify sites. He continued developing his own applications outside
        working hours.
        <Ref n={1} />
      </p>
      <p>
        In 2020, according to his retrospective, an application he built during
        the GPT-3 beta led to a US$100,000 acquihire. He describes the deal as
        an important source of confidence for his later independent projects.
        <Ref n={1} />
      </p>

      <h3 id="independent-products">Independent products</h3>
      <p>
        In June 2021, McIlroy launched <b>SEOCopy.ai</b>, a service for
        generating search-engine-oriented marketing copy. A September update
        described a blog-post generator that assembled an article from a
        subject, keywords, title, introduction, and subheadings. He reported
        building the initial product in 24 days.
        <Ref n={18} />
      </p>
      <p>
        In August 2021, McIlroy won the <b>Most Technically Challenging</b>{" "}
        category at the first-ever Supabase hackathon with <b>Feature.so</b>, a
        tool for building and managing application components from a dashboard
        using an embedded code snippet.
        <Ref n={30} />
      </p>
      <p>
        On 14 September 2021, he reported that SEOCopy had sold all twenty of
        its initial founder plans and reached US$413 in monthly recurring
        revenue. He also created a public startup metrics page and used an
        AI-generated blog to demonstrate the product.
        <Ref n={3} />
      </p>
      <p>
        While looking for a way to follow up on abandoned Stripe checkouts for
        SEOCopy, McIlroy developed <b>Recover.so</b>. In a November 2021
        introduction, he described a service that connected to a customer’s
        Stripe account and sent scheduled recovery emails.
        <Ref n={4} /> In January 2022, he sold Recover for US$4,500 after
        listing it on MicroAcquire. His account states that the product had no
        revenue at the time; the agreed price included additional pricing-tier
        functionality.
        <Ref n={5} />
      </p>
      <p>
        Jade Craven included McIlroy in her Indie Hackers article{" "}
        <i>25 Indie Makers To Watch in 2022</i>, discussing his work on SEOCopy
        and Recover.
        <Ref n={17} />
      </p>

      <p>
        In February 2022, he launched <b>Question.to</b>, an embeddable feedback
        tool that let website visitors send questions, bug reports, and
        in-browser Loom videos without having a Loom account. Its launch
        included a React package for embedding the service.
        <Ref n={19} />
      </p>
      <p>
        Later that year, he developed <b>Reflio</b>, an open-source affiliate
        and referral platform for SaaS businesses. He explained that he wanted
        to charge per successful referral rather than require a fixed monthly
        fee. A June essay set out his reasons for open-sourcing the project,
        including community participation and the ability for code to outlive a
        company. By August 2022, Reflio was in public beta with Stripe
        integration and support for subscriptions and one-time payments.
        <Ref n={20} />
        <Ref n={21} />
      </p>

      <h3 id="cap">Cap</h3>
      <p className="wiki-hatnote">
        Main project: <a href="https://cap.so">Cap</a> ·{" "}
        <a href="https://github.com/CapSoftware/Cap">Source code</a>
      </p>
      <p>
        McIlroy introduced Cap as an open-source alternative to Loom. The
        project appeared in a Show HN submission on 28 November 2023 while still
        under development. In the discussion, he explained that he wanted to
        share the project early to gather ideas and feedback.
        <Ref n={6} />
      </p>
      <p>
        Cap’s public beta launched on 25 April 2024 after approximately six
        months of development. It initially offered browser-based recording and
        a macOS application built with Tauri. Recordings could be shared by
        link, with comments, reactions, and viewing analytics.
        <Ref n={7} />
      </p>
      <p>
        The September 2024 release of Cap 0.3 introduced a rebuilt application,
        local recording and editing, video trimming, custom backgrounds, and
        screenshots. McIlroy described the release as a shift towards a
        local-first approach.
        <Ref n={8} /> In November, he published an account of a payment attack
        during Cap’s Product Hunt launch, detailing the team’s response and
        changes to payment protection.
        <Ref n={9} />
      </p>
      <p>
        In September 2025, McIlroy and Brendan Allan published a postmortem on
        an outage affecting Cap’s website and sharing services. The article
        explained the infrastructure change that caused it and the subsequent
        safeguards. Local Studio Mode recording remained available during the
        outage.
        <Ref n={10} />
      </p>
      <p>
        Cap 0.5, announced on 27 May 2026, added Google Drive storage, merged
        recordings, screenshot text recognition, camera background blur, and
        organisation branding, alongside recording and export fixes.
        <Ref n={11} /> In August 2026, McIlroy published announcements of Cap’s
        SOC 2 Type II audit and ISO 27001 certification, followed by its HIPAA
        compliance offering.
        <Ref n={12} />
        <Ref n={13} />
      </p>

      <h3 id="funding">Funding</h3>
      <p>
        McIlroy raised <b>US$1.25 million</b> for Cap as a solo founder,
        according to his confirmation for this biography.
        <Ref n={14} /> A December 2024 Startup Grind event described him as
        having secured US investment and moved to working on Cap full-time
        following a successful pre-seed round. The listing also described him as
        having previously built and sold four micro-SaaS products.
        <Ref n={22} />
      </p>

      <Heading id="open-source">Open-source contributions</Heading>
      <p>
        Open-source software is a recurring part of McIlroy’s work, from Reflio
        to Cap. In his 2022 essay on open-sourcing Reflio, he argued that public
        code could invite community contributions and allow a project to remain
        useful even if the business behind it closed.
        <Ref n={20} /> He subsequently introduced Cap publicly as an open-source
        screen-recording application and invited feedback while it was still in
        development.
        <Ref n={6} />
      </p>
      <p>
        Beyond his own products, McIlroy has contributed to open-source projects
        including Supabase, UnInbox, react-lazy-media, and CapSoftware’s Cinder.
        <Ref n={23} />
        <Ref n={24} />
        <Ref n={25} />
        <Ref n={26} />
      </p>

      <Heading id="writing">Writing and public presence</Heading>
      <p>
        McIlroy writes about independent software development, learning through
        practical work, and building products in public. His 2021 SEOCopy
        updates used revenue and product-development reports as both
        documentation and marketing.
        <Ref n={3} /> His later essays discuss AI-assisted development and
        product judgement.
      </p>
      <ul>
        <li>
          <i>
            <a href="/posts/my-story-so-far">My story so far</a>
          </i>{" "}
          (27 December 2025), an account of his childhood, web-development
          career, and path to Cap.
          <Ref n={1} />
        </li>
        <li>
          <i>
            <a href="/posts/just-start-building">Just Start Building</a>
          </i>{" "}
          (27 February 2026), a practical approach to developing ideas with AI
          coding tools, written specifications, and repeated review.
          <Ref n={15} />
        </li>
        <li>
          <i>
            <a href="/posts/taste-is-a-moat">Taste is a moat</a>
          </i>{" "}
          (5 March 2026), an argument that product judgement, restraint, and
          coherence become more valuable as software becomes easier to build.
          <Ref n={16} />
        </li>
      </ul>

      <h3 id="public-posts">Selected public posts</h3>
      <p>
        The following posts trace publicly documented projects. The original
        Recover tweets are linked in McIlroy’s own sale retrospective; the early
        Cap post is linked in the Hacker News discussion.
        <Ref n={5} />
        <Ref n={6} />
      </p>
      <div className="wiki-table-scroll">
        <table className="wiki-table">
          <caption>Selected posts and project milestones</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Subject</th>
              <th scope="col">Original source</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>14 September 2021</td>
              <td>SEOCopy reaches $413 MRR</td>
              <td>
                <a href={sources[2].url}>Indie Hackers</a>
              </td>
            </tr>
            <tr>
              <td>7 November 2021</td>
              <td>Introducing Recover</td>
              <td>
                <a href={sources[3].url}>Indie Hackers</a>
              </td>
            </tr>
            <tr>
              <td>10 January 2022</td>
              <td>Recover listed for sale</td>
              <td>
                <a href="https://x.com/richiemcilroy/status/1480566338255040515">
                  Twitter / X ↗
                </a>
              </td>
            </tr>
            <tr>
              <td>23 January 2022</td>
              <td>Recover acquisition announcement</td>
              <td>
                <a href="https://x.com/richiemcilroy/status/1485082613111001090">
                  Twitter / X ↗
                </a>
              </td>
            </tr>
            <tr>
              <td>17 November 2023</td>
              <td>Early Cap development</td>
              <td>
                <a href="https://x.com/richiemcilroy/status/1725581789140332698">
                  Twitter / X ↗
                </a>
              </td>
            </tr>
            <tr>
              <td>28 November 2023</td>
              <td>Introducing Cap to Hacker News</td>
              <td>
                <a href={sources[5].url}>Hacker News</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading id="personal-life">Personal life</Heading>
      <p>
        McIlroy is married to{" "}
        <a href="https://oliviahanlon.com/">Olivia Mae Hanlon</a>.
        <Ref n={27} /> Hanlon is an entrepreneur and the founder and CEO of
        <b> Girls in Marketing</b>, an education and networking community she
        started in 2019. The organisation provides training, resources, events,
        and a podcast for marketers, with a focus on supporting women in the
        industry.
        <Ref n={28} />
        <Ref n={29} />
      </p>
      <p>
        Hanlon graduated from Birmingham City University in 2019 with a degree
        in Psychology and Criminology, having freelanced in content writing and
        SEO alongside her studies. She was named to Forbes’ 30 Under 30 list in
        2024 and received BCU’s Alumna of the Year award in January 2026.
        <Ref n={29} /> McIlroy’s autobiographical writing also mentions their
        French Bulldog, Xara.
        <Ref n={1} />
      </p>

      <Heading id="references">References</Heading>
      <p className="wiki-source-note">
        Biographical details are drawn primarily from McIlroy’s own published
        accounts. Revenue and acquisition figures are self-reported. The funding
        amount was confirmed directly by McIlroy for this biography; the public
        event listing independently documents the round but does not state an
        amount. His marriage to Olivia Mae Hanlon was also confirmed directly by
        McIlroy. Details of Hanlon’s career are drawn from Forbes and Birmingham
        City University. Open-source contributions are supported by merged pull
        requests. Sources checked on 7 September 2026. This is a curated
        biography, not a complete archive of tweets; unavailable or unindexed
        posts are not represented.
      </p>
      <ol className="wiki-references">
        {sources.map((source, i) => (
          <li id={`ref-${i + 1}`} key={source.title}>
            <span>
              {source.author} ({source.date}).{" "}
              {source.url ? (
                <a href={source.url}>“{source.title}”</a>
              ) : (
                <>“{source.title}”</>
              )}
              . <i>{source.publisher}</i>.
            </span>
          </li>
        ))}
      </ol>

      <Heading id="external-links">External links</Heading>
      <ul>
        <li>
          <a href="/">Official website</a>
        </li>
        <li>
          <a href="https://x.com/richiemcilroy">Richie McIlroy</a> on X
          (formerly Twitter)
        </li>
        <li>
          <a href="https://github.com/richiemcilroy">Richie McIlroy</a> on
          GitHub
        </li>
        <li>
          <a href="https://www.linkedin.com/in/richiemcilroy/">
            Richie McIlroy
          </a>{" "}
          on LinkedIn
        </li>
        <li>
          <a href="https://cap.so">Cap</a> — official project website
        </li>
      </ul>
      <div className="wiki-categories">
        <span>Categories:</span> <a href="#early-life">People from Liverpool</a>
        <a href="#career">Software developers</a>
        <a href="#cap">Open-source software</a>
        <a href="#writing">Independent founders</a>
      </div>
    </WikiShell>
  );
}
