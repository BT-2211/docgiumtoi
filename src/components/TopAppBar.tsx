import React from 'react';
import { Volume2, VolumeX, Plus, Minus, HeartPulse } from 'lucide-react';
import { SeniorSettings } from '../types';

interface TopAppBarProps {
  settings: SeniorSettings;
  onUpdateSettings: (newSettings: Partial<SeniorSettings>) => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ settings, onUpdateSettings }) => {
  const toggleSound = () => {
    onUpdateSettings({ autoReadSound: !settings.autoReadSound });
  };

  const scaleSteps = [1.0, 1.15, 1.3, 1.45];
  const currentScale = settings.fontSizeScale || 1.0;
  const currentPercentage = Math.round(currentScale * 100);

  const increaseFontSize = () => {
    const next = scaleSteps.find((s) => s > currentScale + 0.01);
    if (next) {
      onUpdateSettings({ fontSizeScale: next });
    }
  };

  const decreaseFontSize = () => {
    const prev = [...scaleSteps].reverse().find((s) => s < currentScale - 0.01);
    if (prev) {
      onUpdateSettings({ fontSizeScale: prev });
    }
  };

  const isMinFont = currentScale <= 1.0;
  const isMaxFont = currentScale >= 1.45;

  return (
    <header
      id="top-app-bar"
      className="fixed top-0 left-0 w-full z-40 bg-[#E65F2B] px-3 sm:px-6 md:px-8 py-3 flex items-center justify-between min-h-[80px] shadow-md transition-colors"
    >
      {/* Brand logo & title */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-full flex items-center justify-center shadow-md shrink-0">
          <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 text-[#E65F2B]" strokeWidth={3} />
        </div>
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-none">
            ĐọcGiùmTôi
          </h1>
          <p className="text-xs sm:text-sm text-white/90 font-bold mt-0.5 tracking-wide line-clamp-1">
            Trợ lý đọc vỏ thuốc cho Bác
          </p>
        </div>
      </div>

      {/* Action controls: Font adjust & Sound Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Quick Text Size Adjuster with accurate percentage */}
        <div className="flex items-center bg-white/20 backdrop-blur-xs rounded-full p-1 border border-white/30 shrink-0">
          <button
            id="btn-decrease-font"
            onClick={decreaseFontSize}
            title="Giảm cỡ chữ"
            disabled={isMinFont}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Minus className="w-4 h-4" strokeWidth={3} />
          </button>
          <div className="px-2 sm:px-2.5 text-center flex flex-col items-center justify-center min-w-[52px] sm:min-w-[62px]">
            <span className="text-[10px] sm:text-xs font-black text-white/80 uppercase tracking-tighter sm:tracking-wider leading-none">CỠ CHỮ</span>
            <span className="text-xs sm:text-sm font-black text-white leading-tight">{currentPercentage}%</span>
          </div>
          <button
            id="btn-increase-font"
            onClick={increaseFontSize}
            title="Tăng cỡ chữ"
            disabled={isMaxFont}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
          </button>
        </div>

        {/* Master Voice Audio Toggle */}
        <button
          id="btn-toggle-sound"
          onClick={toggleSound}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full font-black text-xs sm:text-base transition-all active:scale-95 shadow-md cursor-pointer shrink-0 ${
            settings.autoReadSound
              ? 'bg-white text-[#E65F2B] hover:bg-white/90'
              : 'bg-white/20 text-white border border-white/40 hover:bg-white/30'
          }`}
        >
          {settings.autoReadSound ? (
            <>
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#E65F2B]" strokeWidth={3} />
              <span className="whitespace-nowrap uppercase tracking-wider hidden sm:inline">🔊 ÂM THANH: BẬT</span>
              <span className="whitespace-nowrap uppercase tracking-wider sm:hidden">🔊 BẬT</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
              <span className="whitespace-nowrap uppercase tracking-wider hidden sm:inline">🔇 ÂM THANH: TẮT</span>
              <span className="whitespace-nowrap uppercase tracking-wider sm:hidden">🔇 TẮT</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
