'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScanHistory } from '@/components/scan-history';
import { LoadingPage } from '@/components/loading';
import { useToast } from '@/components/ui/use-toast';
import { FileSearch, TrendingUp, Clock, Target } from 'lucide-react';
import { AdBanner } from '@/components/ads';

interface DashboardData {
  subscription: {
    tier: string;
    scansUsed: number;
    scansLimit: number;
  };
  recentScans: Array<{
    id: string;
    fileName: string;
    overallScore: number;
    keywordScore: number;
    createdAt: string;
    jobDescription: string;
  }>;
  stats: {
    totalScans: number;
    averageScore: number;
    improvement: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [subscriptionRes, scansRes] = await Promise.all([
        fetch('/api/subscription'),
        fetch('/api/scans?limit=5'),
      ]);

      const subscription = await subscriptionRes.json();
      const scansData = await scansRes.json();

      const scans = scansData.scans || [];
      const totalScans = scansData.totalCount || 0;
      const averageScore = scans.length > 0
        ? Math.round(scans.reduce((sum: number, s: { overallScore: number }) => sum + s.overallScore, 0) / scans.length)
        : 0;

      let improvement = 0;
      if (scans.length >= 2) {
        improvement = scans[0].overallScore - scans[scans.length - 1].overallScore;
      }

      setData({
        subscription,
        recentScans: scans,
        stats: {
          totalScans,
          averageScore,
          improvement,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

      setData((prev) =>
        prev
          ? {
              ...prev,
              recentScans: prev.recentScans.filter((s) => s.id !== id),
              stats: {
                ...prev.stats,
                totalScans: prev.stats.totalScans - 1,
              },
            }
          : null
      );

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

  if (!data) {
    return (
      <div className="text-center">
        <p>Failed to load dashboard data.</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const isPro = data.subscription.tier === 'PRO';
  const scansUsedPercentage = isPro
    ? 0
    : (data.subscription.scansUsed / data.subscription.scansLimit) * 100;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Welcome back! Here&apos;s your resume scanning overview.</p>
        </div>
        <Link href="/scan">
          <Button className="gap-2">
            <FileSearch className="h-4 w-4" />
            New Scan
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Scans This Month
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.subscription.scansUsed}
              {!isPro && (
                <span className="text-sm font-normal text-gray-500">
                  /{data.subscription.scansLimit}
                </span>
              )}
            </div>
            {!isPro && (
              <Progress value={scansUsedPercentage} className="mt-2 h-1" />
            )}
            {!isPro && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <Link href="/settings" className="text-primary hover:underline">
                  Upgrade to Pro
                </Link>{' '}
                for unlimited scans
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Scans
            </CardTitle>
            <FileSearch className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalScans}</div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">All-time scans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Average Score
            </CardTitle>
            <Target className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.averageScore}</div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Improvement
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.stats.improvement >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {data.stats.improvement >= 0 ? '+' : ''}
              {data.stats.improvement}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Since first scan</p>
          </CardContent>
        </Card>
      </div>

      {/* Ad banner for free users */}
      {!isPro && (
        <div className="my-4">
          <AdBanner slot="YOUR_DASHBOARD_AD_SLOT" format="horizontal" />
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Scans</h2>
          {data.stats.totalScans > 5 && (
            <Link href="/history">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          )}
        </div>
        <ScanHistory scans={data.recentScans} onDelete={handleDeleteScan} />
      </div>
    </div>
  );
}
