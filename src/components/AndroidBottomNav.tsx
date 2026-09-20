import React from 'react';
import { LayoutDashboard, Users, BarChart3, Plus, Bell, Database } from 'lucide-react';

interface AndroidBottomNavProps {
  activeTab: 'home' | 'borrowers' | 'analytics';
  setActiveTab: (tab: 'home' | 'borrowers' | 'analytics') => void;
  onOpenAddLoan: () => void;
  onOpenNotifications: () => void;
  onOpenBackup: () => void;
  unreadNotifCount: number;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddLoan,
  onOpenNotifications,
  onOpenBackup,
  unreadNotifCount,
}) => {
  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 pb-safe shadow-2xl"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Tab 1: Dues / Dashboard */}
        <button
          id="mobile-nav-dues"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all ${
            activeTab === 'home'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeTab === 'home' ? 'bg-emerald-500/20' : ''}`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Dues</span>
        </button>

        {/* Tab 2: Borrowers */}
        <button
          id="mobile-nav-borrowers"
          onClick={() => setActiveTab('borrowers')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all ${
            activeTab === 'borrowers'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeTab === 'borrowers' ? 'bg-emerald-500/20' : ''}`}>
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Borrowers</span>
        </button>

        {/* Center Quick Action: Add Loan */}
        <div className="flex-1 flex justify-center -mt-4">
          <button
            id="mobile-nav-add-btn"
            onClick={onOpenAddLoan}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center active:scale-95 transition-all border-2 border-slate-900"
            title="Add New Loan Entry"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 3: Analytics */}
        <button
          id="mobile-nav-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all ${
            activeTab === 'analytics'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-emerald-500/20' : ''}`}>
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Stats</span>
        </button>

        {/* Tab 4: Notifications / Alerts */}
        <button
          id="mobile-nav-alerts"
          onClick={onOpenNotifications}
          className="flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl text-slate-400 hover:text-slate-200 transition-all relative"
        >
          <div className="p-1 rounded-xl relative">
            <Bell className="w-5 h-5" />
            {unreadNotifCount > 0 && (
              <span className="absolute 0 top-0.5 right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-slate-900" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Alerts</span>
        </button>
      </div>
    </nav>
  );
};
