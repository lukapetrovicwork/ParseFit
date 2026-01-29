'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { PLANS } from '@/lib/stripe';

interface PricingProps {
  currentPlan?: 'FREE' | 'PRO';
  onSubscribe?: () => Promise<void>;
  onManage?: () => Promise<void>;
}

export function Pricing({ currentPlan = 'FREE', onSubscribe, onManage }: PricingProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    setIsLoading(true);
    try {
      if (currentPlan === 'PRO' && onManage) {
        await onManage();
      } else if (onSubscribe) {
        await onSubscribe();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className={currentPlan === 'FREE' ? 'border-2 border-primary' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Free</CardTitle>
            {currentPlan === 'FREE' && <Badge>Current Plan</Badge>}
          </div>
          <CardDescription>Get started with basic ATS scanning</CardDescription>
          <div className="pt-4">
            <span className="text-4xl font-bold">$0</span>
            <span className="text-gray-500">/month</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {PLANS.FREE.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          {currentPlan === 'FREE' && (
            <Button className="mt-6 w-full" variant="outline" disabled>
              Current Plan
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className={currentPlan === 'PRO' ? 'border-2 border-primary' : 'border-2 border-primary/50'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pro</CardTitle>
            {currentPlan === 'PRO' ? (
              <Badge>Current Plan</Badge>
            ) : (
              <Badge variant="secondary">Recommended</Badge>
            )}
          </div>
          <CardDescription>Unlimited scans with advanced features</CardDescription>
          <div className="pt-4">
            <span className="text-4xl font-bold">${PLANS.PRO.price}</span>
            <span className="text-gray-500">/month</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {PLANS.PRO.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          <Button className="mt-6 w-full" onClick={handleAction} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentPlan === 'PRO' ? 'Manage Subscription' : 'Upgrade to Pro'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
