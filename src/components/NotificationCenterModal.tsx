import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  Volume2, 
  CheckCheck, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  ShieldAlert, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { AppNotification, LoanEntry } from '../types';
import { playNotificationSound, requestNotificationPermission, triggerSystemNotification } from '../utils/notifications';
import { formatCurrency } from '../utils/dateUtils';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectLoan: (loanId: string) => void;
  loans: LoanEntry[];
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectLoan,
  loans,
}) => {
  const [permStatus, setPermStatus] = useState<string>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermStatus(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnableSystemNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermStatus(result);
    if (result === 'granted') {
      playNotificationSound('reminder');
      triggerSystemNotification('Lending Reminders Enabled', {
        body: 'You will receive notifications for upcoming and overdue interest due dates.',
      });
    }
  };

  const handleTestSound = (type: 'reminder' | 'payment' | 'urgent') => {
    playNotificationSound(type);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div 
        id="notification-modal-content"
        className="bg-slate-900 border border-slate-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Notifications & Alerts</h2>
              <p className="text-xs text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread reminders` : 'All alerts up to date'}
              </p>
            </div>
          </div>
          <button
            id="close-notifications-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Notification Permission Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">Device Reminders</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                permStatus === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {permStatus === 'granted' ? 'Active' : 'Prompt'}
              </span>
            </div>

            {permStatus !== 'granted' && (
              <button
                onClick={handleEnableSystemNotifications}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline"
              >
                Enable Push Alerts
              </button>
            )}
          </div>

          {/* Sound Synthesizer Test Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-900">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-slate-500" /> Audio Chimes:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleTestSound('reminder')}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg transition-colors"
              >
                Normal
              </button>
              <button
                onClick={() => handleTestSound('urgent')}
                className="text-[11px] bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 px-2 py-1 rounded-lg transition-colors"
              >
                Overdue
              </button>
              <button
                onClick={() => handleTestSound('payment')}
                className="text-[11px] bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/40 px-2 py-1 rounded-lg transition-colors"
              >
                Paid
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              Reminder Stream
            </span>
            {notifications.length > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <button
                  onClick={onMarkAllAsRead}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark read
                </button>
                <button
                  onClick={onClearAll}
                  className="text-rose-400 hover:text-rose-300"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 text-xs text-slate-400">
              <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              <span>No notifications in the tray right now.</span>
            </div>
          ) : (
            notifications.map((notif) => {
              const isOverdue = notif.type === 'overdue';
              const isToday = notif.type === 'due_today';

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    onMarkAsRead(notif.id);
                    if (notif.loanId) {
                      onSelectLoan(notif.loanId);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    !notif.isRead
                      ? isOverdue
                        ? 'bg-rose-950/30 border-rose-800/80 shadow-md'
                        : isToday
                        ? 'bg-amber-950/30 border-amber-500/60 shadow-md'
                        : 'bg-slate-800/80 border-slate-700'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          !notif.isRead
                            ? isOverdue
                              ? 'bg-rose-500 animate-ping'
                              : isToday
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-emerald-400'
                            : 'bg-slate-600'
                        }`}
                      />
                      <h4 className="text-xs font-bold text-white tracking-tight">{notif.title}</h4>
                    </div>
                    {notif.amountDue && (
                      <span className="text-xs font-extrabold text-emerald-400">
                        {formatCurrency(notif.amountDue)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-1 pl-4 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pl-4">
                    <span>{new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5 hover:underline">
                      View Borrower <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
