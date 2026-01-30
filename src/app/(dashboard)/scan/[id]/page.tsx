'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScoreDisplay } from '@/components/score-display';
import { KeywordsDisplay } from '@/components/keywords-display';
import { FeedbackDisplay } from '@/components/feedback-display';
import { OptimizationDisplay } from '@/components/optimization';
import { LoadingPage } from '@/components/loading';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, FileSearch, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ATSScore, FormattingIssue, SectionAnalysis, BulletAnalysis, Suggestion } from '@/types';

interface ScanData {
  id: string;
  fileName: string;
  fileType: string;
  jobDescription: string;
  score: ATSScore;
  missingKeywords: string[];
  foundKeywords: string[];
  formattingIssues: FormattingIssue[];
  sectionAnalysis: SectionAnalysis[];
  bulletAnalysis: BulletAnalysis[];
  suggestions: Suggestion[];
  createdAt: string;
}

export default function ScanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [scan, setScan] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchScan();
  }, [params.id]);

  const fetchScan = async () => {
    try {
      const response = await fetch(`/api/scans/${params.id}`);

      if (!response.ok) {
        throw new Error('Scan not found');
      }

      const data = await response.json();
      setScan(data);
    } catch (error) {
      console.error('Error fetching scan:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scan details',
        variant: 'destructive',
      });
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/scans/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete scan');
      }

      toast({
        title: 'Success',
        description: 'Scan deleted successfully',
      });

      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete scan',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!scan) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Scan Not Found</h1>
        <p className="mt-2 text-gray-600">
          The scan you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Link href="/dashboard">
          <Button className="mt-4">Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const keywordMatches = [
    ...scan.foundKeywords.map((kw) => ({
      keyword: kw,
      found: true,
      category: 'other' as const,
      frequency: 1,
    })),
    ...scan.missingKeywords.map((kw) => ({
      keyword: kw,
      found: false,
      category: 'other' as const,
      frequency: 0,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{scan.fileName}</h1>
            <p className="text-gray-600">Scanned {formatDate(scan.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/scan">
            <Button variant="outline" className="gap-2">
              <FileSearch className="h-4 w-4" />
              New Scan
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
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
          <ScoreDisplay score={scan.score} />
        </TabsContent>

        <TabsContent value="keywords">
          <KeywordsDisplay
            matches={keywordMatches}
            foundKeywords={scan.foundKeywords}
            missingKeywords={scan.missingKeywords}
          />
        </TabsContent>

        <TabsContent value="feedback">
          <FeedbackDisplay
            formattingIssues={scan.formattingIssues}
            sectionAnalysis={scan.sectionAnalysis}
            bulletAnalysis={scan.bulletAnalysis}
            suggestions={[]}
          />
        </TabsContent>

        <TabsContent value="suggestions">
          <FeedbackDisplay
            formattingIssues={[]}
            sectionAnalysis={[]}
            bulletAnalysis={[]}
            suggestions={scan.suggestions}
          />
        </TabsContent>

        <TabsContent value="optimize">
          <OptimizationDisplay scanId={scan.id} />
        </TabsContent>
      </Tabs>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
