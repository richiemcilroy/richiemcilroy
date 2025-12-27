import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "./components/theme-provider";
import { PageTransitionProvider } from "./components/page-transition";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Richie McIlroy",
  description: "Personal website and writings",
  metadataBase: new URL("https://richiemcilroy.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen`}
      >
        <ThemeProvider>
          <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
            <PageTransitionProvider>{children}</PageTransitionProvider>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
