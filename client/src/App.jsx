import React, { useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ActivityBar from './components/ActivityBar.jsx';
import EditorArea from './components/EditorArea.jsx';
import OutputPanel from './components/OutputPanel.jsx';
import TopBar from './components/TopBar.jsx';
import useStore from './store/useStore.js';

function App() {
  const { theme, outputPosition, sidebarWidth, setSidebarWidth } = useStore();
  const isResizing = useRef(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleSidebarDrag = (e) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    
    const handleMouseMove = (moveEvent) => {
      if (!isResizing.current) return;
      // ActivityBar is 48px wide (w-12). Sidebar starts at x=48.
      const newWidth = Math.max(150, Math.min(600, moveEvent.clientX - 48));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden text-textPrimary bg-bgMain selection:bg-accent/30 selection:text-textPrimary">
      <TopBar />
      <div className="flex-1 flex overflow-hidden min-h-0">
        <ActivityBar />
        <Sidebar />
        
        {/* Sidebar Resizer */}
        <div 
          className="w-1 cursor-col-resize hover:bg-accent/40 active:bg-accent transition-colors shrink-0 z-20 bg-transparent"
          onMouseDown={handleSidebarDrag}
        />

        <div className={`flex-1 flex ${outputPosition === 'right' ? 'flex-row' : 'flex-col'} min-w-0`}>
          <EditorArea />
          <OutputPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
