"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

interface TransitionContextValue {
  isTransitioning: boolean;
  navigate: (href: string) => void;
}

const TransitionContext = createContext<TransitionContextValue>({
  isTransitioning: false,
  navigate: () => {},
});

export function usePageTransition() {
  return useContext(TransitionContext);
}

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Keep the initial HTML readable even before JavaScript loads.
  const [isEntering, setIsEntering] = useState(false);
  const previousPathname = useRef(pathname);
  const [, startTransition] = useTransition();

  // Animate navigation after hydration, leaving the first paint clear.
  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    setIsEntering(true);
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname) return;

      setIsTransitioning(true);

      // Wait for blur animation, then navigate
      setTimeout(() => {
        startTransition(() => {
          router.push(href);
          setIsTransitioning(false);
        });
      }, 100);
    },
    [pathname, router],
  );

  // Intercept all internal link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (!link) return;

      const href = link.getAttribute("href");

      // Skip external links, hash links, and links with target
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        link.target === "_blank"
      ) {
        return;
      }

      e.preventDefault();
      navigate(href);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [navigate]);

  const shouldBlur = isTransitioning || isEntering;

  return (
    <TransitionContext.Provider value={{ isTransitioning, navigate }}>
      <div
        className="transition-all duration-300 ease-out"
        style={{
          filter: shouldBlur ? "blur(3px)" : "blur(0px)",
          opacity: shouldBlur ? 0.85 : 1,
          transform: shouldBlur ? "scale(0.995)" : "scale(1)",
        }}
      >
        {children}
      </div>
    </TransitionContext.Provider>
  );
}
