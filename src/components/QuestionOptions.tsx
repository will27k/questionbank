'use client';

import { useState } from 'react';

export interface QuestionOptionsConfig {
  numQuestions: number;
  questionTypes: {
    mcq: boolean;
    trueFalse: boolean;
    shortAnswer: boolean;
  };
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuestionOptionsProps {
  onOptionsChange: (options: QuestionOptionsConfig) => void;
}

export default function QuestionOptions({ onOptionsChange }: QuestionOptionsProps) {
  const [options, setOptions] = useState<QuestionOptionsConfig>({
    numQuestions: 5,
    questionTypes: {
      mcq: true,
      trueFalse: false,
      shortAnswer: false,
    },
    difficulty: 'medium',
  });

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    const newOptions: QuestionOptionsConfig = {
      ...options,
      questionTypes: { ...options.questionTypes, [name]: checked },
    };
    setOptions(newOptions);
    onOptionsChange(newOptions);
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const newOptions = { ...options, [name]: parseInt(value, 10) };
    setOptions(newOptions);
    onOptionsChange(newOptions);
  };
  
  const handleDifficultyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const newOptions = { ...options, difficulty: value as QuestionOptionsConfig['difficulty'] };
    setOptions(newOptions);
    onOptionsChange(newOptions);
  };


  return (
    <div className="p-6 border rounded-lg bg-gray-50 space-y-6">
      <div className="space-y-3">
        <label className="block font-medium text-gray-700">Question Types</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.keys(options.questionTypes).map((key) => (
            <label key={key} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-white hover:border-primary-500 transition-colors cursor-pointer">
              <input
                type="checkbox"
                name={key}
                checked={options.questionTypes[key as keyof typeof options.questionTypes]}
                onChange={handleCheckboxChange}
                className="h-5 w-5 rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="font-medium">
                {key === 'mcq' && 'Multiple Choice'}
                {key === 'trueFalse' && 'True/False'}
                {key === 'shortAnswer' && 'Short Answer'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="numQuestions" className="block font-medium text-gray-700">
          Number of Questions: <span className="font-bold text-primary-600">{options.numQuestions}</span>
        </label>
        <input
          type="range"
          id="numQuestions"
          name="numQuestions"
          min="1"
          max="20"
          value={options.numQuestions}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>
      
      <div className="space-y-3">
        <label className="block font-medium text-gray-700">Difficulty</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['easy', 'medium', 'hard'].map((level) => (
            <label key={level} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-white hover:border-primary-500 transition-colors cursor-pointer">
              <input
                type="radio"
                name="difficulty"
                value={level}
                checked={options.difficulty === level}
                onChange={handleDifficultyChange}
                className="h-5 w-5 text-primary-600 focus:ring-primary-500"
              />
              <span className="font-medium">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
} 