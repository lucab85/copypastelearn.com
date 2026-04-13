import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { NewsletterPopup } from "@/components/newsletter-popup";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { RouteChangeTracker } from "@/components/analytics/route-change-tracker";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CopyPasteLearn — Learn IT Automation by Doing",
    template: "%s — CopyPasteLearn",
  },
  description:
    "Master IT automation with expert-led video courses and hands-on interactive labs. Build real skills by doing in live environments.",
  keywords: [
    "IT automation",
    "learn DevOps",
    "Docker tutorial",
    "Ansible course",
    "Node.js API course",
    "hands-on labs",
    "interactive coding",
    "infrastructure as code",
    "copypastelearn",
  ],
  authors: [{ name: "CopyPasteLearn" }],
  creator: "CopyPasteLearn",
  publisher: "CopyPasteLearn",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "CopyPasteLearn",
    title: "CopyPasteLearn — Learn IT Automation by Doing",
    description:
      "Master IT automation with expert-led video courses and hands-on interactive labs. Build real skills by doing in live environments.",
    images: [
      {
        url: "/images/og-default.png",
        width: 1200,
        height: 630,
        alt: "CopyPasteLearn — Learn IT Automation by Doing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@copypastelearn",
    creator: "@yourlinuxsa",
    title: "CopyPasteLearn — Learn IT Automation by Doing",
    description:
      "Master IT automation with expert-led video courses and hands-on interactive labs. Build real skills by doing in live environments.",
    images: ["/images/og-default.png"],
  },
};

/**
 * Check whether the Clerk publishable key looks valid (base64-decodable).
 * When missing or placeholder, we skip ClerkProvider so the app still renders.
 */
function isClerkConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!pk || pk.length < 20 || pk.includes("...")) return false;
  try {
    atob(pk.replace(/^pk_(test|live)_/, ""));
    return true;
  } catch {
    return false;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkEnabled = isClerkConfigured();

  let ClerkProvider: React.ComponentType<{ children: React.ReactNode }> | null =
    null;
  if (clerkEnabled) {
    const clerk = await import("@clerk/nextjs");
    ClerkProvider = clerk.ClerkProvider;
  }

  const body = (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to third-party origins for faster resource loading */}
        <link rel="preconnect" href="https://stream.mux.com" />
        <link rel="preconnect" href="https://image.mux.com" />
        <link rel="preconnect" href="https://clerk.copypastelearn.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
      </head>
      <body className="flex min-h-screen flex-col bg-background font-sans antialiased">
        {/* Google Analytics (GA4) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-YN94VH0TPN"
          strategy="lazyOnload"
        />
        <Script id="ga4-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-YN94VH0TPN');
          `}
        </Script>

        {/* Microsoft Clarity */}
        <Script id="clarity-init" strategy="lazyOnload">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window,document,"clarity","script","vlu7pdkdd9");
          `}
        </Script>

        {/* Analytics — SPA page view tracking */}
        <Suspense>
          <RouteChangeTracker />
        </Suspense>
        {/* Skip to content — accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        {!clerkEnabled && (
          <div className="bg-yellow-100 px-4 py-1.5 text-center text-xs text-yellow-800">
            Auth is disabled — set Clerk keys in <code>.env.local</code> to
            enable.
          </div>
        )}
        <AnnouncementBanner
          message="🎤 Luca Berton is speaking at Red Hat Summit & KubeCon EU 2026!"
          linkText="Learn more"
          linkHref="https://lucaberton.com/blog/red-hat-summit-2026/"
          externalLink
        />
        <SiteHeader />
        <main id="main-content" className="flex-1">{children}</main>
        <SiteFooter />
            <NewsletterPopup />
      </body>
    </html>
  );

  if (ClerkProvider) {
    return <ClerkProvider>{body}</ClerkProvider>;
  }

  return body;
}
