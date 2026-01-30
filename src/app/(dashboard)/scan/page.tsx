'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResumeUpload } from '@/components/resume-upload';
import { JobDescriptionInput } from '@/components/job-description-input';
import { ScoreDisplay } from '@/components/score-display';
import { KeywordsDisplay } from '@/components/keywords-display';
import { FeedbackDisplay } from '@/components/feedback-display';
import { OptimizationDisplay } from '@/components/optimization';
import { LoadingScan } from '@/components/loading';
import { useToast } from '@/components/ui/use-toast';
import { FileSearch, Loader2, Lock } from 'lucide-react';
import { ATSScore, KeywordMatch, FormattingIssue, SectionAnalysis, BulletAnalysis, Suggestion } from '@/types';

interface ScanResult {
  id: string;
  score: ATSScore;
  keywordMatches: KeywordMatch[];
  missingKeywords: string[];
  foundKeywords: string[];
  formattingIssues: FormattingIssue[];
  sectionAnalysis: SectionAnalysis[];
  bulletAnalysis: BulletAnalysis[];
  suggestions: Suggestion[];
}

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleScan = async () => {
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please upload a resume file',
        variant: 'destructive',
      });
      return;
    }

    if (jobDescription.trim().length < 50) {
      toast({
        title: 'Error',
        description: 'Please enter a job description (at least 50 characters)',
        variant: 'destructive',
      });
      return;
    }

    setIsScanning(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', jobDescription);

      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: 'Scan Limit Reached',
            description: data.message || 'Upgrade to Pro for unlimited scans',
            variant: 'destructive',
          });
          return;
        }
        throw new Error(data.error || 'Failed to scan resume');
      }

      setResult(data);

      toast({
        title: 'Scan Complete',
        description: `Your ATS score is ${data.score.overall}/100`,
      });
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to scan resume',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setJobDescription('');
    setResult(null);
  };

  if (isScanning) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-12">
            <LoadingScan />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scan Results</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {file?.name} • Scanned just now
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              New Scan
            </Button>
            <Button onClick={() => router.push(`/scan/${result.id}`)}>
              View Full Report
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="optimize" className="gap-1">
              Optimize
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ScoreDisplay score={result.score} />
          </TabsContent>

          <TabsContent value="keywords">
            <KeywordsDisplay
              matches={result.keywordMatches}
              foundKeywords={result.foundKeywords}
              missingKeywords={result.missingKeywords}
            />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackDisplay
              formattingIssues={result.formattingIssues}
              sectionAnalysis={result.sectionAnalysis}
              bulletAnalysis={result.bulletAnalysis}
              suggestions={[]}
            />
          </TabsContent>

          <TabsContent value="suggestions">
            <FeedbackDisplay
              formattingIssues={[]}
              sectionAnalysis={[]}
              bulletAnalysis={[]}
              suggestions={result.suggestions}
            />
          </TabsContent>

          <TabsContent value="optimize">
            <OptimizationDisplay scanId={result.id} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scan Your Resume</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Upload your resume and paste the job description to get your ATS compatibility score
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Resume</CardTitle>
          <CardDescription>
            Support for PDF and DOCX files up to 10MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResumeUpload
            onFileSelect={setFile}
            selectedFile={file}
            onRemove={() => setFile(null)}
            disabled={isScanning}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job Description</CardTitle>
          <CardDescription>
            Paste the complete job posting for accurate keyword analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JobDescriptionInput
            value={jobDescription}
            onChange={setJobDescription}
            disabled={isScanning}
          />
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleScan}
          disabled={!file || jobDescription.length < 50 || isScanning}
          className="gap-2"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <FileSearch className="h-5 w-5" />
              Analyze Resume
            </>
          )}
        </Button>
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Your resume is processed securely and never stored on our servers.</p>
      </div>
    </div>
  );
}
