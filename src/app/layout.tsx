import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ParseFit - Optimize Your Resume for ATS',
  description:
    'Get your resume past Applicant Tracking Systems. Upload your resume and job description to receive instant ATS compatibility scoring, missing keywords, and actionable improvement suggestions.',
  keywords: [
    'ATS scanner',
    'resume checker',
    'applicant tracking system',
    'resume optimization',
    'job application',
    'keyword matching',
    'resume analysis',
    'ParseFit',
  ],
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
        </body>
      </html>
    </ClerkProvider>
  );
}
