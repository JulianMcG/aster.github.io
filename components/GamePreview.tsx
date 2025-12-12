import React, { useEffect, useRef } from 'react';

interface GamePreviewProps {
  code: string;
  isPaused?: boolean;
}

const GamePreview: React.FC<GamePreviewProps> = ({ code, isPaused = false }) => {
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

  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      // Send pause/play message to iframe
      iframeRef.current.contentWindow.postMessage(
        { type: isPaused ? 'pause' : 'play' },
        '*'
      );
    }
  }, [isPaused]);

  return (
    <div className="w-full h-full bg-black">
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
