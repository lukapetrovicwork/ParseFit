'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { cn, bytesToSize, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ResumeUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onRemove: () => void;
  disabled?: boolean;
}

export function ResumeUpload({ onFileSelect, selectedFile, onRemove, disabled }: ResumeUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: { file: File; errors: { message: string }[] }[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        const errorMessages = rejection.errors.map((e) => e.message).join(', ');
        setError(errorMessages);
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          setError('Please upload a PDF or DOCX file');
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          setError(`File size must be less than ${bytesToSize(MAX_FILE_SIZE)}`);
          return;
        }

        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    disabled,
  });

  if (selectedFile) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <File className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">{selectedFile.name}</p>
              <p className="text-sm text-green-600">{bytesToSize(selectedFile.size)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={disabled}
            className="text-green-600 hover:bg-green-100 hover:text-green-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-red-300 bg-red-50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div
            className={cn(
              'rounded-full p-3',
              isDragActive ? 'bg-primary/10' : 'bg-gray-100'
            )}
          >
            <Upload
              className={cn(
                'h-8 w-8',
                isDragActive ? 'text-primary' : 'text-gray-400'
              )}
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">
              {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
            </p>
            <p className="text-xs text-gray-500">or click to browse</p>
          </div>
          <p className="text-xs text-gray-400">PDF or DOCX, max {bytesToSize(MAX_FILE_SIZE)}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
