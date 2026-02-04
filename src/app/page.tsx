import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import {
  FileSearch,
  Target,
  Lightbulb,
  Zap,
  CheckCircle2,
  ArrowRight,
  Star,
  ChevronDown,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ParseFit - Free ATS Resume Scanner & Optimizer | Beat Applicant Tracking Systems',
  description:
    'Get your resume past Applicant Tracking Systems with ParseFit. Upload your resume and job description to receive instant ATS compatibility scoring, missing keywords analysis, and AI-powered suggestions to land more interviews.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <Header />

      <main>
        <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Star className="h-4 w-4" />
              Trusted by 10,000+ job seekers
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
              Get Your Resume Past{' '}
              <span className="text-primary">ATS Systems</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Upload your resume and job description to instantly see your ATS
              compatibility score, missing keywords, and get actionable suggestions
              to land more interviews.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <SignedIn>
                <Link href="/scan">
                  <Button size="lg" className="gap-2">
                    <FileSearch className="h-5 w-5" />
                    Scan Your Resume
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </SignedIn>

              <SignedOut>
                <Link href="/sign-up">
                  <Button size="lg" className="gap-2">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </SignedOut>
            </div>

            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Free tier includes 3 scans per month. No credit card required.
            </p>
          </div>
        </section>

        <section className="border-y bg-white px-4 py-16 sm:px-6 lg:px-8 dark:bg-gray-900 dark:border-gray-800">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
              Everything You Need to Beat the ATS
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600 dark:text-gray-300">
              Our comprehensive analysis helps you optimize every aspect of your
              resume for maximum ATS compatibility.
            </p>

            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={Target}
                title="Keyword Analysis"
                description="Identify missing skills and keywords from the job description that should be in your resume."
              />
              <FeatureCard
                icon={FileSearch}
                title="ATS Scoring"
                description="Get an instant compatibility score and see exactly how ATS systems will parse your resume."
              />
              <FeatureCard
                icon={Lightbulb}
                title="Smart Suggestions"
                description="Receive AI-powered suggestions to improve bullet points and strengthen action verbs."
              />
              <FeatureCard
                icon={Zap}
                title="Format Check"
                description="Detect formatting issues like tables, images, and columns that confuse ATS systems."
              />
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
              How It Works
            </h2>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <StepCard
                step={1}
                title="Upload Your Resume"
                description="Drag and drop your PDF or DOCX resume file. We support all standard formats."
              />
              <StepCard
                step={2}
                title="Paste Job Description"
                description="Copy and paste the full job posting you're applying for."
              />
              <StepCard
                step={3}
                title="Get Your Analysis"
                description="Receive instant feedback with your ATS score, missing keywords, and improvement tips."
              />
            </div>
          </div>
        </section>

        <section className="border-t bg-gray-50 px-4 py-16 sm:px-6 lg:px-8 dark:bg-gray-800 dark:border-gray-700">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
              What You Get
            </h2>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <BenefitItem text="ATS compatibility score (0-100)" />
              <BenefitItem text="Missing keywords list by category" />
              <BenefitItem text="Section-by-section analysis" />
              <BenefitItem text="Bullet point improvement suggestions" />
              <BenefitItem text="Formatting issue detection" />
              <BenefitItem text="Action verb recommendations" />
              <BenefitItem text="Resume length optimization tips" />
              <BenefitItem text="Skill insertion suggestions" />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-t px-4 py-16 sm:px-6 lg:px-8 dark:border-gray-700">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600 dark:text-gray-300">
              Everything you need to know about ATS resume scanning
            </p>

            <div className="mt-12 space-y-4">
              <FAQItem
                question="What is an ATS and why does it matter?"
                answer="An Applicant Tracking System (ATS) is software used by employers to filter and rank job applications. Over 98% of Fortune 500 companies use an ATS, and about 75% of resumes are rejected before a human ever sees them. Optimizing your resume for ATS is crucial to getting past this first screening."
              />
              <FAQItem
                question="How does ParseFit scan my resume?"
                answer="ParseFit analyzes your resume against the job description you provide. We extract keywords, check formatting compatibility, evaluate section structure, and compare your skills against job requirements. Our AI then provides a compatibility score and actionable suggestions to improve your resume."
              />
              <FAQItem
                question="What file formats are supported?"
                answer="We support PDF and DOCX file formats, which are the most commonly accepted formats by ATS systems. We recommend using a simple, clean format without tables, columns, or graphics for best results."
              />
              <FAQItem
                question="Is my resume data secure?"
                answer="Yes, your privacy is our priority. Your resume is processed securely and we do not store your resume content after analysis. All data transmission is encrypted using industry-standard protocols."
              />
              <FAQItem
                question="How many free scans do I get?"
                answer="Free accounts include 3 resume scans per month. This resets at the beginning of each month. For unlimited scans and additional features, you can upgrade to our Pro plan."
              />
              <FAQItem
                question="What makes a good ATS score?"
                answer="A score of 80 or above is generally considered good and means your resume is well-optimized for the job. Scores between 60-80 indicate room for improvement, while scores below 60 suggest significant changes are needed to pass ATS filters."
              />
            </div>
          </div>
        </section>

        {/* FAQ Schema for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is an ATS and why does it matter?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'An Applicant Tracking System (ATS) is software used by employers to filter and rank job applications. Over 98% of Fortune 500 companies use an ATS, and about 75% of resumes are rejected before a human ever sees them. Optimizing your resume for ATS is crucial to getting past this first screening.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How does ParseFit scan my resume?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'ParseFit analyzes your resume against the job description you provide. We extract keywords, check formatting compatibility, evaluate section structure, and compare your skills against job requirements. Our AI then provides a compatibility score and actionable suggestions to improve your resume.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What file formats are supported?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'We support PDF and DOCX file formats, which are the most commonly accepted formats by ATS systems. We recommend using a simple, clean format without tables, columns, or graphics for best results.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is my resume data secure?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, your privacy is our priority. Your resume is processed securely and we do not store your resume content after analysis. All data transmission is encrypted using industry-standard protocols.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How many free scans do I get?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Free accounts include 3 resume scans per month. This resets at the beginning of each month. For unlimited scans and additional features, you can upgrade to our Pro plan.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What makes a good ATS score?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'A score of 80 or above is generally considered good and means your resume is well-optimized for the job. Scores between 60-80 indicate room for improvement, while scores below 60 suggest significant changes are needed to pass ATS filters.',
                  },
                },
              ],
            }),
          }}
        />

        {/* CTA Section */}
        <section className="border-t px-4 py-16 sm:px-6 lg:px-8 dark:border-gray-700">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Ready to Land More Interviews?
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Join thousands of job seekers who have improved their resumes with
              ParseFit.
            </p>

            <div className="mt-8">
              <SignedIn>
                <Link href="/scan">
                  <Button size="lg" className="gap-2">
                    <FileSearch className="h-5 w-5" />
                    Start Scanning
                  </Button>
                </Link>
              </SignedIn>

              <SignedOut>
                <Link href="/sign-up">
                  <Button size="lg" className="gap-2">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </SignedOut>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white px-4 py-8 sm:px-6 lg:px-8 dark:bg-gray-900 dark:border-gray-800">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} ParseFit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
        {step}
      </div>
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900 dark:shadow-gray-900/50">
      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
      <span className="font-medium text-gray-900 dark:text-white">{text}</span>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <summary className="flex cursor-pointer items-center justify-between font-medium text-gray-900 dark:text-white">
        {question}
        <ChevronDown className="h-5 w-5 text-gray-500 transition-transform group-open:rotate-180" />
      </summary>
      <p className="mt-4 text-gray-600 dark:text-gray-300">{answer}</p>
    </details>
  );
}
