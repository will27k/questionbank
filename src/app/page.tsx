'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import QuestionOptions, { QuestionOptionsConfig } from '@/components/QuestionOptions';
import { Sparkles, Bot, Download } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<QuestionOptionsConfig>({
    numQuestions: 5,
    questionTypes: { mcq: true, trueFalse: false, shortAnswer: false },
    difficulty: 'medium',
  });
  const [focusArea, setFocusArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[] | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleFileAccepted = (acceptedFile: File) => {
    setFile(acceptedFile);
    setGeneratedQuestions(null);
    setError(null);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setGeneratedQuestions(null);
    setError(null);
  }

  const handleOptionsChange = (newOptions: QuestionOptionsConfig) => {
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    setLoading(true);
    setError(null);
    setGeneratedQuestions(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));
    formData.append('focusArea', focusArea);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      setGeneratedQuestions(data.questions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedQuestions) return;
    setIsDownloading(true);
    try {
      const response = await fetch('/api/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: generatedQuestions, title: file?.name || 'question_bank' }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(file?.name || 'question_bank').replace(/\.pdf$/i, '')}_questions.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <header className="w-full p-4 border-b border-gray-200">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Bot className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800">QuizGenius</h1>
        </div>
      </header>

      <main className="p-4 sm:p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 sm:p-8 space-y-8">
            <FileUpload file={file} onFileAccepted={handleFileAccepted} onRemoveFile={handleRemoveFile} />
            {file && (
              <>
                <div className="space-y-3">
                  <label htmlFor="focusArea" className="block font-medium text-gray-700">
                    Optional: Focus on a Specific Section
                  </label>
                  <textarea
                    id="focusArea"
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    placeholder="e.g., 'Chapter 3, pages 12-15' or 'the section about photosynthesis'"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                    rows={3}
                  />
                </div>
                <QuestionOptions onOptionsChange={handleOptionsChange} />
              </>
            )}
          </div>
          <div className="p-6 sm:p-8 bg-gray-50 border-t border-gray-200 rounded-b-xl">
            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white p-3 rounded-lg font-semibold text-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            >
              <Sparkles className="w-6 h-6" />
              {loading ? 'Generating...' : 'Generate Questions'}
            </button>
          </div>
        </div>

        {error && 
          <div className="max-w-2xl mx-auto mt-6">
            <p className="text-red-500 text-center bg-red-100 p-4 rounded-lg">{error}</p>
          </div>
        }
        
        {generatedQuestions && (
          <div className="max-w-2xl mx-auto mt-6 p-6 w-full text-center space-y-4 bg-green-50 border border-green-200 rounded-xl">
            <h2 className="text-2xl font-semibold text-green-700">Generation Complete!</h2>
            <p className="text-gray-600">Your question bank is ready to be downloaded.</p>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white p-3 rounded-lg font-semibold text-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              <Download className="w-6 h-6" />
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        )}
      </main>
      
      <footer className="w-full p-4 mt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} QuizGenius. All rights reserved.</p>
      </footer>
    </div>
  );
}
