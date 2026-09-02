import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Calendar as CalendarIcon, 
  Search, 
  Wifi, 
  BatteryMedium, 
  Sparkles,
  Volume2,
  Database,
  Download
} from 'lucide-react';
import { AppNotification } from '../types';

interface AndroidHeaderProps {
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenAddLoan: () => void;
  onOpenCalendar: () => void;
  onOpenBackup: () => void;
  onOpenInstall: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeTab: 'home' | 'borrowers' | 'analytics';
  setActiveTab: (tab: 'home' | 'borrowers' | 'analytics') => void;
}

export const AndroidHeader: React.FC<AndroidHeaderProps> = ({
  unreadCount,
  onOpenNotifications,
  onOpenAddLoan,
  onOpenCalendar,
  onOpenBackup,
  onOpenInstall,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
}) => {
  const [currentTime, setCurrentTime] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      {/* Android System Status Bar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-1.5 text-xs text-slate-400 font-medium tracking-tight border-b border-slate-800/40">
        <div className="flex items-center gap-2">
          <span>{currentTime || '09:41'}</span>
          <span className="hidden sm:inline-block text-[11px] text-slate-500">•</span>
          <span className="hidden sm:inline-block text-[11px] text-slate-400">Pad 5G Tablet View</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded">
            Lending Hub
          </span>
          <Wifi className="w-3.5 h-3.5 text-slate-400" />
          <BatteryMedium className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Main Top App Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-xl shrink-0">
              ₹
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Interest & Lending</span>
              </h1>
              <p className="text-xs text-slate-400">Tracker & Due Date Reminders</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="header-install-apk-btn"
              onClick={onOpenInstall}
              title="Install App on Device / Download APK"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-emerald-300 border border-emerald-500/30 transition-all text-xs font-semibold shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Install App / APK</span>
            </button>

            <button
              id="header-backup-btn"
              onClick={onOpenBackup}
              title="Backup Data (Drive/Storage export & import)"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium"
            >
              <Database className="w-5 h-5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="hidden md:inline">Backup</span>
            </button>

            <button
              id="header-calendar-btn"
              onClick={onOpenCalendar}
              title="Google Calendar & Sync Reminders"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium"
            >
              <CalendarIcon className="w-5 h-5 sm:w-4 sm:h-4 text-sky-400" />
              <span className="hidden md:inline">Calendar Sync</span>
            </button>

            <button
              id="header-notification-btn"
              onClick={onOpenNotifications}
              title="Notifications & Alerts"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button
              id="header-add-loan-btn"
              onClick={onOpenAddLoan}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-md shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Material You pill styling with tablet responsive spacing) */}
        <div className="flex items-center gap-2 sm:gap-3 mt-3 pt-2 border-t border-slate-800/60 max-w-2xl">
          <button
            id="tab-home-btn"
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'home'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>Dashboard & Due Dates</span>
          </button>
          <button
            id="tab-borrowers-btn"
            onClick={() => setActiveTab('borrowers')}
            className={`flex-1 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'borrowers'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>Borrowers & History</span>
          </button>
          <button
            id="tab-analytics-btn"
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>Earnings Analytics</span>
          </button>
        </div>
      </div>
    </header>
  );
};
