"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import { measure, onFrame, prefersReducedMotion, range } from "./frame";

// Splits text into words that brighten one by one as the paragraph passes
// through the viewport. Elements such as links or inline images count as a
// single word, and links keep their own text split so they reveal in step.
function split(node: ReactNode, counter: { i: number }): ReactNode {
  if (typeof node === "string") {
    return node.split(/(\s+)/).map((part, index) => {
      if (!part) return null;
      if (/^\s+$/.test(part)) return part;
      const i = counter.i++;
      return (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: Words are static text.
          key={index}
          className="reveal-word"
          style={{ "--i": i } as React.CSSProperties}
        >
          {part}
        </span>
      );
    });
  }
  if (Array.isArray(node)) {
    return Children.map(node, (child) => split(child, counter));
  }
  if (isValidElement<{ children?: ReactNode; "data-word"?: boolean }>(node)) {
    if (node.props["data-word"]) {
      const i = counter.i++;
      return (
        <span
          className="reveal-word"
          style={{ "--i": i } as React.CSSProperties}
        >
          {node}
        </span>
      );
    }
    return cloneElement(
      node as ReactElement<{ children?: ReactNode }>,
      undefined,
      split(node.props.children, counter),
    );
  }
  return node;
}

export function RevealText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const counter = { i: 0 };
  const content = split(children, counter);
  const count = counter.i;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (prefersReducedMotion()) {
      element.style.setProperty("--p", String(count + 4));
      return;
    }
    let bounds = measure(element);
    const observer = new ResizeObserver(() => {
      bounds = measure(element);
    });
    observer.observe(document.body);
    let last = -1;
    const stop = onFrame(() => {
      const vh = window.innerHeight;
      // Starts as the top enters the lower fifth; done by mid-screen.
      const t = range(
        window.scrollY + vh,
        bounds.top + vh * 0.2,
        bounds.top + bounds.height + vh * 0.45,
      );
      const value = t * (count + 4);
      if (Math.abs(value - last) > 0.01) {
        element.style.setProperty("--p", value.toFixed(3));
        last = value;
      }
    });
    return () => {
      stop();
      observer.disconnect();
    };
  }, [count]);

  return (
    <p
      ref={ref}
      className={className}
      style={{ "--p": 0 } as React.CSSProperties}
    >
      {content}
    </p>
  );
}
