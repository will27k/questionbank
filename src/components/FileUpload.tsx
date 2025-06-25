'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X } from 'lucide-react';

interface FileUploadProps {
  file: File | null;
  onFileAccepted: (file: File) => void;
  onRemoveFile: () => void;
}

export default function FileUpload({ file, onFileAccepted, onRemoveFile }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileAccepted(acceptedFiles[0]);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  if (file) {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <File className="w-6 h-6 text-gray-500" />
          <p className="font-medium text-gray-700 truncate">{file.name}</p>
        </div>
        <button
          onClick={onRemoveFile}
          className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-primary-600 bg-primary-50' : 'hover:border-primary-500 hover:bg-primary-50 bg-gray-50 border-gray-300'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-gray-500">
        <UploadCloud className="w-12 h-12 mb-3 text-gray-400" />
        {isDragActive ? (
          <p className="font-semibold text-primary-600">Drop the PDF here ...</p>
        ) : (
          <p>
            <span className="font-semibold text-primary-600">Click to upload</span> or drag and drop
          </p>
        )}
        <p className="text-sm mt-1">PDF document (max 512MB)</p>
      </div>
    </div>
  );
} 