'use client';

import { KeywordMatch } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface KeywordsDisplayProps {
  matches: KeywordMatch[];
  foundKeywords: string[];
  missingKeywords: string[];
}

export function KeywordsDisplay({ matches, foundKeywords, missingKeywords }: KeywordsDisplayProps) {
  const matchPercentage = matches.length > 0
    ? Math.round((foundKeywords.length / matches.length) * 100)
    : 0;

  const categorizedMissing = categorizeMissing(missingKeywords, matches);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Keyword Match Rate</p>
          <p className="text-2xl font-bold">
            {foundKeywords.length}/{matches.length}
          </p>
        </div>
        <div className={`text-3xl font-bold ${matchPercentage >= 70 ? 'text-green-600' : matchPercentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
          {matchPercentage}%
        </div>
      </div>

      {missingKeywords.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <CardTitle className="text-base text-red-900 dark:text-red-200">
                Missing Keywords ({missingKeywords.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-red-700 dark:text-red-300">
              Add these keywords to improve your ATS score:
            </p>
            <div className="space-y-4">
              {categorizedMissing.hardSkills.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-red-800 dark:text-red-200">Technical Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {categorizedMissing.hardSkills.map((keyword) => (
                      <Badge key={keyword} variant="error">
                        <XCircle className="mr-1 h-3 w-3" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {categorizedMissing.tools.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-red-800 dark:text-red-200">Tools & Technologies</p>
                  <div className="flex flex-wrap gap-2">
                    {categorizedMissing.tools.map((keyword) => (
                      <Badge key={keyword} variant="error">
                        <XCircle className="mr-1 h-3 w-3" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {categorizedMissing.softSkills.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-red-800 dark:text-red-200">Soft Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {categorizedMissing.softSkills.map((keyword) => (
                      <Badge key={keyword} variant="warning">
                        <XCircle className="mr-1 h-3 w-3" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {categorizedMissing.other.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-red-800 dark:text-red-200">Other Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {categorizedMissing.other.map((keyword) => (
                      <Badge key={keyword} variant="outline">
                        <XCircle className="mr-1 h-3 w-3" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {foundKeywords.length > 0 && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <CardTitle className="text-base text-green-900 dark:text-green-200">
                Matched Keywords ({foundKeywords.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {foundKeywords.map((keyword) => (
                <Badge key={keyword} variant="success">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function categorizeMissing(missingKeywords: string[], matches: KeywordMatch[]) {
  const hardSkills: string[] = [];
  const softSkills: string[] = [];
  const tools: string[] = [];
  const other: string[] = [];

  for (const keyword of missingKeywords) {
    const match = matches.find(m => m.keyword.toLowerCase() === keyword.toLowerCase());
    if (!match) {
      other.push(keyword);
      continue;
    }

    switch (match.category) {
      case 'hard_skill':
        hardSkills.push(keyword);
        break;
      case 'soft_skill':
        softSkills.push(keyword);
        break;
      case 'tool':
      case 'technology':
        tools.push(keyword);
        break;
      default:
        other.push(keyword);
    }
  }

  return { hardSkills, softSkills, tools, other };
}
