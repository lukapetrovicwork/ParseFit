import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  FileSearch,
  Target,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  FileText,
  Search,
  Bot,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How ATS Resume Scanning Works - Complete Guide',
  description:
    'Learn how Applicant Tracking Systems (ATS) scan and filter resumes. Understand keyword matching, formatting requirements, and how to optimize your resume to pass ATS filters.',
  alternates: {
    canonical: '/how-it-works',
  },
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            How ATS Resume Scanning Works
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Understanding Applicant Tracking Systems is the key to getting your
            resume seen by hiring managers. Here&apos;s everything you need to know.
          </p>
        </div>

        {/* What is ATS Section */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              What is an ATS?
            </h2>
          </div>
          <div className="prose prose-gray max-w-none dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-300">
              An <strong>Applicant Tracking System (ATS)</strong> is software used by
              employers to collect, sort, scan, and rank job applications. Over 98% of
              Fortune 500 companies use an ATS, and about 75% of resumes are rejected
              by ATS before a human ever sees them.
            </p>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Popular ATS systems include Workday, Taleo, Greenhouse, Lever, and iCIMS.
              Each has different parsing algorithms, but they all look for similar things:
              relevant keywords, proper formatting, and clear section organization.
            </p>
          </div>
        </section>

        {/* How ATS Works Section */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Search className="h-6 w-6 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              How ATS Scans Your Resume
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  1
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Parsing
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                The ATS extracts text from your resume and breaks it into sections:
                contact info, work experience, education, skills, etc. Complex
                formatting like tables, columns, and graphics can break parsing.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  2
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Keyword Matching
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                The system compares your resume against the job description, looking
                for matching skills, job titles, certifications, and industry terms.
                Missing keywords can eliminate you from consideration.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  3
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Scoring
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Based on keyword matches and other factors, the ATS assigns a score
                to your application. Only top-scoring resumes get forwarded to
                recruiters for human review.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  4
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Ranking
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Recruiters see candidates ranked by match percentage. If you score
                below the threshold, your resume may never be seen regardless of
                your qualifications.
              </p>
            </div>
          </div>
        </section>

        {/* Keywords Section */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <Target className="h-6 w-6 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              The Importance of Resume Keywords
            </h2>
          </div>
          <div className="prose prose-gray max-w-none dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-300">
              Keywords are the specific terms and phrases that describe the skills,
              qualifications, and experience required for a job. They fall into
              several categories:
            </p>
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                Hard Skills
              </h3>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                Technical abilities: Python, JavaScript, SQL, Adobe Photoshop, SEO,
                Data Analysis, Project Management, etc.
              </p>
            </div>
            <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4 dark:bg-green-900/20">
              <h3 className="font-semibold text-green-900 dark:text-green-300">
                Soft Skills
              </h3>
              <p className="mt-1 text-sm text-green-800 dark:text-green-200">
                Interpersonal abilities: Leadership, Communication, Problem-solving,
                Teamwork, Time Management, Critical Thinking, etc.
              </p>
            </div>
            <div className="rounded-lg border-l-4 border-purple-500 bg-purple-50 p-4 dark:bg-purple-900/20">
              <h3 className="font-semibold text-purple-900 dark:text-purple-300">
                Industry Terms
              </h3>
              <p className="mt-1 text-sm text-purple-800 dark:text-purple-200">
                Field-specific language: Agile, HIPAA, GAAP, KPIs, CRM, B2B, SaaS,
                ROI, compliance terminology, etc.
              </p>
            </div>
            <div className="rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4 dark:bg-orange-900/20">
              <h3 className="font-semibold text-orange-900 dark:text-orange-300">
                Certifications & Tools
              </h3>
              <p className="mt-1 text-sm text-orange-800 dark:text-orange-200">
                Credentials: PMP, CPA, AWS Certified, Google Analytics, Salesforce,
                HubSpot, Microsoft Office, etc.
              </p>
            </div>
          </div>
        </section>

        {/* Common Mistakes Section */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Common ATS Mistakes to Avoid
            </h2>
          </div>
          <div className="grid gap-4">
            {[
              {
                mistake: 'Using tables, columns, or text boxes',
                fix: 'Use a single-column layout with clear section headings',
              },
              {
                mistake: 'Submitting in incompatible formats',
                fix: 'Use .docx or .pdf files (check the job posting requirements)',
              },
              {
                mistake: 'Using headers and footers for contact info',
                fix: 'Place all contact information in the main body of the resume',
              },
              {
                mistake: 'Using images, icons, or graphics',
                fix: 'Stick to text-only formatting; ATS cannot read images',
              },
              {
                mistake: 'Using creative section headings',
                fix: 'Use standard headings: "Experience," "Education," "Skills"',
              },
              {
                mistake: 'Not including keywords from the job posting',
                fix: 'Mirror the exact language used in the job description',
              },
              {
                mistake: 'Using abbreviations without spelling them out',
                fix: 'Include both: "Search Engine Optimization (SEO)"',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex gap-4 rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex-shrink-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.mistake}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium text-green-600 dark:text-green-400">
                      Fix:
                    </span>{' '}
                    {item.fix}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How ParseFit Helps Section */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              How ParseFit Helps You Beat the ATS
            </h2>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-8 dark:border-gray-700">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Instant ATS Score
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    See how your resume scores against ATS algorithms before you apply
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Keyword Analysis
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Identify missing keywords from the job description
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Format Checking
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Detect formatting issues that break ATS parsing
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    AI-Powered Suggestions
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Get actionable tips to improve your resume content
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-xl bg-primary px-8 py-12 text-center text-white">
          <h2 className="text-2xl font-bold">Ready to Optimize Your Resume?</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90">
            Upload your resume and a job description to get instant feedback on your
            ATS compatibility score.
          </p>
          <Link href="/sign-up" className="mt-6 inline-block">
            <Button size="lg" variant="secondary" className="gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t bg-white px-4 py-8 sm:px-6 lg:px-8 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} ParseFit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
