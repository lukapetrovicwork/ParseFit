import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://parsefit.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'ParseFit - ATS Resume Scanner & Optimizer',
    template: '%s | ParseFit',
  },
  description:
    'Get your resume past Applicant Tracking Systems. Upload your resume and job description to receive instant ATS compatibility scoring, missing keywords, and actionable improvement suggestions.',
  keywords: [
    'ATS scanner',
    'ATS resume checker',
    'resume optimizer',
    'applicant tracking system',
    'resume optimization',
    'job application',
    'keyword matching',
    'resume analysis',
    'resume score',
    'ATS friendly resume',
    'resume keywords',
    'job search tools',
    'ParseFit',
  ],
  authors: [{ name: 'ParseFit' }],
  creator: 'ParseFit',
  publisher: 'ParseFit',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'ParseFit',
    title: 'ParseFit - ATS Resume Scanner & Optimizer',
    description:
      'Get your resume past Applicant Tracking Systems. Instant ATS scoring, keyword analysis, and actionable suggestions to land more interviews.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ParseFit - ATS Resume Scanner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ParseFit - ATS Resume Scanner & Optimizer',
    description:
      'Get your resume past Applicant Tracking Systems. Instant ATS scoring, keyword analysis, and actionable suggestions.',
    images: ['/og-image.png'],
    creator: '@parsefit',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32 48x48', type: 'image/x-icon' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {adsenseId && (
            <script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
              crossOrigin="anonymous"
            />
          )}
        </head>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
