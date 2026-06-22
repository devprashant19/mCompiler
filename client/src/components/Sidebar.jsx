import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore.js';

function TreeNode({ node, nodes, level }) {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { openTab, activeFileId, deleteNode, updateNode } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);

  const children = nodes.filter(n => n.parent_id === node.id).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const handleToggle = (e) => {
    e.stopPropagation();
    if (node.type === 'folder') setExpanded(!expanded);
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    if (node.type === 'file') {
      openTab(node);
    } else {
      setExpanded(!expanded);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${node.name}?`)) {
      await deleteNode(node.id);
    }
  };

  const startRename = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(node.name);
  };

  const commitRename = async () => {
    if (editName && editName !== node.name) {
      await updateNode(node.id, { name: editName });
    }
    setIsEditing(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') setIsEditing(false);
  };

  return (
    <div className="w-full">
      <div 
        className={`flex items-center py-1.5 px-2 cursor-pointer transition-colors group mx-1 mb-[2px] rounded-sm border-l-[3px] 
          ${activeFileId === node.id 
            ? 'bg-accent/10 border-accent text-accent font-medium' 
            : 'border-transparent text-textSecondary hover:bg-secondaryAccent/30 hover:text-textPrimary'}`}
        style={{ paddingLeft: `${level * 14 + 8}px` }}
        onClick={handleSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-4 h-4 mr-1 flex items-center justify-center text-textSecondary transition-colors" onClick={handleToggle}>
          {node.type === 'folder' ? (
            expanded ? <span className="material-symbols-outlined !text-[16px]">keyboard_arrow_down</span> : <span className="material-symbols-outlined !text-[16px]">keyboard_arrow_right</span>
          ) : null}
        </div>
        
        {isEditing ? (
          <input
            autoFocus
            className="flex-1 bg-bgMain border border-accent/50 rounded-sm text-sm px-1.5 py-0.5 outline-none w-full min-w-0 text-textPrimary"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={onKeyDown}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <div className="flex items-center flex-1 min-w-0">
             <div className="mr-2 flex items-center justify-center">
              {node.type === 'folder' ? <span className="material-symbols-outlined !text-[16px]">folder</span> : <span className="material-symbols-outlined !text-[16px]">description</span>}
            </div>
            <span className="text-sm truncate select-none">{node.name}</span>
          </div>
        )}

        {isHovered && !isEditing && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <button onClick={startRename} className="p-0.5 text-textSecondary hover:text-accent hover:bg-secondaryAccent/80 rounded transition-colors"><span className="material-symbols-outlined !text-[14px]">edit</span></button>
            <button onClick={handleDelete} className="p-0.5 text-textSecondary hover:text-error hover:bg-error/10 rounded transition-colors"><span className="material-symbols-outlined !text-[14px]">delete</span></button>
          </div>
        )}
      </div>
      
      {node.type === 'folder' && expanded && (
        <div className="w-full">
          {children.map(child => (
            <TreeNode key={child.id} node={child} nodes={nodes} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { nodes, fetchNodes, createNode, uploadFile, openTab, activeSidebarTab, sidebarWidth } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [createType, setCreateType] = useState('file');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  if (activeSidebarTab !== 'explorer') {
    return (
      <div style={{ width: sidebarWidth }} className="bg-bgSidebar border-r border-borderColor flex flex-col h-full overflow-hidden shrink-0 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        <div className="px-3 py-2 text-textSecondary border-b border-borderColor uppercase text-xs font-bold tracking-wider">
          {activeSidebarTab}
        </div>
        <div className="flex flex-col items-center justify-center p-8 text-textSecondary text-sm opacity-60 h-full">
           <span className="material-symbols-outlined !text-[32px] mb-2 opacity-50">{activeSidebarTab === 'search' ? 'search' : activeSidebarTab === 'git' ? 'account_tree' : activeSidebarTab === 'debug' ? 'bug_report' : 'extension'}</span>
           <p className="text-center capitalize">{activeSidebarTab} coming soon!</p>
        </div>
      </div>
    );
  }

  const rootNodes = nodes.filter(n => !n.parent_id).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const handleCreate = (type) => {
    setCreateType(type);
    setIsCreating(true);
    setNewName('');
  };

  const commitCreate = async () => {
    if (newName.trim()) {
      const finalName = newName.trim();
      let content = '';
      if (createType === 'file' && (finalName.endsWith('.cpp') || !finalName.includes('.'))) {
        content = `#include <iostream>\n\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n`;
      }
      const newNode = await createNode(finalName, createType, null, content);
      if (createType === 'file' && newNode) {
        openTab(newNode);
      }
    }
    setIsCreating(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') commitCreate();
    if (e.key === 'Escape') setIsCreating(false);
  };

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        await uploadFile(file, null);
      }
    };
    input.click();
  };

  return (
    <div style={{ width: sidebarWidth }} className="bg-bgSidebar border-r border-borderColor flex flex-col h-full overflow-hidden shrink-0 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between px-3 py-2 text-textSecondary border-b border-borderColor bg-bgSidebar">
        <span className="text-[11px] font-bold uppercase tracking-wider">EXPLORER</span>
        <div className="flex items-center gap-0.5">
          <button title="New File" onClick={() => handleCreate('file')} className="p-1 hover:bg-secondaryAccent rounded text-textSecondary hover:text-textPrimary transition-colors cursor-pointer"><span className="material-symbols-outlined !text-[14px]">note_add</span></button>
          <button title="New Folder" onClick={() => handleCreate('folder')} className="p-1 hover:bg-secondaryAccent rounded text-textSecondary hover:text-textPrimary transition-colors cursor-pointer"><span className="material-symbols-outlined !text-[14px]">create_new_folder</span></button>
          <button title="Upload File" onClick={handleUploadClick} className="p-1 hover:bg-secondaryAccent rounded text-textSecondary hover:text-textPrimary transition-colors cursor-pointer"><span className="material-symbols-outlined !text-[14px]">upload</span></button>
          <button title="Refresh" onClick={fetchNodes} className="p-1 hover:bg-secondaryAccent rounded text-textSecondary hover:text-textPrimary transition-colors cursor-pointer"><span className="material-symbols-outlined !text-[14px]">refresh</span></button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        <div className="flex items-center gap-1.5 px-4 py-1 cursor-pointer hover:bg-secondaryAccent/30 rounded-sm font-bold text-sm text-textPrimary group">
           <span className="material-symbols-outlined !text-[16px] text-textSecondary group-hover:text-textPrimary transition-colors">keyboard_arrow_down</span>
           <span>mansi_compiler</span>
        </div>
        <div className="pl-4 pr-2 mt-1 flex flex-col">
          {isCreating && (
            <div className="flex items-center py-1.5 px-2 mx-1 rounded-sm border border-accent/20 mb-1 ml-4 bg-bgMain">
              <div className={`mr-2 flex items-center justify-center ${createType === 'folder' ? 'text-textSecondary' : 'text-accent'}`}>
                {createType === 'folder' ? <span className="material-symbols-outlined !text-[16px]">folder</span> : <span className="material-symbols-outlined !text-[16px]">description</span>}
              </div>
              <input
                autoFocus
                className="flex-1 bg-transparent border-none text-sm px-1 py-0 outline-none w-full min-w-0 text-textPrimary"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onBlur={commitCreate}
                onKeyDown={onKeyDown}
                placeholder={`New ${createType}...`}
              />
            </div>
          )}
          {rootNodes.map(node => (
            <TreeNode key={node.id} node={node} nodes={nodes} level={0} />
          ))}
          {rootNodes.length === 0 && !isCreating && (
            <div className="flex flex-col items-center justify-center p-8 text-textSecondary text-sm opacity-60">
              <span className="material-symbols-outlined !text-[32px] mb-2 opacity-50">folder</span>
              <p>No files yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
