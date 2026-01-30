'use client';

import { useEffect, useState } from 'react';
import { ScanHistory } from '@/components/scan-history';
import { LoadingPage } from '@/components/loading';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDate } from '@/lib/utils';

interface Scan {
  id: string;
  fileName: string;
  overallScore: number;
  keywordScore: number;
  createdAt: string;
  jobDescription: string;
}

export default function HistoryPage() {
  const { toast } = useToast();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const currentOffset = loadMore ? offset : 0;
      const response = await fetch(`/api/scans?limit=20&offset=${currentOffset}`);
      const data = await response.json();

      if (loadMore) {
        setScans((prev) => [...prev, ...data.scans]);
      } else {
        setScans(data.scans);
      }

      setHasMore(data.hasMore);
      setOffset(currentOffset + data.scans.length);
    } catch (error) {
      console.error('Error fetching scans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scan history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleDeleteScan = async (id: string) => {
    try {
      const response = await fetch(`/api/scans/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete scan');
      }

      setScans((prev) => prev.filter((s) => s.id !== id));

      toast({
        title: 'Success',
        description: 'Scan deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete scan',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  const chartData = scans
    .slice()
    .reverse()
    .map((scan) => ({
      date: formatDate(scan.createdAt),
      score: scan.overallScore,
      keywords: scan.keywordScore,
    }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scan History</h1>
        <p className="text-gray-600 dark:text-gray-300">View and manage your resume scan history</p>
      </div>

      {scans.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis domain={[0, 100]} fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Overall Score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="keywords"
                    name="Keyword Score"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">All Scans</h2>
        <ScanHistory scans={scans} onDelete={handleDeleteScan} />

        {hasMore && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => fetchScans(true)} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
