import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PostHogProvider } from "@/components/PostHogProvider";
import { ErrorLogger } from "@/components/ErrorLogger";
import { CookieConsent } from "@/components/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jobsparkai.com'),
  title: {
    default: 'JobSpark AI - AI-Powered Resume Builder & Career Tools',
    template: '%s | JobSpark AI'
  },
  description: 'Create professional, ATS-optimized resumes in minutes with AI. JobSpark AI analyzes your CV, provides real-time feedback, and helps you land your dream job. Free resume builder with AI-powered suggestions.',
  keywords: ['resume builder', 'AI resume', 'CV builder', 'ATS optimization', 'job application', 'career tools', 'professional resume', 'resume templates', 'AI career assistant'],
  authors: [{ name: 'JobSpark AI' }],
  creator: 'JobSpark AI',
  publisher: 'JobSpark AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://jobsparkai.com',
    siteName: 'JobSpark AI',
    title: 'JobSpark AI - AI-Powered Resume Builder & Career Tools',
    description: 'Create professional, ATS-optimized resumes in minutes with AI. Get real-time feedback and land your dream job.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'JobSpark AI - AI-Powered Resume Builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobSpark AI - AI-Powered Resume Builder',
    description: 'Create professional, ATS-optimized resumes in minutes with AI.',
    images: ['/og-image.png'],
    creator: '@jobsparkai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '2MLt_KBd3knfO5ym26bnH0W8m87Cwfk0rpSgngyefDU',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'JobSpark AI',
    description: 'AI-powered resume builder and career tools platform',
    url: 'https://jobsparkai.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://jobsparkai.com/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: 'JobSpark AI',
      url: 'https://jobsparkai.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://jobsparkai.com/favicon.svg'
      }
    }
  }

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'JobSpark AI',
    url: 'https://jobsparkai.com',
    logo: 'https://jobsparkai.com/favicon.svg',
    sameAs: [
      'https://twitter.com/jobsparkai',
      'https://linkedin.com/company/jobsparkai'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@jobsparkai.com',
      url: 'https://jobsparkai.com/contact'
    }
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorLogger />
        <PostHogProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </PostHogProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
