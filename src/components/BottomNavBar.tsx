import React from 'react';
import { Camera, History, Settings } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav
      id="bottom-nav-bar"
      className="fixed bottom-0 left-0 w-full z-40 bg-white border-t-2 border-gray-200/80 flex justify-around items-center px-3 sm:px-6 py-2.5 min-h-[84px] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      {/* Camera Tab */}
      <button
        id="tab-camera"
        onClick={() => onSelectTab('camera')}
        className={`flex flex-col items-center justify-center min-h-[68px] sm:min-h-[72px] w-1/3 mx-1.5 rounded-[20px] transition-all font-black ${
          activeTab === 'camera'
            ? 'bg-[#E65F2B] text-white shadow-lg shadow-orange-500/25 scale-[1.02]'
            : 'text-[#1A1A1A]/70 hover:bg-gray-100/80 hover:text-[#1A1A1A] active:bg-gray-200'
        }`}
      >
        <Camera className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5" strokeWidth={activeTab === 'camera' ? 2.75 : 2} />
        <span className="text-sm sm:text-base tracking-wide uppercase">Máy Ảnh</span>
      </button>

      {/* History Tab */}
      <button
        id="tab-history"
        onClick={() => onSelectTab('history')}
        className={`flex flex-col items-center justify-center min-h-[68px] sm:min-h-[72px] w-1/3 mx-1.5 rounded-[20px] transition-all font-black ${
          activeTab === 'history'
            ? 'bg-[#E65F2B] text-white shadow-lg shadow-orange-500/25 scale-[1.02]'
            : 'text-[#1A1A1A]/70 hover:bg-gray-100/80 hover:text-[#1A1A1A] active:bg-gray-200'
        }`}
      >
        <History className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5" strokeWidth={activeTab === 'history' ? 2.75 : 2} />
        <span className="text-sm sm:text-base tracking-wide uppercase">Lịch Sử</span>
      </button>

      {/* Settings Tab */}
      <button
        id="tab-settings"
        onClick={() => onSelectTab('settings')}
        className={`flex flex-col items-center justify-center min-h-[68px] sm:min-h-[72px] w-1/3 mx-1.5 rounded-[20px] transition-all font-black ${
          activeTab === 'settings'
            ? 'bg-[#E65F2B] text-white shadow-lg shadow-orange-500/25 scale-[1.02]'
            : 'text-[#1A1A1A]/70 hover:bg-gray-100/80 hover:text-[#1A1A1A] active:bg-gray-200'
        }`}
      >
        <Settings className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5" strokeWidth={activeTab === 'settings' ? 2.75 : 2} />
        <span className="text-sm sm:text-base tracking-wide uppercase">Cài Đặt</span>
      </button>
    </nav>
  );
};
