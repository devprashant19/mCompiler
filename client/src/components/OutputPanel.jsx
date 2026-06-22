import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore.js';

export default function OutputPanel() {
  const { runOutput, stdin, setStdin, clearOutput, outputPosition, setOutputPosition, sendInput, isRunning, stopRun } = useStore();
  const [size, setSize] = useState(250);
  const [isExpanded, setIsExpanded] = useState(false);
  const outputRef = useRef(null);

  const isRight = outputPosition === 'right';

  useEffect(() => {
    if (isRight) {
      setSize(window.innerWidth * 0.4);
    } else {
      setSize(250);
    }
  }, [isRight]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [runOutput.stdout, runOutput.stderr, runOutput.compile_output]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isRunning) return;
      sendInput(stdin);
      setStdin('');
    }
  };

  const handleSizeDrag = (e) => {
    if (isExpanded) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = size;

    const handleMouseMove = (moveEvent) => {
      if (isRight) {
        const deltaX = startX - moveEvent.clientX;
        setSize(Math.max(200, Math.min(window.innerWidth * 0.8, startSize + deltaX)));
      } else {
        const deltaY = startY - moveEvent.clientY;
        setSize(Math.max(100, Math.min(window.innerHeight * 0.8, startSize + deltaY)));
      }
    };

    const handleMouseUp = () => {
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.body.style.cursor = isRight ? 'col-resize' : 'row-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleHeaderDrag = (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();

    const handleMouseUp = (upEvent) => {
      const { clientX, view } = upEvent;
      const width = view.innerWidth;
      
      if (clientX > width * 0.6) {
        setOutputPosition('right');
        setSize(width * 0.4);
      } else {
        setOutputPosition('bottom');
        setSize(250);
      }

      document.body.style.cursor = '';
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.body.style.cursor = 'grabbing';
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getStatusColor = () => {
    if (!runOutput.status) return 'text-textSecondary';
    if (runOutput.status === 'Success') return 'text-success bg-success/10 border border-success/20';
    if (runOutput.status === 'Compiling & running...') return 'text-accent bg-accent/10 border border-accent/20 animate-pulse';
    return 'text-error bg-error/10 border border-error/20';
  };

  const currentStyle = isExpanded 
    ? (isRight ? { width: 'calc(100vw - 48px - 260px)' } : { height: 'calc(100vh - 48px)' })
    : (isRight ? { width: `${size}px` } : { height: `${size}px` });

  return (
    <div 
      style={currentStyle} 
      className={`flex flex-col shrink-0 min-h-[100px] min-w-[200px] transition-all duration-300 ease-in-out glass-panel 
        ${isRight ? 'border-l border-borderColor h-full' : 'border-t border-borderColor w-full'}
        ${isExpanded && isRight ? 'absolute top-0 right-0 bottom-0 z-20 shadow-2xl' : ''}
        ${isExpanded && !isRight ? 'absolute bottom-0 left-0 right-0 z-20 shadow-2xl' : 'relative'}
      `}
    >
      {!isExpanded && (
        <div 
          className={`bg-transparent hover:bg-accent/40 active:bg-accent transition-colors shrink-0 absolute z-10 ${isRight ? 'w-1.5 h-full cursor-col-resize left-0 top-0' : 'h-1.5 w-full cursor-row-resize top-0 left-0'}`}
          onMouseDown={handleSizeDrag}
        />
      )}
      
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-1.5 border-b border-borderColor bg-bgSidebar/50 select-none shrink-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleHeaderDrag}
        title="Drag left to dock bottom, drag right to dock right"
      >
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold tracking-wider text-textSecondary">TERMINAL</span>
          {runOutput.status && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono capitalize ${getStatusColor()}`}>
              {runOutput.status === 'Success' && <span className="material-symbols-outlined !text-[12px]">check_circle</span>}
              {runOutput.status === 'Compilation Error' && <span className="material-symbols-outlined !text-[12px]">error</span>}
              {runOutput.status === 'Compiling & running...' && <span className="w-2 h-2 rounded-full bg-accent animate-ping" />}
              {runOutput.status} {runOutput.time_ms !== null ? `(${runOutput.time_ms}ms)` : ''}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <button onClick={stopRun} className="p-1 rounded hover:bg-error/20 text-error transition-colors cursor-pointer flex items-center" title="Stop Process">
              <span className="material-symbols-outlined !text-[16px]">stop</span>
            </button>
          )}
          <button onClick={() => clearOutput()} className="p-1 rounded hover:bg-secondaryAccent text-textSecondary transition-colors cursor-pointer" title="Clear Output">
            <span className="material-symbols-outlined !text-[16px]">delete</span>
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 rounded hover:bg-secondaryAccent text-textSecondary transition-colors cursor-pointer" title={isExpanded ? "Collapse" : "Expand"}>
            <span className="material-symbols-outlined !text-[16px]">{isExpanded ? (isRight ? 'keyboard_arrow_right' : 'keyboard_arrow_down') : (isRight ? 'keyboard_arrow_left' : 'keyboard_arrow_up')}</span>
          </button>
        </div>
      </div>

      {/* Unified Content */}
      <div className="flex-1 flex flex-col bg-bgEditor min-w-0 min-h-0 relative">
        <div ref={outputRef} className="flex-1 p-3 overflow-y-auto font-mono text-[19px] text-textPrimary whitespace-pre-wrap break-words flex flex-col">
          
          {/* STDOUT */}
          <div className="flex-1">
            {runOutput.compile_output && (
              <div className="text-error bg-error/5 p-3 rounded-lg border border-error/20 mb-3">
                <span className="font-bold flex items-center mb-1">Compilation Output</span>
                {runOutput.compile_output}
              </div>
            )}
            {runOutput.stderr && (
              <div className="text-error bg-error/5 p-3 rounded-lg border border-error/20 mb-3">
                <span className="font-bold flex items-center mb-1">Standard Error</span>
                {runOutput.stderr}
              </div>
            )}
            {runOutput.stdout && (
              <div className="text-success p-1">
                {runOutput.stdout}
              </div>
            )}
            {!runOutput.compile_output && !runOutput.stderr && !runOutput.stdout && runOutput.status !== 'Compiling & running...' && (
              <div className="text-textSecondary/50 italic flex items-center justify-center py-4">
                Program output will appear here.
              </div>
            )}
          </div>

          {/* Interactive STDIN Line */}
          <div className={`mt-2 shrink-0 flex items-center gap-2 ${!isRunning ? 'opacity-50 pointer-events-none' : ''}`}>
             <span className="text-accent material-symbols-outlined !text-[16px]">chevron_right</span>
             <input
              type="text"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isRunning}
              className="flex-1 bg-transparent border-none p-0 m-0 font-mono text-[19px] text-accent focus:ring-0 focus:outline-none placeholder:text-textSecondary/30"
              placeholder={isRunning ? "Type input and press Enter..." : "Process not running..."}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
