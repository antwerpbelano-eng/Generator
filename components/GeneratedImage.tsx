import React from 'react';

interface GeneratedImageProps {
  imageUrl: string;
  prompt: string;
  onRegenerate: () => void;
}

const GeneratedImage: React.FC<GeneratedImageProps> = ({ imageUrl, prompt, onRegenerate }) => {
  return (
    <div className="flex flex-col items-center gap-4 w-full mt-4">
      <img
        src={imageUrl}
        alt={prompt}
        className="w-full mx-auto rounded-lg shadow-2xl border-2 border-gray-700"
      />
      <div className="flex items-center gap-4 mt-2">
        <a
          href={imageUrl}
          download={`generated-image-for-${prompt.substring(0, 20)}.jpeg`}
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 text-sm"
        >
          Download Gambar
        </a>
        <button
          onClick={onRegenerate}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 text-sm"
        >
          Hasilkan Ulang
        </button>
      </div>
    </div>
  );
};

export default GeneratedImage;
