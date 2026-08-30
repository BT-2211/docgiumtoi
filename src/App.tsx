/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { CameraScanner } from './components/CameraScanner';
import { MedicineResultView } from './components/MedicineResultView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { AppTab, MedicineAnalysisResult, ScannedRecord, SeniorSettings } from './types';
import { AlertTriangle, X } from 'lucide-react';
import { speechService } from './services/speechService';

const DEFAULT_SETTINGS: SeniorSettings = {
  autoReadSound: true,
  speechRate: 1.0,
  fontSizeScale: 1.0,
  soundFeedback: true,
};

const STORAGE_KEYS = {
  HISTORY: 'docgiumtoi_history_records',
  SETTINGS: 'docgiumtoi_senior_settings',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('camera');
  const [currentResult, setCurrentResult] = useState<MedicineAnalysisResult | null>(null);
  const [currentImagePreview, setCurrentImagePreview] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings from localStorage
  const [settings, setSettings] = useState<SeniorSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // History from localStorage
  const [historyRecords, setHistoryRecords] = useState<ScannedRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist settings
  const handleUpdateSettings = (newSettings: Partial<SeniorSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save settings to localStorage:', e);
      }
      return updated;
    });
  };

  // Dynamically scale root font size so all rem and Tailwind typography scale instantly
  useEffect(() => {
    const scale = settings.fontSizeScale || 1.0;
    document.documentElement.style.fontSize = `${100 * scale}%`;
  }, [settings.fontSizeScale]);

  // Sync mute state with settings.autoReadSound
  useEffect(() => {
    speechService.setMuted(!settings.autoReadSound);
  }, [settings.autoReadSound]);

  // Stop any reading immediately when switching tabs
  useEffect(() => {
    speechService.stop();
  }, [activeTab]);

  // Persist history
  const saveRecordToHistory = (result: MedicineAnalysisResult, imagePreview?: string) => {
    const newRecord: ScannedRecord = {
      id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      imagePreview: imagePreview,
      result: result,
    };

    setHistoryRecords((prev) => {
      const updated = [newRecord, ...prev.slice(0, 49)]; // keep up to 50 items
      try {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save history to localStorage:', e);
      }
      return updated;
    });
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistoryRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update history:', e);
      }
      return updated;
    });
  };

  const handleClearAllHistory = () => {
    setHistoryRecords([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  };

  // Analysis completion callback
  const handleAnalysisSuccess = (result: MedicineAnalysisResult, imagePreview?: string) => {
    setCurrentResult(result);
    setCurrentImagePreview(imagePreview);
    setErrorMessage(null);
    saveRecordToHistory(result, imagePreview);
  };

  const handleScanAnother = () => {
    speechService.stop();
    setCurrentResult(null);
    setCurrentImagePreview(undefined);
    setActiveTab('camera');
  };

  const handleSelectFromHistory = (record: ScannedRecord) => {
    speechService.stop();
    setCurrentResult(record.result);
    setCurrentImagePreview(record.imagePreview);
    setActiveTab('camera');
  };

  const handleSelectTab = (tab: AppTab) => {
    speechService.stop();
    setActiveTab(tab);
    if (tab === 'camera' && currentResult) {
      // If user taps camera tab while viewing a result, reset to scan view
      setCurrentResult(null);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] flex flex-col font-sans select-none"
    >
      {/* Top App Bar with sound toggle and font scaling */}
      <TopAppBar settings={settings} onUpdateSettings={handleUpdateSettings} />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-[96px] pb-[96px] flex flex-col items-center">
        {/* Error Toast Alert */}
        {errorMessage && (
          <div className="w-full max-w-2xl px-4 pt-2">
            <div className="bg-red-50 border-2 border-red-300 text-red-800 p-5 rounded-[24px] flex items-start justify-between gap-3 shadow-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" strokeWidth={2.75} />
                <div>
                  <h4 className="text-xl font-black uppercase text-red-700">Lưu ý từ trợ lý:</h4>
                  <p className="text-lg text-red-800 font-bold mt-0.5">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-500 hover:text-red-800 p-1"
                title="Đóng thông báo"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* View Switcher */}
        {activeTab === 'camera' ? (
          currentResult ? (
            <MedicineResultView
              result={currentResult}
              imagePreview={currentImagePreview}
              settings={settings}
              onScanAnother={handleScanAnother}
            />
          ) : (
            <CameraScanner
              settings={settings}
              isActive={activeTab === 'camera' && !currentResult}
              onAnalysisSuccess={handleAnalysisSuccess}
              onError={(msg) => setErrorMessage(msg)}
            />
          )
        ) : activeTab === 'history' ? (
          <HistoryView
            records={historyRecords}
            settings={settings}
            onSelectRecord={handleSelectFromHistory}
            onDeleteRecord={handleDeleteHistoryItem}
            onClearAll={handleClearAllHistory}
          />
        ) : (
          <SettingsView settings={settings} onUpdateSettings={handleUpdateSettings} />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeTab={activeTab} onSelectTab={handleSelectTab} />
    </div>
  );
}
