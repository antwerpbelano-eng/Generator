import React, { useState } from 'react';

interface Scene {
  id: number;
  prompt: string;
}

interface StoryPreviewProps {
  scenes: Scene[];
}

const StoryPreview: React.FC<StoryPreviewProps> = ({ scenes }) => {
  const [isCopied, setIsCopied] = useState(false);
  const hasPrompts = scenes.some(s => s.prompt.trim() !== '');

  const handleCopyAll = () => {
    if (!hasPrompts) return;

    const fullStory = scenes.map(s => `Adegan ${s.id}:\n${s.prompt}`)
        .join('\n\n---\n\n');
    
    navigator.clipboard.writeText(fullStory).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Gagal menyalin cerita:', err);
    });
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-700 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
          Pratinjau Alur Cerita
        </h2>
        <button
          onClick={handleCopyAll}
          disabled={!hasPrompts}
          className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-gray-300 font-semibold py-1 px-2 rounded-md transition-colors"
        >
          {isCopied ? 'Disalin!' : 'Salin Seluruh Cerita'}
        </button>
      </div>

      <div className="space-y-6">
        {scenes.map(scene => (
          <div key={scene.id} className="space-y-2">
            <div>
              <h3 className="text-sm font-semibold text-purple-300 mb-1">Adegan {scene.id}</h3>
              <p className="text-sm text-gray-200 bg-gray-900 p-3 rounded-md border border-gray-700 whitespace-pre-wrap">
                {scene.prompt || <span className="text-gray-500">Prompt belum dibuat.</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoryPreview;