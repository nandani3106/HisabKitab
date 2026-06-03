import { Link, useLocation } from 'react-router-dom';
import { LogOut, User, Layers, BarChart3, History } from 'lucide-react';

export default function BottomNavbar({ onLogout }) {
  const location = useLocation();

  const navItems = [
    { label: 'Blocks', icon: Layers, path: '/' },
    { label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { label: 'History', icon: History, path: '/history' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[92%] max-w-md bg-deep-purple/90 backdrop-blur-xl border border-purple-rose/85 rounded-2xl py-3 px-4 shadow-2xl flex justify-between items-center z-50 transition-all duration-300">
      {navItems.map((item) => {
        const Icon = item.icon;
        // Match path exactly, or matches subpaths for blocks (e.g. /block/1)
        const isActive = item.path === '/' 
          ? (location.pathname === '/' || location.pathname.startsWith('/block/'))
          : location.pathname === item.path;

        return (
          <Link
            key={item.label}
            to={item.path}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive 
                ? 'text-peach-orange scale-105 font-bold' 
                : 'text-light-blush/50 hover:text-light-blush hover:scale-102'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-extrabold uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}

      {/* Logout Action */}
      <button
        onClick={onLogout}
        className="flex flex-col items-center gap-1 text-light-blush/50 hover:text-rose-pink hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-[9px] font-extrabold uppercase tracking-wider">Logout</span>
      </button>
    </nav>
  );
}
