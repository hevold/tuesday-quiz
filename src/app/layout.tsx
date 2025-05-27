import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tirsdagsquizen - Gjør tirsdagen bedre",
  description: "Gjør tirsdagen bedre med simultane quiz-konkurranser på tvers av Norge. Registrer laget ditt og konkurrér i sanntid.",
  keywords: ["quiz", "trivia", "tirsdagsquiz", "Norge", "utesteder", "sanntid", "tirsdagsquizen", "quizlo", "gjør tirsdagen bedre", "quiz-konkurranse", "pub quiz"],
  authors: [{ name: "Quizlo" }],
  creator: "Quizlo",
  publisher: "Quizlo",
  
  // Favicon and icons
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/x-icon" }
    ],
    apple: "/icon.svg",
    shortcut: "/icon.svg"
  },
  
  // OpenGraph metadata for social sharing
  openGraph: {
    type: "website",
    locale: "nb_NO",
    url: "https://tirsdagsquizen.no",
    siteName: "Tirsdagsquizen",
    title: "Tirsdagsquizen - Gjør tirsdagen bedre",
    description: "Gjør tirsdagen bedre med simultane quiz-konkurranser på tvers av Norge. Registrer laget ditt og konkurrér i sanntid!",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Tirsdagsquizen - Quiz Platform"
      }
    ]
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "Tirsdagsquizen - Gjør tirsdagen bedre",
    description: "Gjør tirsdagen bedre med simultane quiz-konkurranser på tvers av Norge. Registrer laget ditt og konkurrér i sanntid!",
    images: ["/og-image.svg"],
    creator: "@quizlo"
  },
  
  // Additional metadata
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  language: "nb-NO",
  
  // App-specific metadata
  applicationName: "Tirsdagsquizen",
  category: "Entertainment",
  classification: "Quiz Competition Platform"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb">
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Additional meta tags */}
        <meta name="theme-color" content="#4A90E2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tirsdagsquizen" />
        
        {/* Preload fonts */}
        <link rel="preload" href="/fonts/Sigana Condensed.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        
        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Tirsdagsquizen",
              "description": "Gjør tirsdagen bedre med quiz-konkurranser på tvers av Norge",
              "url": "https://tirsdagsquizen.no",
              "applicationCategory": "Entertainment",
              "operatingSystem": "Web Browser",
              "provider": {
                "@type": "Organization",
                "name": "Quizlo",
                "url": "https://quizlo.no"
              }
            })
          }}
        />
      </head>
      <body className="antialiased" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
