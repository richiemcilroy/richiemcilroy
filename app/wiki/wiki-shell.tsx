"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";
import { wikiUpdated } from "@/lib/site";
import { sections } from "./sources";

export function WikiShell({ children }: { children: ReactNode }) {
  const [textSize, setTextSize] = useState("standard");
  const [width, setWidth] = useState("standard");
  const [color, setColor] = useState("light");
  const [contents, setContents] = useState(true);
  const [appearance, setAppearance] = useState(true);
  const [search, setSearch] = useState("");
  const [searched, setSearched] = useState(false);
  const results = sections.filter(([, name]) =>
    name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  function searchArticle(event: FormEvent) {
    event.preventDefault();
    setSearched(true);
  }

  return (
    <div
      className="wiki"
      data-text={textSize}
      data-width={width}
      data-color={color}
      id="top"
    >
      <a className="wiki-skip" href="#article">
        Jump to content
      </a>
      <header className="wiki-header">
        <details className="wiki-menu">
          <summary aria-label="Main menu">
            <span aria-hidden="true">☰</span>
          </summary>
          <nav aria-label="Site navigation">
            <b>Main menu</b>
            <Link href="/">Main page</Link>
            <a href="#top">Wiki</a>
            <a href="#writing">Writing</a>
            <a href="https://cap.so">Cap</a>
            <a href="#external-links">Contact</a>
          </nav>
        </details>
        <a className="wiki-brand" href="#top" aria-label="Richie's Wiki home">
          <span className="wiki-globe" aria-hidden="true">
            <span>W</span>
            <i>文</i>
            <em>Ω</em>
          </span>
          <span>
            <strong>Wiki</strong>
            <small>The Personal Encyclopedia</small>
          </span>
        </a>
        <search className="wiki-search-wrap">
          <form className="wiki-search" onSubmit={searchArticle}>
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Search this Wiki"
              placeholder="Search this Wiki"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSearched(false);
              }}
              type="search"
            />
            <button type="submit">Search</button>
          </form>
          {searched && (
            <div className="wiki-search-results" aria-live="polite">
              <b>
                {search.trim()
                  ? `Sections matching “${search}”`
                  : "Article sections"}
              </b>
              {results.length ? (
                results.map(([id, name]) => (
                  <a
                    href={`#${id}`}
                    key={id}
                    onClick={() => setSearched(false)}
                  >
                    {name}
                  </a>
                ))
              ) : (
                <p>No matching section. Try “Cap”, “career”, or “writing”.</p>
              )}
              <button type="button" onClick={() => setSearched(false)}>
                Close search
              </button>
            </div>
          )}
        </search>
        <nav className="wiki-personal-links" aria-label="Personal links">
          <Link href="/">Main page</Link>
          <a href="https://github.com/richiemcilroy">GitHub</a>
          <a href="https://x.com/richiemcilroy">X</a>
        </nav>
      </header>

      <div className="wiki-layout">
        <aside className="wiki-contents" aria-label="Contents">
          <div className="wiki-sidebar-title">
            <b>Contents</b>
            <button
              type="button"
              aria-expanded={contents}
              onClick={() => setContents(!contents)}
            >
              {contents ? "hide" : "show"}
            </button>
          </div>
          {contents && (
            <nav>
              <a href="#top" className="wiki-toc-top">
                (Top)
              </a>
              {sections.map(([id, name, nested]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={nested ? "wiki-toc-nested" : undefined}
                >
                  {name}
                </a>
              ))}
            </nav>
          )}
        </aside>

        <main className="wiki-main" id="article">
          <div className="wiki-title">
            <h1>Richie McIlroy</h1>
            <span className="wiki-language">
              <span aria-hidden="true">文 A</span> English
            </span>
          </div>
          <div className="wiki-tabs">
            <nav aria-label="Article navigation">
              <a href="#top" className="wiki-tab-active">
                Article
              </a>
              <a href="#references">Sources</a>
            </nav>
            <nav aria-label="Article tools">
              <a href="#top" className="wiki-tab-active">
                Read
              </a>
              <a href="#references">Cite</a>
              <details className="wiki-tools">
                <summary>
                  Tools <span aria-hidden="true">⌄</span>
                </summary>
                <div>
                  <button type="button" onClick={() => window.print()}>
                    Print this page
                  </button>
                  <a href="#references">Cite this page</a>
                  <a href="mailto:richie@cap.so?subject=Wiki%20correction">
                    Suggest a correction
                  </a>
                </div>
              </details>
            </nav>
          </div>
          <div className="wiki-mobile-controls">
            <button
              type="button"
              onClick={() => {
                document
                  .getElementById("wiki-mobile-contents")
                  ?.toggleAttribute("open");
              }}
            >
              Contents
            </button>
            <a href="#appearance">Appearance</a>
          </div>
          <details className="wiki-mobile-toc" id="wiki-mobile-contents">
            <summary>On this page</summary>
            <nav>
              {sections.map(([id, name]) => (
                <a key={id} href={`#${id}`}>
                  {name}
                </a>
              ))}
            </nav>
          </details>
          <article className="wiki-article">{children}</article>
        </main>

        <aside
          className="wiki-appearance"
          aria-label="Appearance"
          id="appearance"
        >
          <div className="wiki-sidebar-title">
            <b>Appearance</b>
            <button
              type="button"
              aria-expanded={appearance}
              onClick={() => setAppearance(!appearance)}
            >
              {appearance ? "hide" : "show"}
            </button>
          </div>
          {appearance && (
            <>
              <fieldset>
                <legend>Text</legend>
                {["small", "standard", "large"].map((value) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="wiki-text"
                      value={value}
                      checked={textSize === value}
                      onChange={() => setTextSize(value)}
                    />
                    {value}
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>Width</legend>
                {["standard", "wide"].map((value) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="wiki-width"
                      value={value}
                      checked={width === value}
                      onChange={() => setWidth(value)}
                    />
                    {value}
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>Color</legend>
                {["automatic", "light", "dark"].map((value) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="wiki-color"
                      value={value}
                      checked={color === value}
                      onChange={() => setColor(value)}
                    />
                    {value}
                  </label>
                ))}
              </fieldset>
            </>
          )}
        </aside>
      </div>

      <footer className="wiki-footer">
        <p>
          This page was last updated on{" "}
          <time dateTime={wikiUpdated}>
            {new Date(wikiUpdated).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            })}
          </time>
          .
        </p>
        <p>
          A personal encyclopedia by Richie McIlroy. Inspired by Wikipedia’s
          Vector layout; not affiliated with Wikipedia or the Wikimedia
          Foundation.
        </p>
        <nav aria-label="Footer">
          <Link href="/">About Richie</Link>
          <a href="#references">Sources</a>
          <a href="mailto:richie@cap.so?subject=Wiki%20correction">
            Suggest a correction
          </a>
          <a href="#top">Back to top</a>
        </nav>
      </footer>
    </div>
  );
}
