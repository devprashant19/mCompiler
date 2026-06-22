import React, { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import useStore from '../store/useStore.js';

export default function EditorArea() {
  const { openTabs, activeFileId, closeTab, setActiveFile, updateNode, theme } = useStore();
  const [content, setContent] = useState('');
  const timeoutRef = useRef(null);

  const activeFile = openTabs.find(t => t.id === activeFileId);

  useEffect(() => {
    if (activeFile) {
      setContent(activeFile.content || '');
    } else {
      setContent('');
    }
  }, [activeFileId]);

  const handleChange = (value) => {
    setContent(value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (activeFileId) {
        updateNode(activeFileId, { content: value });
      }
    }, 800);
  };

  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bgEditor text-textSecondary h-full">
        <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-2xl shadow-sm max-w-sm text-center mx-4">
          <div className="w-16 h-16 rounded-full bg-secondaryAccent/30 flex items-center justify-center mb-4 text-accent">
            <span className="material-symbols-outlined !text-[32px]">code</span>
          </div>
          <p className="text-2xl font-bold text-textPrimary tracking-tight mb-2">Mansi Compiler</p>
          <p className="text-sm opacity-80">Select a file from the explorer to start coding, or create a new one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-bgEditor relative">
      {/* Tabs */}
      <div className="flex items-end h-[36px] bg-bgSidebar border-b border-borderColor px-2 gap-1 overflow-x-auto no-scrollbar shrink-0">
        {openTabs.map(tab => (
          <div 
            key={tab.id}
            onClick={() => setActiveFile(tab.id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-t-md font-bold text-xs cursor-pointer min-w-max group transition-colors 
              ${activeFileId === tab.id 
                ? 'bg-bgEditor border-t-[2px] border-accent text-accent' 
                : 'text-textSecondary hover:text-textPrimary hover:bg-bgMain'}`}
          >
            <span className="material-symbols-outlined !text-[14px]">description</span>
            <span className="truncate max-w-[150px] font-normal">{tab.name}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
              className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all ml-1 ${activeFileId === tab.id ? 'hover:bg-secondaryAccent/50' : 'hover:bg-secondaryAccent opacity-0 group-hover:opacity-100'}`}
            >
              <span className="material-symbols-outlined !text-[12px]">close</span>
            </button>
          </div>
        ))}
      </div>
      
      {/* Editor */}
      <div className="flex-1 min-h-0 relative z-0">
        <Editor
          height="100%"
          language="cpp"
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={content}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            fontFamily: '"JetBrains Mono", monospace',
            fontLigatures: true,
            scrollBeyondLastLine: false,
            roundedSelection: true,
            padding: { top: 24, bottom: 24 },
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            lineHeight: 24,
          }}
        />
      </div>
    </div>
  );
}
