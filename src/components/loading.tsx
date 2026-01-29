'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function Loading({ size = 'md', text, className }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Loading size="lg" text="Loading..." />
    </div>
  );
}

export function LoadingScan() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <div className="relative">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-primary/20" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="font-medium">Analyzing your resume...</h3>
        <p className="mt-1 text-sm text-gray-500">This may take a few moments</p>
      </div>
      <div className="mt-4 space-y-2 text-center text-xs text-gray-400">
        <p>Parsing document...</p>
        <p>Extracting keywords...</p>
        <p>Calculating ATS score...</p>
        <p>Generating suggestions...</p>
      </div>
    </div>
  );
}
