import useStore from '../store/useStore.js';

export default function ActivityBar() {
  const { activeSidebarTab, setActiveSidebarTab } = useStore();

  const topItems = [
    { id: 'explorer', icon: 'folder', title: 'Explorer' },
    { id: 'search', icon: 'search', title: 'Search' },
    { id: 'git', icon: 'account_tree', title: 'Git' },
    { id: 'debug', icon: 'bug_report', title: 'Debug' },
    { id: 'extensions', icon: 'extension', title: 'Extensions' }
  ];

  const bottomItems = [];

  return (
    <aside className="w-12 h-full border-r border-borderColor bg-bgSidebar/50 backdrop-blur-lg flex flex-col items-center py-2 z-40 shrink-0">
      <nav className="flex flex-col gap-2 w-full px-2">
        {topItems.map(item => (
          <div 
            key={item.id}
            onClick={() => setActiveSidebarTab(item.id)}
            className={`w-full aspect-square flex items-center justify-center rounded-md cursor-pointer transition-all ${activeSidebarTab === item.id ? 'bg-accent/20 text-accent border-l-2 border-accent' : 'text-textSecondary hover:bg-secondaryAccent/50 active:opacity-80'}`}
            title={item.title}
          >
            <span className="material-symbols-outlined !text-[20px]">{item.icon}</span>
          </div>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-2 w-full px-2 mb-2">
        {bottomItems.map(item => (
          <div 
            key={item.id}
            className="w-full aspect-square flex items-center justify-center rounded-md cursor-pointer text-textSecondary hover:bg-secondaryAccent/50 active:opacity-80 transition-all"
            title={item.title}
          >
            <span className="material-symbols-outlined !text-[20px]">{item.icon}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
