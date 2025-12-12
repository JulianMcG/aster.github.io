import React, { useEffect, useRef } from 'react';

interface GamePreviewProps {
  code: string;
}

const GamePreview: React.FC<GamePreviewProps> = ({ code }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && code) {
      const blob = new Blob([code], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      iframeRef.current.src = url;

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [code]);

  return (
    <div className="w-full h-full bg-white">
      <iframe
        ref={iframeRef}
        title="Aster Game Preview"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-forms allow-pointer-lock allow-modals"
      />
    </div>
  );
};

export default GamePreview;