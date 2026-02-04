import { SignUp } from '@clerk/nextjs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - Start Your Free ATS Resume Scan',
  description: 'Create a free ParseFit account to scan your resume for ATS compatibility. Get 3 free scans per month with instant feedback and keyword analysis.',
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg',
          },
        }}
      />
    </div>
  );
}
