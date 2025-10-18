import React, { useState } from 'react';

interface AnalysisPanelProps {
  prompt: string;
  onPromptChange: (newPrompt: string) => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ prompt, onPromptChange }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error('Gagal menyalin prompt:', err);
    });
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex justify-between items-center mb-2">
        <label className="font-semibold text-gray-300 text-sm">
          Deskripsi Adegan
        </label>
        <button
          onClick={handleCopy}
          disabled={!prompt}
          className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-gray-300 font-semibold py-1 px-2 rounded-md transition-colors"
          aria-label="Salin prompt"
        >
          {isCopied ? 'Disalin!' : 'Salin'}
        </button>
      </div>
      <div className="relative w-full h-full min-h-[12rem] bg-gray-900 rounded-lg">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Tulis ide adegan Anda di sini... contoh: 'seorang astronot berjalan di permukaan Mars saat matahari terbenam'."
          className="w-full h-full p-3 text-sm text-gray-200 bg-transparent border-2 border-gray-700 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
          rows={8}
        />
      </div>
    </div>
  );
};

export default AnalysisPanel;