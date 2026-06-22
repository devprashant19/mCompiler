import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const api = axios.create({ baseURL });
const socket = io(baseURL);

const useStore = create((set, get) => ({
  nodes: [],
  openTabs: [],
  activeFileId: null,
  theme: localStorage.getItem('theme') || 'dark',
  runOutput: {
    stdout: '',
    stderr: '',
    compile_output: '',
    status: '',
    time_ms: null,
  },
  isRunning: false,
  stdin: '',
  setStdin: (val) => set({ stdin: val }),

  activeSidebarTab: 'explorer',
  setActiveSidebarTab: (tabId) => set({ activeSidebarTab: tabId }),

  outputPosition: 'bottom',
  setOutputPosition: (pos) => set({ outputPosition: pos }),

  sidebarWidth: 260,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  fetchNodes: async () => {
    try {
      const res = await api.get('/api/nodes');
      set({ nodes: res.data });
    } catch (err) {
      console.error('Failed to fetch nodes', err);
    }
  },

  createNode: async (name, type, parent_id, content = '') => {
    try {
      const res = await api.post('/api/nodes', { name, type, parent_id, content });
      set((state) => ({ nodes: [...state.nodes, res.data] }));
      return res.data;
    } catch (err) {
      console.error('Failed to create node', err);
      throw err;
    }
  },

  updateNode: async (id, updates) => {
    try {
      const res = await api.put(`/api/nodes/${id}`, updates);
      set((state) => ({
        nodes: state.nodes.map(n => n.id === id ? res.data : n),
      }));
    } catch (err) {
      console.error('Failed to update node', err);
      throw err;
    }
  },

  deleteNode: async (id) => {
    try {
      await api.delete(`/api/nodes/${id}`);
      set((state) => ({
        nodes: state.nodes.filter(n => n.id !== id && n.parent_id !== id),
        openTabs: state.openTabs.filter(t => t.id !== id),
        activeFileId: state.activeFileId === id ? null : state.activeFileId,
      }));
      get().fetchNodes(); // Re-sync to ensure cascade deletes from DB are reflected
    } catch (err) {
      console.error('Failed to delete node', err);
      throw err;
    }
  },

  uploadFile: async (file, parent_id) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (parent_id) formData.append('parent_id', parent_id);
      
      const res = await api.post('/api/upload', formData);
      set((state) => ({ nodes: [...state.nodes, res.data] }));
    } catch (err) {
      console.error('Failed to upload file', err);
      throw err;
    }
  },

  openTab: (node) => {
    if (node.type !== 'file') return;
    set((state) => {
      const exists = state.openTabs.find(t => t.id === node.id);
      if (!exists) {
        return { openTabs: [...state.openTabs, node], activeFileId: node.id };
      }
      return { activeFileId: node.id };
    });
  },

  closeTab: (id) => {
    set((state) => {
      const newTabs = state.openTabs.filter(t => t.id !== id);
      return {
        openTabs: newTabs,
        activeFileId: state.activeFileId === id ? (newTabs.length ? newTabs[newTabs.length - 1].id : null) : state.activeFileId
      };
    });
  },

  setActiveFile: (id) => set({ activeFileId: id }),

  runCode: async (code) => {
    set({ isRunning: true, runOutput: { stdout: '', stderr: '', compile_output: '', status: 'Compiling & running...', time_ms: null } });
    
    socket.emit('run', { code });

    socket.off('output');
    socket.off('exit');

    socket.on('output', (payload) => {
      set((state) => {
        const out = { ...state.runOutput };
        if (payload.type === 'stdout' || payload.type === 'system') {
          out.stdout += payload.data;
        } else if (payload.type === 'stderr') {
          out.stderr += payload.data;
        } else if (payload.type === 'compile_error') {
          out.compile_output += payload.data;
        }
        return { runOutput: out };
      });
    });

    socket.on('exit', (payload) => {
      set((state) => ({
        isRunning: false,
        runOutput: {
          ...state.runOutput,
          status: payload.status,
          time_ms: payload.time_ms
        }
      }));
      socket.off('output');
      socket.off('exit');
    });
  },

  sendInput: (data) => {
    socket.emit('input', { data });
    set((state) => {
      const out = { ...state.runOutput };
      // Echo input to stdout for visual feedback
      out.stdout += data + '\n';
      return { runOutput: out };
    });
  },

  stopRun: () => {
    socket.emit('stop');
    set((state) => ({
      isRunning: false,
      runOutput: {
        ...state.runOutput,
        status: 'Terminated by user',
      }
    }));
  },

  clearOutput: () => set({ runOutput: { stdout: '', stderr: '', compile_output: '', status: '', time_ms: null } })
}));

export default useStore;
