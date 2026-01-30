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
} from 'lucide-react';

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
