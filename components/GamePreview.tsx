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

  // Send pause/resume message to iframe
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          { type: isPaused ? 'pause' : 'resume' },
          '*'
        );
      } catch (e) {
        // Ignore cross-origin errors
      }
    }
  }, [isPaused]);

  return (
    <div className="w-full h-full bg-white relative">
      <iframe
        ref={iframeRef}
        title="Aster Game Preview"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-forms allow-pointer-lock allow-modals"
      />
      {isPaused && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
          <div className="font-display text-2xl lowercase tracking-tight-swiss text-white">
            paused
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePreview;
