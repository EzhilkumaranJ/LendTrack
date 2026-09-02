import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Database, 
  HardDrive, 
  Cloud, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  RefreshCw, 
  FileUp, 
  Layers, 
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { LoanEntry, AppNotification, AppBackupData } from '../types';
import { 
  createBackupPayload, 
  downloadBackupFile, 
  parseAndValidateBackup 
} from '../utils/storage';
import { formatCurrency } from '../utils/dateUtils';
import { playNotificationSound } from '../utils/notifications';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: LoanEntry[];
  notifications: AppNotification[];
  onImportData: (newLoans: LoanEntry[], newNotifications?: AppNotification[], mode?: 'replace' | 'merge') => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  loans,
  notifications,
  onImportData,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<AppBackupData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const totalPrincipalOut = loans
    .filter((l) => l.status === 'active')
    .reduce((sum, l) => sum + l.currentOutstandingPrincipal, 0);

  const totalPaymentsCount = loans.reduce((sum, l) => sum + l.payments.length, 0);

  // Handle export download
  const handleExport = () => {
    const payload = createBackupPayload(loans, notifications);
    downloadBackupFile(payload);
    setExportSuccess(true);
    playNotificationSound('payment');
    setTimeout(() => setExportSuccess(false), 4000);
  };

  // Handle file reading
  const processFile = (file: File) => {
    setSelectedFile(file);
    setParseError(null);
    setParsedPreview(null);
    setIsSuccess(false);

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setParseError('Please upload a valid .json backup file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const res = parseAndValidateBackup(content);
      if (res.success && res.data) {
        setParsedPreview(res.data);
      } else {
        setParseError(res.error || 'Failed to parse backup file.');
      }
    };
    reader.onerror = () => {
      setParseError('Error reading file from disk.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedPreview) return;

    onImportData(
      parsedPreview.loans,
      parsedPreview.notifications || [],
      importMode
    );

    setIsSuccess(true);
    playNotificationSound('urgent');

    setTimeout(() => {
      onClose();
      setIsSuccess(false);
      setSelectedFile(null);
      setParsedPreview(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="backup-storage-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                Backup & Cloud Storage
              </h2>
              <p className="text-xs text-slate-400">Export file for Google Drive, iCloud, or update records</p>
            </div>
          </div>
          <button
            id="close-backup-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1.5">
          <button
            id="backup-tab-export"
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup File</span>
          </button>
          <button
            id="backup-tab-import"
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'import'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import & Restore Data</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'export' ? (
            /* EXPORT TAB */
            <div className="space-y-4">
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-sky-400" /> Current Dataset Snapshot
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    JSON v1.0
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] uppercase text-slate-400 block">Total Loans</span>
                    <span className="text-base font-extrabold text-white">{loans.length}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] uppercase text-slate-400 block">Active Principal</span>
                    <span className="text-xs font-bold text-emerald-400">{formatCurrency(totalPrincipalOut)}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] uppercase text-slate-400 block">Payment Logs</span>
                    <span className="text-base font-extrabold text-cyan-400">{totalPaymentsCount}</span>
                  </div>
                </div>
              </div>

              {/* Cloud Storage Guide */}
              <div className="bg-sky-950/20 border border-sky-800/40 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-start gap-2.5">
                  <Cloud className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-sky-200 leading-relaxed">
                    <strong className="text-white block mb-0.5">Google Drive & Cloud Storage Compatible</strong>
                    Downloading this file produces a self-contained <code className="bg-slate-900 text-sky-300 px-1 py-0.5 rounded font-mono text-[11px]">.json</code> file. You can upload this directly into your Google Drive, Dropbox, iCloud, or email it to yourself. Whenever you switch phones or need to restore records, upload it back here.
                  </div>
                </div>
              </div>

              {/* Export Success Alert */}
              {exportSuccess && (
                <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-emerald-200 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Backup file downloaded successfully! Store it safely on your Google Drive or local storage.</span>
                </div>
              )}

              {/* Export Button */}
              <button
                id="download-backup-btn"
                onClick={handleExport}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-600/30 transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Complete Backup (.json)</span>
              </button>
            </div>
          ) : (
            /* IMPORT TAB */
            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : selectedFile
                    ? 'border-slate-700 bg-slate-950/80 hover:border-slate-600'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {selectedFile ? selectedFile.name : 'Click or Drag & Drop Backup File'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Supports <code className="text-slate-300 font-mono">.json</code> backup files from Google Drive or device storage
                    </span>
                  </div>
                </div>
              </div>

              {/* Parsing Error */}
              {parseError && (
                <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-rose-100">Unable to load file:</strong>
                    <span>{parseError}</span>
                  </div>
                </div>
              )}

              {/* Parsed File Preview */}
              {parsedPreview && (
                <div className="bg-slate-950/90 rounded-2xl p-4 border border-emerald-500/40 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Valid Backup File Verified
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Exported: {parsedPreview.exportedAt.split('T')[0]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block">Loans to Import</span>
                      <span className="font-bold text-white">{parsedPreview.loans.length} records</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block">Active Borrowers</span>
                      <span className="font-bold text-emerald-400">{parsedPreview.activeLoansCount} active</span>
                    </div>
                  </div>

                  {/* Import Strategy / Mode selection */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Import Strategy
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setImportMode('replace')}
                        className={`p-2 rounded-xl text-xs font-bold text-left border transition-all ${
                          importMode === 'replace'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-bold">Restore & Replace</div>
                        <div className="text-[10px] font-normal opacity-80">Overwrites current local entries with backup</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImportMode('merge')}
                        className={`p-2 rounded-xl text-xs font-bold text-left border transition-all ${
                          importMode === 'merge'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-bold">Merge / Append</div>
                        <div className="text-[10px] font-normal opacity-80">Combines backup entries with existing records</div>
                      </button>
                    </div>
                  </div>

                  {/* Confirm Import Button */}
                  <button
                    id="confirm-import-backup-btn"
                    onClick={handleConfirmImport}
                    disabled={isSuccess}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    {isSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 animate-spin" />
                        <span>Data Updated & Restored!</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Apply & Update Tracker Data</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Safe local processing
          </span>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
