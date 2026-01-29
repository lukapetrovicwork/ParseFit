import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
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
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
