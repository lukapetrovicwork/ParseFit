'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProUpgradePrompt } from './pro-upgrade-prompt';
import { useToast } from '@/components/ui/use-toast';
import {
  Download,
  Loader2,
  ArrowRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { SectionType } from '@/types';

interface OptimizedBullet {
  original: string;
  optimized: string;
  section: SectionType;
}

interface OptimizationPreview {
  optimizedBullets: OptimizedBullet[];
  keywordsToAdd: string[];
  totalImprovements: number;
}

interface OptimizationDisplayProps {
  scanId: string;
}

export function OptimizationDisplay({ scanId }: OptimizationDisplayProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [preview, setPreview] = useState<OptimizationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreview();
  }, [scanId]);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/optimize/${scanId}`);

      if (!response.ok) {
        throw new Error('Failed to load optimization preview');
      }

      const data = await response.json();
      setPreview(data.preview);
      setIsPro(data.isPro);
    } catch (err) {
      setError('Failed to load optimization preview');
      console.error('Error fetching preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(`/api/optimize/${scanId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate document');
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'optimized_resume.pdf';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Download Started',
        description: 'Your optimized resume is downloading.',
      });
    } catch (err) {
      console.error('Download error:', err);
      toast({
        title: 'Download Failed',
        description: err instanceof Error ? err.message : 'Failed to download optimized resume',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
          <Button variant="outline" onClick={fetchPreview} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!preview) {
    return null;
  }

  // Show upgrade prompt for free users
  if (!isPro) {
    return (
      <ProUpgradePrompt
        optimizedCount={preview.optimizedBullets.length}
        keywordsToAdd={preview.keywordsToAdd.length}
      />
    );
  }

  // Show optimization preview and download for Pro users
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Resume Optimization Ready
              </CardTitle>
              <CardDescription>
                Download your ATS-optimized resume with {preview.totalImprovements} improvements
              </CardDescription>
            </div>
            <Button onClick={handleDownload} disabled={downloading}>
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {preview.optimizedBullets.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Bullet Points Optimized
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {preview.keywordsToAdd.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Keywords Added
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimized Bullets Preview */}
      {preview.optimizedBullets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bullet Point Improvements</CardTitle>
            <CardDescription>
              These bullets have been rewritten for better ATS compatibility and impact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview.optimizedBullets.slice(0, 5).map((bullet, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <Badge variant="secondary" className="mb-2">
                  {bullet.section}
                </Badge>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 font-medium text-sm shrink-0">Before:</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-through">
                      {bullet.original}
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 font-medium text-sm shrink-0">After:</span>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {bullet.optimized}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {preview.optimizedBullets.length > 5 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                +{preview.optimizedBullets.length - 5} more improvements in the downloaded document
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Keywords to Add */}
      {preview.keywordsToAdd.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Keywords Added to Skills</CardTitle>
            <CardDescription>
              These missing keywords will be added to your Skills section
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {preview.keywordsToAdd.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="flex items-center gap-1 border-green-500 text-green-600 dark:text-green-400"
                >
                  <CheckCircle className="w-3 h-3" />
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Download CTA */}
      <div className="text-center py-4">
        <Button size="lg" onClick={handleDownload} disabled={downloading}>
          {downloading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Document...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download Optimized Resume
            </>
          )}
        </Button>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Downloads as PDF format
        </p>
      </div>
    </div>
  );
}
