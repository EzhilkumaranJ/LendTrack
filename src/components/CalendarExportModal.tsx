import React from 'react';
import { 
  X, 
  Calendar, 
  Download, 
  ExternalLink, 
  Check, 
  Sparkles, 
  CalendarCheck2, 
  Clock, 
  Info 
} from 'lucide-react';
import { LoanEntry } from '../types';
import { 
  formatCurrency, 
  generateGoogleCalendarUrl, 
  generateIcsFile, 
  downloadIcs 
} from '../utils/dateUtils';

interface CalendarExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: LoanEntry[];
  selectedLoan?: LoanEntry | null;
}

export const CalendarExportModal: React.FC<CalendarExportModalProps> = ({
  isOpen,
  onClose,
  loans,
  selectedLoan,
}) => {
  if (!isOpen) return null;

  const activeLoans = loans.filter((l) => l.status === 'active');

  const downloadAllIcs = () => {
    // Combine all events into one iCalendar file
    const events = activeLoans.map((loan) => {
      const dateFormatted = loan.nextInterestDueDate.replace(/-/g, '');
      const uid = `${loan.id}-${Date.now()}@lendingtracker.app`;
      return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${dateFormatted}`,
        `DTEND;VALUE=DATE:${dateFormatted}`,
        `SUMMARY:💰 Interest Due: ${loan.borrowerName} (${formatCurrency(loan.interestPerPeriod)})`,
        `DESCRIPTION:Interest collection of ${formatCurrency(loan.interestPerPeriod)} from ${loan.borrowerName}. Outstanding principal: ${formatCurrency(loan.currentOutstandingPrincipal)}.`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT9H',
        'ACTION:DISPLAY',
        `DESCRIPTION:Reminder: Interest due today from ${loan.borrowerName}`,
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n');
    }).join('\r\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Lending Tracker App//All Reminders//EN',
      'CALSCALE:GREGORIAN',
      events,
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `all-lending-interest-reminders.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div 
        id="calendar-modal-content"
        className="bg-slate-900 border border-slate-800 w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Google Calendar & Device Reminders</h2>
              <p className="text-xs text-slate-400">Sync due dates directly with 1-click or standard .ICS file</p>
            </div>
          </div>
          <button
            id="close-calendar-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Info Banner */}
        <div className="p-4 bg-sky-950/30 border-b border-slate-800 flex items-start gap-3">
          <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-white block mb-0.5">Instant Calendar Reminders</span>
            Click <strong className="text-sky-300">"Add to Google Calendar"</strong> on any entry to immediately add the event to your Google Calendar app with alarms, or download the combined <strong className="text-emerald-300">.ICS</strong> file to import all loan due dates into your Android device at once.
          </div>
        </div>

        {/* Loan Calendar Items List */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Due Date Schedule ({activeLoans.length})
            </h3>
            {activeLoans.length > 0 && (
              <button
                onClick={downloadAllIcs}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All (.ICS)</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {activeLoans.map((loan) => {
              const googleCalUrl = generateGoogleCalendarUrl(loan);

              return (
                <div
                  key={loan.id}
                  className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full bg-gradient-to-tr ${loan.borrowerAvatarColor}`}
                      />
                      <h4 className="text-xs font-bold text-white">{loan.borrowerName}</h4>
                      <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                        {loan.nextInterestDueDate}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 pl-5">
                      Interest: <span className="text-emerald-400 font-bold">{formatCurrency(loan.interestPerPeriod)}</span> • Bal: {formatCurrency(loan.currentOutstandingPrincipal)} • Recurrence: <span className="capitalize">{loan.recurrence}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <a
                      href={googleCalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-sky-400 bg-sky-950/50 hover:bg-sky-900/80 border border-sky-800/60 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Google Cal</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>

                    <button
                      onClick={() => downloadIcs(loan)}
                      title="Download individual .ICS"
                      className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
