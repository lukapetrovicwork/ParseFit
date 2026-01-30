'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDate, getScoreColor, truncateText } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Trash2, ExternalLink, Loader2 } from 'lucide-react';

interface Scan {
  id: string;
  fileName: string;
  overallScore: number;
  keywordScore: number;
  createdAt: string;
  jobDescription: string;
}

interface ScanHistoryProps {
  scans: Scan[];
  onDelete: (id: string) => Promise<void>;
}

export function ScanHistory({ scans, onDelete }: ScanHistoryProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await onDelete(deleteId);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (scans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 text-center dark:border-gray-700">
        <FileText className="mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No scans yet</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload your resume to get your first ATS analysis
        </p>
        <Link href="/scan">
          <Button className="mt-4">Start New Scan</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {scans.map((scan) => (
          <Card key={scan.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <span className={`text-lg font-bold ${getScoreColor(scan.overallScore)}`}>
                      {scan.overallScore}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium">{scan.fileName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(scan.createdAt)} • Keywords: {scan.keywordScore}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      scan.overallScore >= 80
                        ? 'success'
                        : scan.overallScore >= 60
                        ? 'warning'
                        : 'error'
                    }
                  >
                    {scan.overallScore >= 80 ? 'Excellent' : scan.overallScore >= 60 ? 'Good' : 'Needs Work'}
                  </Badge>
                  <Link href={`/scan/${scan.id}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-1 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(scan.id)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {scan.jobDescription && (
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  Job: {truncateText(scan.jobDescription, 100)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
