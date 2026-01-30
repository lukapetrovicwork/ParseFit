'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Sparkles, FileText, Target, Zap } from 'lucide-react';
import Link from 'next/link';
import { AdBanner } from '@/components/ads';

interface ProUpgradePromptProps {
  optimizedCount: number;
  keywordsToAdd: number;
}

export function ProUpgradePrompt({ optimizedCount, keywordsToAdd }: ProUpgradePromptProps) {
  return (
    <div className="relative">
      {/* Blurred preview background */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <div className="blur-sm opacity-50 p-6 space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mt-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>

      {/* Overlay content */}
      <Card className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-2 border-primary/20">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Unlock Resume Optimization
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
            Upgrade to Pro to download an ATS-optimized version of your resume with
            AI-enhanced bullet points and keyword improvements.
          </p>

          {/* Preview stats */}
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {optimizedCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Bullets to Optimize
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {keywordsToAdd}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Keywords to Add
              </div>
            </div>
          </div>

          {/* Features list */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left max-w-sm mx-auto">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Pro Optimization Features
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <FileText className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Download optimized PDF resume
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Target className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                AI-rewritten bullet points for impact
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Zap className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Missing keywords auto-injected
              </li>
            </ul>
          </div>

          <Link href="/settings">
            <Button size="lg" className="w-full max-w-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
          </Link>

          {/* Ad banner for free users */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <AdBanner slot="YOUR_AD_SLOT_ID" format="horizontal" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
