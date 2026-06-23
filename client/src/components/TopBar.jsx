import { useState } from 'react';
import useStore from '../store/useStore.js';

export default function TopBar() {
  const { theme, setTheme, runCode, activeFileId, nodes, isRunning } = useStore();
  const [showMotivation, setShowMotivation] = useState(false);
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleRun = () => {
    if (!activeFileId || isRunning) return;
    const activeFile = nodes.find(n => n.id === activeFileId);
    if (activeFile && activeFile.content) {
      runCode(activeFile.content);
    }
  };

  return (
    <>
      <header className="flex items-center px-4 w-full h-12 shrink-0 z-50 bg-bgMain/80 backdrop-blur-xl border-b border-borderColor shadow-sm relative">
        <div className="flex items-center gap-3 select-none">
          <img alt="Mansi Compiler Logo" className="h-6 w-6 rounded-sm" src="/favicon.svg" onError={(e) => e.target.src = '/vite.svg'} />
          <span className="text-[20px] font-bold bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent tracking-tight">Mansi Compiler</span>
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 bg-secondaryAccent/20 p-1 rounded-md backdrop-blur-md">
          <button 
            onClick={handleRun}
            disabled={!activeFileId || isRunning}
            className="flex items-center gap-1.5 px-6 py-1.5 rounded-md bg-gradient-to-r from-accent to-accent-hover text-white text-[15px] font-medium hover:opacity-90 active:scale-95 duration-200 transition-all shadow-md shadow-accent/20 disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
          >
            <span className="material-symbols-outlined !text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            {isRunning ? 'Running...' : 'Run'}
          </button>
          
          <button onClick={toggleTheme} className="p-1.5 rounded-md hover:bg-secondaryAccent transition-colors text-textSecondary active:scale-95 duration-200 flex items-center justify-center mr-1 cursor-pointer" title="Toggle Theme">
            <span className="material-symbols-outlined !text-[20px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>

        <div className="absolute right-4 flex items-center gap-2">
          <button 
            onClick={() => setShowMotivation(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-gradient-to-r from-[#e11d48] to-[#be123c] text-white text-[15px] font-medium hover:opacity-90 active:scale-95 duration-200 transition-all shadow-md shadow-[#e11d48]/20 cursor-pointer"
          >
            <span className="material-symbols-outlined !text-[18px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            Motivation
          </button>
        </div>
      </header>

      {showMotivation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowMotivation(false)}>
          <div className="bg-gradient-to-br from-[#e11d48] to-[#be123c] p-8 rounded-2xl shadow-2xl border border-white/20 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300 max-w-sm text-center relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowMotivation(false)} className="absolute top-2 right-2 p-1 text-white/70 hover:text-white cursor-pointer rounded-full transition-colors hover:bg-white/10">
              <span className="material-symbols-outlined !text-[20px]">close</span>
            </button>
            <div className="bg-white/20 p-4 rounded-full mb-2 shadow-inner border border-white/20">
              <span className="material-symbols-outlined !text-[48px] text-white animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </div>
            <p className="text-xl font-bold text-white tracking-wide">I love u kuttu 🤗</p>
            <p className="text-md text-white/90 leading-relaxed font-medium">You are doing great.<br/>I am proud of you 😙💖</p>
          </div>
        </div>
      )}
    </>
  );
}
