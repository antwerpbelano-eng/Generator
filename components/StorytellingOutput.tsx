import React, { useState } from 'react';

// Define the shape of the content prop
interface StorytellingContent {
  title: string;
  intro: string;
  cta: string;
  hashtags: string;
}

interface StorytellingOutputProps {
  content: StorytellingContent;
}

// A helper component for each field to avoid repetition
const CopyableField = ({ label, text }: { label: string; text: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error(`Failed to copy ${label}:`, err);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-purple-300">{label}</h3>
        <button
          onClick={handleCopy}
          disabled={!text}
          className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-gray-300 font-semibold py-1 px-2 rounded-md transition-colors"
          aria-label={`Copy ${label}`}
        >
          {isCopied ? 'Disalin!' : 'Salin'}
        </button>
      </div>
      <p className="text-sm text-gray-200 bg-gray-900 p-3 rounded-md border border-gray-700 whitespace-pre-wrap">
        {text}
      </p>
    </div>
  );
};

const StorytellingOutput: React.FC<StorytellingOutputProps> = ({ content }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-700 flex flex-col gap-4">
       <h2 className="text-lg font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
        Paket Konten Media Sosial
      </h2>
      <CopyableField label="Judul Cerita" text={content.title} />
      <CopyableField label="Teks Intro" text={content.intro} />
      <CopyableField label="Ajakan Bertindak (CTA)" text={content.cta} />
      <CopyableField label="Tagar (Hashtags)" text={content.hashtags} />
    </div>
  );
};

export default StorytellingOutput;
