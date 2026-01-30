'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function JobDescriptionInput({ value, onChange, disabled }: JobDescriptionInputProps) {
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="job-description" className="text-sm font-medium">
          Job Description
        </Label>
        <span className="text-xs text-gray-500 dark:text-gray-400">{wordCount} words</span>
      </div>
      <Textarea
        id="job-description"
        placeholder="Paste the full job description here...

Include:
• Job title and responsibilities
• Required skills and qualifications
• Preferred experience
• Technical requirements"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="min-h-[200px] resize-y"
      />
      {value.length > 0 && wordCount < 50 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Job description seems short. Include more details for accurate analysis.
        </p>
      )}
    </div>
  );
}
