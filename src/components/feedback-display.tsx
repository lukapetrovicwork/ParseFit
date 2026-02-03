'use client';

import {
  FormattingIssue,
  SectionAnalysis,
  BulletAnalysis,
  Suggestion,
} from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  FileText,
  Type,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackDisplayProps {
  formattingIssues: FormattingIssue[];
  sectionAnalysis: SectionAnalysis[];
  bulletAnalysis: BulletAnalysis[];
  suggestions: Suggestion[];
}

export function FeedbackDisplay({
  formattingIssues,
  sectionAnalysis,
  bulletAnalysis,
  suggestions,
}: FeedbackDisplayProps) {
  return (
    <div className="space-y-6">
      {formattingIssues.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Type className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <CardTitle className="text-base">Formatting Issues</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {formattingIssues.map((issue, index) => (
              <div
                key={index}
                className={cn(
                  'rounded-lg border p-3',
                  issue.severity === 'error'
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30'
                    : issue.severity === 'warning'
                    ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/30'
                    : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30'
                )}
              >
                <div className="flex items-start gap-2">
                  {issue.severity === 'error' ? (
                    <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                  ) : issue.severity === 'warning' ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                  )}
                  <div>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        issue.severity === 'error'
                          ? 'text-red-800 dark:text-red-200'
                          : issue.severity === 'warning'
                          ? 'text-yellow-800 dark:text-yellow-200'
                          : 'text-blue-800 dark:text-blue-200'
                      )}
                    >
                      {issue.message}
                    </p>
                    <p
                      className={cn(
                        'mt-1 text-sm',
                        issue.severity === 'error'
                          ? 'text-red-600 dark:text-red-300'
                          : issue.severity === 'warning'
                          ? 'text-yellow-600 dark:text-yellow-300'
                          : 'text-blue-600 dark:text-blue-300'
                      )}
                    >
                      {issue.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <CardTitle className="text-base">Section Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sectionAnalysis.map((section) => (
            <div
              key={section.name}
              className={cn(
                'rounded-lg border p-3',
                section.found && section.score >= 70
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30'
                  : section.found && section.score >= 50
                  ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/30'
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {section.found ? (
                    section.score >= 70 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium capitalize">{section.name}</span>
                </div>
                {section.found && (
                  <Badge
                    variant={
                      section.score >= 70
                        ? 'success'
                        : section.score >= 50
                        ? 'warning'
                        : 'error'
                    }
                  >
                    {section.score}%
                  </Badge>
                )}
              </div>
              <p
                className={cn(
                  'mt-1 text-sm',
                  section.found && section.score >= 70
                    ? 'text-green-700 dark:text-green-300'
                    : section.found && section.score >= 50
                    ? 'text-yellow-700 dark:text-yellow-300'
                    : 'text-red-700 dark:text-red-300'
                )}
              >
                {section.feedback}
              </p>
              {section.suggestions.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {section.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="text-gray-400 dark:text-gray-500">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {bulletAnalysis.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <CardTitle className="text-base">Bullet Point Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {bulletAnalysis
              .filter((b) => b.score < 80)
              .slice(0, 5)
              .map((bullet, index) => (
                <div key={index} className="rounded-lg border bg-gray-50 p-3 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <Badge variant={bullet.score >= 70 ? 'success' : bullet.score >= 50 ? 'warning' : 'error'}>
                      Score: {bullet.score}
                    </Badge>
                    <span className="text-xs text-gray-500 capitalize dark:text-gray-400">{bullet.section}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">&ldquo;{bullet.text.substring(0, 100)}...&rdquo;</p>
                  {bullet.issues.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {bullet.issues.map((issue, idx) => (
                        <p key={idx} className="text-xs text-red-600 dark:text-red-400">
                          {issue.message}
                        </p>
                      ))}
                    </div>
                  )}
                  {bullet.rewriteSuggestion && (
                    <div className="mt-2 rounded bg-blue-50 p-2 dark:bg-blue-900/30">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Suggested rewrite:</p>
                      <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">{bullet.rewriteSuggestion}</p>
                    </div>
                  )}
                </div>
              ))}
            {bulletAnalysis.filter((b) => b.score < 80).length > 5 && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                And {bulletAnalysis.filter((b) => b.score < 80).length - 5} more bullets need improvement...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">Improvement Suggestions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={cn(
                  'rounded-lg border-l-4 p-4',
                  suggestion.priority === 'high'
                    ? 'border-l-red-500 bg-red-50 dark:bg-red-900/30'
                    : suggestion.priority === 'medium'
                    ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/30'
                    : 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{suggestion.title}</h4>
                  <Badge
                    variant={
                      suggestion.priority === 'high'
                        ? 'error'
                        : suggestion.priority === 'medium'
                        ? 'warning'
                        : 'secondary'
                    }
                  >
                    {suggestion.priority} priority
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{suggestion.description}</p>
                <ul className="mt-3 space-y-1">
                  {suggestion.actionItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400 dark:bg-gray-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
