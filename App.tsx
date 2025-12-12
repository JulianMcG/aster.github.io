import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, RotateCcw, Edit3, X, Loader2, Code, Play, Pause } from 'lucide-react';
import { generateGameCode } from './services/geminiService';
import GamePreview from './components/GamePreview';
import CodeViewer from './components/CodeViewer';

type ViewState = 'landing' | 'generating' | 'playing' | 'editing';

const SUGGESTIONS = [
  "pong vs ai",
  "asteroid defense",
  "flappy square",
  "snake",
  "breakout"
];

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [view, setView] = useState<ViewState>('landing');
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (view === 'landing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [view]);

  const handleGenerate = async (promptText: string, isEdit = false) => {
    if (!promptText.trim()) return;

    const previousView = view;
    setView('generating');
    setError(null);

    try {
      const code = await generateGameCode(promptText, isEdit && gameCode ? gameCode : undefined);
      setGameCode(code);
      setView('playing');
      setEditPrompt("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "generation failed");
      setView(previousView === 'editing' ? 'playing' : 'landing');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, isEdit = false) => {
    if (e.key === 'Enter') {
      if (isEdit) {
        handleGenerate(editPrompt, true);
      } else {
        handleGenerate(prompt);
      }
    }
  };

  // --- COMPONENTS ---

  const LoadingScreen = () => (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <div className="w-full max-w-md px-6">
        <div className="border-t border-white mb-4 w-16"></div>
        <div className="font-display text-4xl lowercase tracking-tight-swiss mb-2">
          generating
        </div>
        <div className="font-mono text-xs text-gray-500 lowercase tracking-normal-swiss flex items-center gap-3">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>constructing experience</span>
        </div>
      </div>
    </div>
  );

  const TopBar = () => (
    <header className="h-16 border-b border-white/20 bg-black flex items-center justify-between px-6 select-none z-10 relative">
      <div 
        onClick={() => {
          setPrompt("");
          setGameCode(null);
          setView('landing');
        }}
        className="group cursor-pointer flex items-center gap-2"
      >
        <img 
          src="/favicon.png" 
          alt="aster" 
          className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300"
        />
        <div className="font-display font-bold text-xl tracking-tight-swiss lowercase text-white">
          aster
        </div>
      </div>

      <div className="flex items-center gap-4">
        {view === 'editing' ? (
           <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="relative">
               <input 
                 autoFocus
                 value={editPrompt}
                 onChange={(e) => setEditPrompt(e.target.value)}
                 onKeyDown={(e) => handleKeyDown(e, true)}
                 placeholder="describe changes..."
                 className="bg-transparent border-b border-gray-600 text-white font-mono text-xs w-64 focus:outline-none focus:border-white placeholder:text-gray-700 lowercase pb-1 tracking-normal-swiss"
               />
             </div>
             <button 
               onClick={() => handleGenerate(editPrompt, true)}
               className="h-6 w-6 flex items-center justify-center border border-white hover:bg-white hover:text-black transition-colors"
             >
               <ArrowRight size={12} />
             </button>
             <button 
               onClick={() => setView('playing')}
               className="h-6 w-6 flex items-center justify-center border border-white hover:bg-white hover:text-black transition-colors"
             >
               <X size={12} />
             </button>
           </div>
        ) : (
          <>
            {view === 'playing' && !showCode && (
              <button 
                onClick={() => setIsPaused(!isPaused)}
                className="font-mono text-xs text-white hover:bg-white hover:text-black border border-white px-3 py-1.5 transition-colors lowercase flex items-center gap-2 tracking-normal-swiss"
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? <Play size={10} /> : <Pause size={10} />}
                {isPaused ? "resume" : "pause"}
              </button>
            )}
            <button 
              onClick={() => setShowCode(!showCode)}
              className="font-mono text-xs text-white hover:bg-white hover:text-black border border-white px-3 py-1.5 transition-colors lowercase flex items-center gap-2 tracking-normal-swiss"
            >
              {showCode ? "preview" : "source"}
            </button>
            <button 
              onClick={() => setView('editing')}
              className="font-mono text-xs text-white hover:bg-white hover:text-black border border-white px-3 py-1.5 transition-colors lowercase flex items-center gap-2 tracking-normal-swiss"
            >
              <Edit3 size={10}/> edit
            </button>
            <button 
              onClick={() => {
                 setPrompt("");
                 setGameCode(null);
                 setView('landing');
                 setIsPaused(false);
              }}
              className="font-mono text-xs text-gray-500 hover:text-white border border-gray-800 hover:border-white px-3 py-1.5 transition-colors lowercase flex items-center gap-2 tracking-normal-swiss"
            >
              <RotateCcw size={10}/> new
            </button>
          </>
        )}
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col overflow-hidden selection:bg-white selection:text-black">
      
      {view === 'generating' && <LoadingScreen />}

      {/* LANDING STATE */}
      {view === 'landing' && (
        <div className="flex-1 flex flex-col justify-center items-center w-full h-full relative p-6">
          
          {/* Main Grid Container */}
          <div className="w-full max-w-3xl flex flex-col gap-12 z-10">
            
            {/* Title Block */}
            <div className="">
              <h1 className="font-display font-bold text-7xl md:text-[8rem] leading-[0.8] tracking-tight-swiss lowercase text-white">
                aster
              </h1>
            </div>

            {/* Input Area - Restored underline */}
            <div className="w-full relative group">
                <div className="relative flex items-center">
                  <span className="absolute left-0 text-gray-500 font-mono text-xl animate-pulse px-2">{'>'}</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e)}
                    className="w-full bg-transparent border-b border-gray-800 focus:border-white py-3 pl-8 text-xl md:text-2xl font-display lowercase tracking-tight-swiss text-white placeholder:text-gray-800 focus:outline-none transition-colors"
                    placeholder="enter game concept..."
                  />
                  <button 
                    onClick={() => handleGenerate(prompt)}
                    className="absolute right-0 p-2 hover:bg-white hover:text-black transition-colors border border-transparent hover:border-white"
                  >
                    <ArrowRight size={20} strokeWidth={1.5} />
                  </button>
                </div>
            </div>

            {/* Recommendations Chips - Removed top border separator */}
            <div className="w-full">
               <div className="flex items-center justify-between mb-4">
                 <span className="font-mono text-[10px] text-gray-500 lowercase tracking-normal-swiss">suggestions</span>
               </div>
               
               <div className="flex flex-wrap gap-3">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleGenerate(s)}
                      className="group relative px-4 py-2 border border-gray-800 hover:border-white hover:bg-white transition-all duration-200"
                    >
                      <span className="font-mono text-xs text-gray-400 group-hover:text-black lowercase tracking-normal-swiss">
                        {s}
                      </span>
                    </button>
                  ))}
               </div>
            </div>

            {error && (
              <div className="p-4 border border-red-900 bg-red-900/10 text-red-500 font-mono text-xs lowercase tracking-normal-swiss">
                error: {error}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="absolute bottom-6 left-6 font-mono text-[10px] text-gray-800 lowercase tracking-normal-swiss">
            v1.0.0 / an experiment by Julian M.
          </div>
        </div>
      )}

      {/* PLAYING / EDITING STATE */}
      {(view === 'playing' || view === 'editing') && gameCode && (
        <div className="flex flex-col h-screen w-screen bg-black">
          <TopBar />
          <main className="flex-1 bg-white relative overflow-hidden flex flex-col">
             {showCode ? (
                <div className="w-full h-full bg-black overflow-hidden border-t border-gray-800">
                   <CodeViewer code={gameCode} />
                </div>
             ) : (
                <GamePreview code={gameCode} isPaused={isPaused} />
             )}
          </main>
        </div>
      )}
    </div>
  );
}
