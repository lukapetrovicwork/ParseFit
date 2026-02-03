'use client';

import { ATSScore } from '@/types';
import { cn, getScoreColor, getScoreLabel } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, FileText, Layout, Sparkles } from 'lucide-react';

interface ScoreDisplayProps {
  score: ATSScore;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-8">
        <div className="relative">
          <svg className="h-40 w-40" viewBox="0 0 100 100">
            <circle
              className="stroke-gray-200 dark:stroke-gray-700"
              strokeWidth="8"
              fill="transparent"
              r="42"
              cx="50"
              cy="50"
            />
            <circle
              className={cn(
                'transition-all duration-1000 ease-out',
                score.overall >= 80
                  ? 'stroke-green-500'
                  : score.overall >= 60
                  ? 'stroke-yellow-500'
                  : score.overall >= 40
                  ? 'stroke-orange-500'
                  : 'stroke-red-500'
              )}
              strokeWidth="8"
              strokeLinecap="round"
              fill="transparent"
              r="42"
              cx="50"
              cy="50"
              style={{
                strokeDasharray: `${2 * Math.PI * 42}`,
                strokeDashoffset: `${2 * Math.PI * 42 * (1 - score.overall / 100)}`,
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-4xl font-bold', getScoreColor(score.overall))}>
              {score.overall}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">out of 100</span>
          </div>
        </div>
        <p className={cn('mt-4 text-lg font-medium', getScoreColor(score.overall))}>
          {getScoreLabel(score.overall)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ScoreCard
          title="Keyword Match"
          score={score.keyword}
          icon={Target}
          description="Skills & requirements coverage"
        />
        <ScoreCard
          title="Formatting"
          score={score.formatting}
          icon={Layout}
          description="ATS-friendly structure"
        />
        <ScoreCard
          title="Sections"
          score={score.section}
          icon={FileText}
          description="Required sections coverage"
        />
        <ScoreCard
          title="Similarity"
          score={score.similarity}
          icon={Sparkles}
          description="Content relevance to job"
        />
      </div>
    </div>
  );
}

interface ScoreCardProps {
  title: string;
  score: number;
  icon: React.ElementType;
  description: string;
}

function ScoreCard({ title, score, icon: Icon, description }: ScoreCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <span className={cn('text-lg font-bold', getScoreColor(score))}>{score}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress
          value={score}
          className="h-2"
          indicatorClassName={cn(
            score >= 80
              ? 'bg-green-500'
              : score >= 60
              ? 'bg-yellow-500'
              : score >= 40
              ? 'bg-orange-500'
              : 'bg-red-500'
          )}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
}
