import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "./components/theme-provider";
import { PageTransitionProvider } from "./components/page-transition";
import { Header } from "./components/header";
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "Richie McIlroy",
  },
  openGraph: {
    title: "Richie McIlroy",
    description: "Personal website and writings",
    url: "https://richiemcilroy.com",
    siteName: "Richie McIlroy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Richie McIlroy",
    description: "Personal website and writings",
  },
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
          <main className="mx-auto max-w-4xl px-6 py-16">
            <Header />
            <PageTransitionProvider>{children}</PageTransitionProvider>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
