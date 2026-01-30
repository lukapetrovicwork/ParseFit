'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Pricing } from '@/components/pricing';
import { LoadingPage } from '@/components/loading';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { FREE_SCAN_LIMIT } from '@/lib/utils';

interface Subscription {
  tier: 'FREE' | 'PRO';
  status: string;
  scansUsed: number;
  scansLimit: number;
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({
        title: 'Welcome to Pro!',
        description: 'Your subscription is now active. Enjoy unlimited scans!',
      });
      fetchSubscription();
    }

    if (searchParams.get('canceled') === 'true') {
      toast({
        title: 'Checkout Canceled',
        description: 'Your checkout was canceled. No charges were made.',
      });
    }
  }, [searchParams, toast]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription');
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout' }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'portal' }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        title: 'Error',
        description: 'Failed to open billing portal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!isLoaded || loading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your account and subscription</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-gray-900 dark:text-white">
                {user?.emailAddresses[0]?.emailAddress || 'Not available'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</p>
              <p className="text-gray-900 dark:text-white">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Not available'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {subscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Your current plan and usage</CardDescription>
              </div>
              <Badge variant={subscription.tier === 'PRO' ? 'default' : 'secondary'}>
                {subscription.tier}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Scans This Month</p>
                <p className="text-gray-900 dark:text-white">
                  {subscription.scansUsed}
                  {subscription.tier === 'FREE' && ` / ${FREE_SCAN_LIMIT}`}
                  {subscription.tier === 'PRO' && ' (Unlimited)'}
                </p>
              </div>
            </div>
            {subscription.tier === 'PRO' && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-gray-900 capitalize">{subscription.status.toLowerCase()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Plans</h2>
        <Pricing
          currentPlan={subscription?.tier || 'FREE'}
          onSubscribe={handleSubscribe}
          onManage={handleManageSubscription}
        />
      </div>
    </div>
  );
}
