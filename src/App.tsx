import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  AlertCircle
} from 'lucide-react';
import { LoanEntry, AppNotification, PaymentRecord, RecurrenceType, PaymentType } from './types';
import { 
  getStoredLoans, 
  saveStoredLoans, 
  getStoredNotifications, 
  saveStoredNotifications, 
  calculateMonthlyEarningsStats 
} from './utils/storage';
import { 
  formatCurrency, 
  computeNextDueDate, 
  formatDueDateBadge 
} from './utils/dateUtils';
import { playNotificationSound, triggerSystemNotification } from './utils/notifications';

import { AndroidHeader } from './components/AndroidHeader';
import { DashboardStats } from './components/DashboardStats';
import { EarningsVisualization } from './components/EarningsVisualization';
import { UpcomingInterestList } from './components/UpcomingInterestList';
import { BorrowersList } from './components/BorrowersList';
import { AddLoanModal } from './components/AddLoanModal';
import { PaymentModal } from './components/PaymentModal';
import { PaymentHistoryModal } from './components/PaymentHistoryModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { CalendarExportModal } from './components/CalendarExportModal';
import { BackupModal } from './components/BackupModal';
import { PWAInstallModal } from './components/PWAInstallModal';

export default function App() {
  const [loans, setLoans] = useState<LoanEntry[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'borrowers' | 'analytics'>('home');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [activePaymentLoan, setActivePaymentLoan] = useState<LoanEntry | null>(null);
  const [activePaymentType, setActivePaymentType] = useState<PaymentType>('interest');
  const [activeHistoryLoan, setActiveHistoryLoan] = useState<LoanEntry | null>(null);

  // Load initial data
  useEffect(() => {
    const loadedLoans = getStoredLoans();
    const loadedNotifs = getStoredNotifications();
    setLoans(loadedLoans);
    setNotifications(loadedNotifs);

    // Evaluate current due dates and trigger reminders
    evaluateReminders(loadedLoans, loadedNotifs);
  }, []);

  const evaluateReminders = (currentLoans: LoanEntry[], currentNotifs: AppNotification[]) => {
    const todayStr = '2026-08-31';
    let newNotifs = [...currentNotifs];
    let triggeredUrgent = false;

    currentLoans.forEach((loan) => {
      if (loan.status !== 'active') return;
      // If reminders are muted or muted for this period, skip generating reminder alerts
      if (loan.remindersMuted) return;
      if (loan.remindersMutedUntil && loan.nextInterestDueDate <= loan.remindersMutedUntil) return;

      const badge = formatDueDateBadge(loan.nextInterestDueDate);
      
      if (badge.status === 'overdue') {
        const notifId = `overdue-${loan.id}-${loan.nextInterestDueDate}`;
        if (!newNotifs.some((n) => n.id === notifId)) {
          newNotifs.unshift({
            id: notifId,
            loanId: loan.id,
            borrowerName: loan.borrowerName,
            title: `⚠️ Overdue Alert: ${loan.borrowerName}`,
            message: `Interest payment of ${formatCurrency(loan.interestPerPeriod)} is ${badge.text}. Outstanding: ${formatCurrency(loan.currentOutstandingPrincipal)}.`,
            type: 'overdue',
            date: new Date().toISOString(),
            dueDate: loan.nextInterestDueDate,
            amountDue: loan.interestPerPeriod,
            isRead: false,
          });
          triggeredUrgent = true;
        }
      } else if (badge.status === 'today') {
        const notifId = `today-${loan.id}-${loan.nextInterestDueDate}`;
        if (!newNotifs.some((n) => n.id === notifId)) {
          newNotifs.unshift({
            id: notifId,
            loanId: loan.id,
            borrowerName: loan.borrowerName,
            title: `🔔 Interest Due Today: ${loan.borrowerName}`,
            message: `${loan.borrowerName} has scheduled interest of ${formatCurrency(loan.interestPerPeriod)} due today.`,
            type: 'due_today',
            date: new Date().toISOString(),
            dueDate: loan.nextInterestDueDate,
            amountDue: loan.interestPerPeriod,
            isRead: false,
          });
        }
      }
    });

    if (newNotifs.length !== currentNotifs.length) {
      setNotifications(newNotifs);
      saveStoredNotifications(newNotifs);
      if (triggeredUrgent) {
        playNotificationSound('urgent');
      }
    }
  };

  // Add new loan entry
  const handleAddLoan = (newLoan: LoanEntry) => {
    const updated = [newLoan, ...loans];
    setLoans(updated);
    saveStoredLoans(updated);

    // Create confirmation notification
    const notif: AppNotification = {
      id: `new-loan-${newLoan.id}`,
      loanId: newLoan.id,
      borrowerName: newLoan.borrowerName,
      title: `New Loan Added: ${newLoan.borrowerName}`,
      message: `Lent ${formatCurrency(newLoan.principalAmount)} at ${newLoan.interestRate}% with next due date on ${newLoan.nextInterestDueDate}.`,
      type: 'upcoming',
      date: new Date().toISOString(),
      dueDate: newLoan.nextInterestDueDate,
      amountDue: newLoan.interestPerPeriod,
      isRead: false,
    };
    const updatedNotifs = [notif, ...notifications];
    setNotifications(updatedNotifs);
    saveStoredNotifications(updatedNotifs);
    playNotificationSound('reminder');
  };

  // Record payment & update repeating due date
  const handleRecordPayment = (
    loanId: string,
    payment: PaymentRecord,
    newOutstandingPrincipal: number,
    nextDueDate: string,
    newStatus: 'active' | 'settled',
    muteReminders?: boolean
  ) => {
    const isSkip = payment.type === 'skip_interest';
    const updated = loans.map((loan) => {
      if (loan.id === loanId) {
        return {
          ...loan,
          currentOutstandingPrincipal: newOutstandingPrincipal,
          nextInterestDueDate: nextDueDate,
          status: newStatus,
          remindersMutedUntil: muteReminders ? nextDueDate : undefined,
          payments: [payment, ...loan.payments],
          updatedAt: new Date().toISOString(),
        };
      }
      return loan;
    });

    setLoans(updated);
    saveStoredLoans(updated);

    // Clear any existing overdue/today notifications for this loan if paid or skipped
    const filteredNotifs = notifications.filter(
      (n) => !(n.loanId === loanId && (n.type === 'overdue' || n.type === 'due_today'))
    );

    // Update notification
    const targetLoan = loans.find((l) => l.id === loanId);
    if (targetLoan) {
      const notif: AppNotification = {
        id: `pay-${payment.id}`,
        loanId: targetLoan.id,
        borrowerName: targetLoan.borrowerName,
        title: isSkip
          ? `⏭️ Interest Skipped: ${targetLoan.borrowerName}`
          : `💰 Payment Received: ${targetLoan.borrowerName}`,
        message: isSkip
          ? `Skipped cycle of ${formatCurrency(payment.amount)} (${payment.notes || 'Waived'}). Next cycle due on ${nextDueDate}. Principal preserved.`
          : `Collected ${formatCurrency(payment.amount)} (${payment.type}). Next due date is ${nextDueDate}.`,
        type: 'payment_received',
        date: new Date().toISOString(),
        amountDue: isSkip ? 0 : payment.amount,
        isRead: false,
      };
      const updatedNotifs = [notif, ...filteredNotifs];
      setNotifications(updatedNotifs);
      saveStoredNotifications(updatedNotifs);
    }
  };

  const handleOpenPaymentModal = (loan: LoanEntry, initialType: PaymentType = 'interest') => {
    setActivePaymentType(initialType);
    setActivePaymentLoan(loan);
  };

  // Delete loan
  const handleDeleteLoan = (loanId: string) => {
    const updated = loans.filter((l) => l.id !== loanId);
    setLoans(updated);
    saveStoredLoans(updated);
  };

  // Import Backup Data (Drive/Storage backup update)
  const handleImportData = (
    newLoans: LoanEntry[],
    newNotifications: AppNotification[] = [],
    mode: 'replace' | 'merge' = 'replace'
  ) => {
    let finalLoans: LoanEntry[] = [];
    if (mode === 'replace') {
      finalLoans = newLoans;
    } else {
      // Merge mode: replace entries with matching IDs, append new ones
      const existingMap = new Map<string, LoanEntry>(loans.map((l) => [l.id, l]));
      newLoans.forEach((nl) => {
        existingMap.set(nl.id, nl);
      });
      finalLoans = Array.from(existingMap.values());
    }

    setLoans(finalLoans);
    saveStoredLoans(finalLoans);

    // Merge or set notifications
    let finalNotifs = notifications;
    if (newNotifications.length > 0) {
      if (mode === 'replace') {
        finalNotifs = newNotifications;
      } else {
        const notifMap = new Map<string, AppNotification>(notifications.map((n) => [n.id, n]));
        newNotifications.forEach((nn) => notifMap.set(nn.id, nn));
        finalNotifs = Array.from(notifMap.values());
      }
      setNotifications(finalNotifs);
      saveStoredNotifications(finalNotifs);
    }

    // Re-evaluate reminders with newly imported data
    evaluateReminders(finalLoans, finalNotifs);
  };

  // Notification actions
  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const handleClearAllNotifs = () => {
    setNotifications([]);
    saveStoredNotifications([]);
  };

  const handleSelectLoanFromNotif = (loanId: string) => {
    const target = loans.find((l) => l.id === loanId);
    if (target) {
      setActiveHistoryLoan(target);
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;
  const currentMonthKey = '2026-08';
  const monthlyStats = calculateMonthlyEarningsStats(loans);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-emerald-500 selection:text-white">
      {/* Android Top Header */}
      <AndroidHeader
        unreadCount={unreadNotifCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAddLoan={() => setIsAddLoanOpen(true)}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenInstall={() => setIsInstallOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
        {/* Banner Alert for Overdue or Due Today */}
        {loans.some((l) => l.status === 'active' && l.nextInterestDueDate <= '2026-08-31') && (
          <div 
            id="due-alert-banner"
            className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl animate-pulse shrink-0">
                <AlertCircle className="w-5 h-5 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="font-bold text-amber-200 text-sm block">Interest Collections Pending</span>
                <span className="text-slate-300 text-xs mt-0.5">
                  You have payments due today or overdue. Remind borrowers or record collections below.
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shrink-0"
            >
              View Alerts
            </button>
          </div>
        )}

        {/* Tab 1: Home Dashboard - Due Date Alert List */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Upcoming Interest Schedule Sorted By Date */}
            <UpcomingInterestList
              loans={loans}
              onOpenPayment={handleOpenPaymentModal}
              onViewHistory={(loan) => setActiveHistoryLoan(loan)}
              onOpenCalendarModal={(loan) => setIsCalendarOpen(true)}
            />
          </div>
        )}

        {/* Tab 2: Borrowers & History */}
        {activeTab === 'borrowers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Borrower Portfolio</h2>
                <p className="text-xs text-slate-400">All active loans, repayment terms & collateral records</p>
              </div>
              <button
                onClick={() => setIsAddLoanOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Borrower</span>
              </button>
            </div>

            <BorrowersList
              loans={loans}
              onOpenPayment={handleOpenPaymentModal}
              onViewHistory={(loan) => setActiveHistoryLoan(loan)}
              onDeleteLoan={handleDeleteLoan}
              onOpenAddLoan={() => setIsAddLoanOpen(true)}
              onOpenBackup={() => setIsBackupOpen(true)}
            />
          </div>
        )}

        {/* Tab 3: Detailed Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-white">Lending Portfolio Analytics</h2>
              <p className="text-xs text-slate-400">Detailed cash flow projections and collection performance</p>
            </div>

            <DashboardStats loans={loans} currentMonthKey={currentMonthKey} />

            <EarningsVisualization stats={monthlyStats} />

            {/* Recurrence & Plan Breakdown Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-white">Repeating Interest Schedule Distribution</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Monthly Cycle</span>
                  <span className="text-base font-bold text-emerald-400">
                    {loans.filter((l) => l.recurrence === 'monthly' && l.status === 'active').length} Active
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Weekly / Biweekly</span>
                  <span className="text-base font-bold text-sky-400">
                    {loans.filter((l) => (l.recurrence === 'weekly' || l.recurrence === 'biweekly') && l.status === 'active').length} Active
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Custom Day Intervals</span>
                  <span className="text-base font-bold text-amber-400">
                    {loans.filter((l) => l.recurrence === 'custom_days' && l.status === 'active').length} Active
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Settled Loans</span>
                  <span className="text-base font-bold text-teal-400">
                    {loans.filter((l) => l.status === 'settled').length} Cleared
                  </span>
                </div>
              </div>
            </div>

            {/* Cloud Storage & Backup Management Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">💾</span>
                  Data Backup & Drive Archival
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Export complete records as a portable JSON file to save on Google Drive, Dropbox, or device storage, or import back to restore data.
                </p>
              </div>
              <button
                id="analytics-backup-btn"
                onClick={() => setIsBackupOpen(true)}
                className="self-start sm:self-auto flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 shrink-0"
              >
                <span>Manage Backup & Restore</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) for Quick Add */}
      <button
        id="fab-add-loan"
        onClick={() => setIsAddLoanOpen(true)}
        className="fixed right-5 bottom-5 z-20 w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Add New Loan Entry"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Modals */}
      {isAddLoanOpen && (
        <AddLoanModal
          isOpen={isAddLoanOpen}
          onClose={() => setIsAddLoanOpen(false)}
          onAddLoan={handleAddLoan}
        />
      )}

      {activePaymentLoan && (
        <PaymentModal
          loan={activePaymentLoan}
          isOpen={!!activePaymentLoan}
          initialType={activePaymentType}
          onClose={() => setActivePaymentLoan(null)}
          onRecordPayment={handleRecordPayment}
        />
      )}

      {activeHistoryLoan && (
        <PaymentHistoryModal
          loan={activeHistoryLoan}
          isOpen={!!activeHistoryLoan}
          onClose={() => setActiveHistoryLoan(null)}
          onOpenPayment={(loan) => {
            setActiveHistoryLoan(null);
            handleOpenPaymentModal(loan, 'interest');
          }}
        />
      )}

      {isNotificationsOpen && (
        <NotificationCenterModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClearAll={handleClearAllNotifs}
          onSelectLoan={handleSelectLoanFromNotif}
          loans={loans}
        />
      )}

      {isCalendarOpen && (
        <CalendarExportModal
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          loans={loans}
        />
      )}

      {isBackupOpen && (
        <BackupModal
          isOpen={isBackupOpen}
          onClose={() => setIsBackupOpen(false)}
          loans={loans}
          notifications={notifications}
          onImportData={handleImportData}
        />
      )}

      {isInstallOpen && (
        <PWAInstallModal
          isOpen={isInstallOpen}
          onClose={() => setIsInstallOpen(false)}
        />
      )}
    </div>
  );
}
