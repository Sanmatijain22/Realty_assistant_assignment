import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Video, 
  Clapperboard, 
  Images, 
  Settings as SettingsIcon, 
  Sparkles, 
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [projectCount, setProjectCount] = useState<number>(0);

  useEffect(() => {
    api.checkHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));

    api.getProjects()
      .then((jobs) => setProjectCount(jobs.filter(j => j.status === 'completed').length))
      .catch(() => {});
  }, [location.pathname]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Create Video', path: '/create', icon: Video, badge: 'Studio' },
    { name: 'My Projects', path: '/projects', icon: Clapperboard, count: projectCount },
    { name: 'Sample Gallery', path: '/gallery', icon: Images },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-[#FDFCF7] text-[#1C1917] overflow-hidden">
      {/* Dark Luxury Sidebar */}
      <aside className="w-64 bg-[#111317] border-r border-[#232732] flex flex-col z-20 select-none">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#232732]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C5A059] via-[#D4AF37] to-[#8C6D23] flex items-center justify-center shadow-lg shadow-[#C5A059]/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                ESTATE STUDIO <span className="text-[#C5A059] text-xs font-semibold px-1.5 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30">AI</span>
              </div>
              <p className="text-[11px] text-[#8E95A5] mt-0.5 tracking-wider uppercase font-medium">Architectural Cinema</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#636B7E]">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#1C202B] text-white shadow-sm border border-[#C5A059]/30'
                      : 'text-[#9CA3AF] hover:text-white hover:bg-[#181B24]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-[#C5A059]" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#C5A059] text-black">
                    {item.badge}
                  </span>
                )}
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#232732] text-[#D1D5DB]">
                    {item.count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Create Action Card */}
        <div className="p-4 mx-3 mb-4 rounded-xl bg-gradient-to-b from-[#1C202B] to-[#151821] border border-[#2B3040]">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse"></span>
            <span className="text-[11px] font-semibold text-white tracking-wide uppercase">Fast Rendering</span>
          </div>
          <p className="text-[11px] text-[#8E95A5] leading-relaxed mb-3">
            Turn photographs into 1080p cinematic video in seconds.
          </p>
          <NavLink
            to="/create"
            className="block text-center py-2 px-3 rounded-lg text-xs font-semibold bg-[#C5A059] hover:bg-[#B38E46] text-black transition-colors shadow-sm"
          >
            Create Video
          </NavLink>
        </div>

        {/* Backend Status Footer */}
        <div className="p-3.5 border-t border-[#232732] flex items-center justify-between text-[11px] text-[#8E95A5]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${apiOnline === true ? 'bg-emerald-500' : apiOnline === false ? 'bg-rose-500' : 'bg-amber-500 animate-ping'}`} />
            <span>FastAPI Backend</span>
          </div>
          <span className="text-[10px] text-[#636B7E] font-mono">v2.0.0</span>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Luxury Header */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-[#E8E5DA] px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-xs text-[#78716C]">
            <span className="font-medium text-[#1C1917]">Estate Studio</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#A8A29E]" />
            <span className="text-[#C5A059] font-medium capitalize">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <NavLink
              to="/create"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1C1917] hover:bg-[#292524] text-white text-xs font-medium transition shadow-sm border border-[#44403C]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Create Property Video</span>
            </NavLink>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#FDFCF7]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

