import React, { useState, useEffect } from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  AlertTriangle,
  Clock,
  Sparkles,
  Camera,
  CheckCircle2,
  BookmarkCheck,
  Calendar,
  AlertOctagon,
  ShieldCheck,
  HelpCircle,
  Pill,
  ShoppingBag,
  BookOpen,
  FileText,
  Volume2
} from 'lucide-react';
import { MedicineAnalysisResult, SeniorSettings } from '../types';
import { speechService } from '../services/speechService';

interface MedicineResultViewProps {
  result: MedicineAnalysisResult;
  imagePreview?: string;
  settings: SeniorSettings;
  onScanAnother: () => void;
}

export const MedicineResultView: React.FC<MedicineResultViewProps> = ({
  result,
  imagePreview,
  settings,
  onScanAnother,
}) => {
  const [speechState, setSpeechState] = useState<{ isSpeaking: boolean; isPaused: boolean }>({
    isSpeaking: false,
    isPaused: false,
  });
  const [showFullScript, setShowFullScript] = useState(false);
  const [hasAutoRead, setHasAutoRead] = useState(false);

  // Helper to ensure Expiration Date (HSD) is always clearly included in speech audio
  const getFullSpeechText = () => {
    let script = result.speech_script || '';
    const mentionsHSD = /hạn|hsd|exp|hết hạn|ngày sản xuất/i.test(script);
    if (!mentionsHSD && result.expiration_info) {
      let hsdSpoken = '';
      if (result.expiration_info.status === 'EXPIRED') {
        hsdSpoken = ` Cảnh báo: Sản phẩm này ĐÃ HẾT HẠN SỬ DỤNG (${result.expiration_info.expiry_date_text}), Bác tuyệt đối không được dùng nữa nhé!`;
      } else if (result.expiration_info.status === 'VALID') {
        hsdSpoken = ` Về hạn sử dụng: Sản phẩm còn hạn dùng, ${result.expiration_info.expiry_date_text} Bác nhé.`;
      } else {
        hsdSpoken = ` Về hạn sử dụng: Trên bao bì không thấy rõ ngày hết hạn, Bác nên nhờ người nhà kiểm tra lại nhé.`;
      }
      script = `${script} ${hsdSpoken}`;
    }
    return script;
  };

  useEffect(() => {
    const unsubscribe = speechService.subscribe((state) => {
      setSpeechState(state);
    });

    // Auto read aloud if enabled in settings
    let timer: any = null;
    if (settings.autoReadSound && !hasAutoRead) {
      setHasAutoRead(true);
      timer = setTimeout(() => {
        speechService.speak(getFullSpeechText(), settings.speechRate);
      }, 400);
    }

    return () => {
      if (timer) clearTimeout(timer);
      speechService.stop();
      unsubscribe();
    };
  }, [result, settings, hasAutoRead]);

  const handleToggleAudio = () => {
    if (speechState.isSpeaking) {
      if (speechState.isPaused) {
        speechService.resume();
      } else {
        speechService.pause();
      }
    } else {
      speechService.speak(getFullSpeechText(), settings.speechRate);
    }
  };

  const handleReplay = () => {
    speechService.speak(getFullSpeechText(), settings.speechRate);
  };

  const handleSpeakOnlyHSD = (e: React.MouseEvent) => {
    e.stopPropagation();
    let text = '';
    if (result.expiration_info?.status === 'EXPIRED') {
      text = `Dạ Bác ơi! Sản phẩm ${result.product_name} này ĐÃ HẾT HẠN SỬ DỤNG từ ${result.expiration_info.expiry_date_text}. Bác tuyệt đối không được dùng nữa để bảo vệ sức khỏe nhé ạ!`;
    } else if (result.expiration_info?.status === 'VALID') {
      text = `Dạ thưa Bác! Sản phẩm ${result.product_name} CÒN HẠN SỬ DỤNG đến ${result.expiration_info.expiry_date_text} Bác nhé.`;
    } else {
      text = `Dạ thưa Bác! Trên bao bì sản phẩm ${result.product_name} hiện không thấy rõ ngày hết hạn. Bác nên nhờ con cháu kiểm tra lại trước khi dùng nhé ạ.`;
    }
    speechService.speak(text, settings.speechRate);
  };

  const isExpired = result.expiration_info?.status === 'EXPIRED';
  const isValid = result.expiration_info?.status === 'VALID';
  const isUnclear = result.expiration_info?.status === 'UNCLEAR';
  const isMedicine = result.item_category === 'MEDICINE';

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 pb-28 pt-2 px-3 sm:px-4">
      {/* Visual Header Confirmation & Category */}
      <div className="flex items-center justify-between bg-[#E6F4EA] border-2 border-[#34A853]/30 rounded-[24px] px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-2.5 text-[#137333]">
          <CheckCircle2 className="w-7 h-7 shrink-0" strokeWidth={2.75} />
          <span className="text-lg sm:text-xl font-black uppercase tracking-wide">
            ĐÃ NHẬN DIỆN NHÃN BAO BÌ
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black bg-[#137333] text-white px-3 py-1.5 rounded-full uppercase tracking-wider shadow-xs">
          <BookmarkCheck className="w-4 h-4" />
          <span>Đã lưu vào tủ</span>
        </div>
      </div>

      {/* Optional Captured Image Thumbnail */}
      {imagePreview && (
        <div className="bg-white border-4 border-[#E65F2B]/15 rounded-[28px] p-4 flex items-center gap-4 shadow-sm">
          <img
            src={imagePreview}
            alt="Hình ảnh nhãn sản phẩm"
            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-[20px] border-2 border-gray-200 shrink-0"
          />
          <div className="flex-1">
            <span className="bg-[#E65F2B] text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              Ảnh vừa chụp
            </span>
            <p className="text-base text-[#1A1A1A] font-bold mt-1.5">
              Đã đọc chính xác nhãn mác và hạn sử dụng cho Bác.
            </p>
          </div>
        </div>
      )}

      {/* 1. EXPIRATION DATE BANNER (CRITICAL PROMINENCE FOR SENIORS) */}
      <div
        id="card-expiration-date"
        className={`p-6 sm:p-7 rounded-[32px] border-4 flex flex-col gap-4 shadow-md ${
          isExpired
            ? 'bg-red-600 text-white border-red-700 animate-pulse'
            : isValid
            ? 'bg-[#E6F4EA] text-[#137333] border-[#34A853]'
            : 'bg-amber-50 text-amber-900 border-amber-400'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-14 h-14 rounded-[20px] flex items-center justify-center shrink-0 shadow-md ${
                isExpired
                  ? 'bg-white text-red-600'
                  : isValid
                  ? 'bg-[#137333] text-white'
                  : 'bg-amber-400 text-amber-950'
              }`}
            >
              {isExpired ? (
                <AlertOctagon className="w-9 h-9" strokeWidth={3} />
              ) : isValid ? (
                <ShieldCheck className="w-9 h-9" strokeWidth={3} />
              ) : (
                <HelpCircle className="w-9 h-9" strokeWidth={3} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    isExpired
                      ? 'bg-white text-red-600'
                      : isValid
                      ? 'bg-[#137333] text-white'
                      : 'bg-amber-300 text-amber-900'
                  }`}
                >
                  {isExpired ? '⛔ HẾT HẠN SỬ DỤNG' : isValid ? '✅ CÒN HẠN DÙNG' : '⚠️ KHÔNG RÕ HSD'}
                </span>
                {result.expiration_info?.days_remaining_text && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isExpired ? 'bg-red-800 text-white' : isValid ? 'bg-[#137333]/15 text-[#137333]' : 'bg-amber-200 text-amber-950'
                    }`}
                  >
                    ⏳ {result.expiration_info.days_remaining_text}
                  </span>
                )}
              </div>
              <h3
                className={`text-2xl sm:text-4xl font-black mt-1.5 tracking-tight leading-tight ${
                  isExpired ? 'text-white' : isUnclear ? 'text-amber-950' : 'text-[#137333]'
                }`}
              >
                {result.expiration_info?.expiry_date_text || 'Không tìm thấy HSD trên nhãn'}
              </h3>
              {isExpired && (
                <p className="text-white/95 font-black text-base sm:text-lg mt-1 uppercase">
                  TUYỆT ĐỐI KHÔNG DÙNG SẢN PHẨM NÀY NỮA ĐỂ BẢO VỆ SỨC KHỎE!
                </p>
              )}
              {isUnclear && (
                <p className="text-amber-800 font-bold text-sm sm:text-base mt-1">
                  Ngày in trên nhãn bị mờ hoặc không in. Bác nên nhờ con cháu kiểm tra lại nhé.
                </p>
              )}
            </div>
          </div>

          {/* Dedicated Listen HSD Button */}
          <button
            id="btn-listen-hsd-only"
            onClick={handleSpeakOnlyHSD}
            className={`min-h-[54px] px-5 rounded-[20px] font-black text-base flex items-center justify-center gap-2 shrink-0 shadow-md active:scale-95 transition-all uppercase tracking-wider cursor-pointer ${
              isExpired
                ? 'bg-white text-red-600 hover:bg-gray-100'
                : isValid
                ? 'bg-[#137333] text-white hover:bg-[#0f5c29]'
                : 'bg-amber-400 text-amber-950 hover:bg-amber-500'
            }`}
          >
            <Volume2 className="w-5 h-5 stroke-[2.75]" />
            <span>🔊 Nghe Hạn Dùng</span>
          </button>
        </div>

        {/* Extra Expiration Metadata Sub-box */}
        {(result.expiration_info?.mfg_date_text || result.expiration_info?.location_found) && (
          <div
            className={`pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-bold ${
              isExpired ? 'border-white/20 text-white/90' : isValid ? 'border-green-200 text-green-900' : 'border-amber-200 text-amber-900'
            }`}
          >
            {result.expiration_info.mfg_date_text && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>{result.expiration_info.mfg_date_text}</span>
              </div>
            )}
            {result.expiration_info.location_found && (
              <div className="flex items-center gap-2">
                <span>📍 Vị trí in: {result.expiration_info.location_found}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. PRODUCT NAME & CATEGORY CARD */}
      <div
        id="card-product-identity"
        className="bg-white border-4 border-[#E65F2B]/15 rounded-[36px] sm:rounded-[40px] p-6 sm:p-8 flex flex-col gap-4 text-center shadow-xl shadow-orange-500/5"
      >
        {/* Category Pill */}
        <div className="inline-flex items-center justify-center gap-2 bg-[#FDFBF7] text-[#1A1A1A] border-2 border-gray-200 px-5 py-2 rounded-full mx-auto shadow-xs">
          {isMedicine ? (
            <Pill className="w-5 h-5 text-red-600" strokeWidth={2.75} />
          ) : (
            <ShoppingBag className="w-5 h-5 text-[#2B67E6]" strokeWidth={2.75} />
          )}
          <span className="text-sm sm:text-base font-black uppercase tracking-wider text-gray-700">
            {isMedicine ? '💊 THUỐC & DƯỢC PHẨM Y TẾ' : '🧴 HÀNG GIA DỤNG / THỰC PHẨM'}
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black uppercase text-[#E65F2B] tracking-tight leading-tight">
          {result.product_name}
        </h2>

        {/* Primary function / Purpose */}
        <div className="bg-[#F7F9FC] border-2 border-gray-200/80 rounded-[24px] p-5 sm:p-6 text-left">
          <p className="text-xs uppercase tracking-widest text-[#2B67E6] font-black mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#2B67E6]" />
            <span>CÔNG DỤNG CHÍNH</span>
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] leading-relaxed">
            {result.primary_purpose || result.primary_function}
          </p>
        </div>
      </div>

      {/* 3. HOW TO USE / HƯỚNG DẪN CÁCH DÙNG */}
      <div className="bg-[#F7F9FC] p-6 sm:p-7 rounded-[32px] border-l-8 border-[#2B67E6] shadow-sm flex flex-col gap-3">
        <p className="text-xs sm:text-sm text-[#2B67E6] font-black uppercase tracking-widest flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#2B67E6]" strokeWidth={2.75} />
          <span>HƯỚNG DẪN CÁCH DÙNG</span>
        </p>

        <div className="bg-white text-[#1A1A1A] border-2 border-gray-200/80 p-5 sm:p-6 rounded-[24px] shadow-xs">
          <p className="text-xl sm:text-2xl font-black leading-snug tracking-tight text-[#1A1A1A]">
            {result.usage_instruction || result.how_to_use}
          </p>
        </div>
      </div>

      {/* 4. SAFETY ALERT / CẢNH BÁO AN TOÀN */}
      {result.safety_alert && (
        <div
          id="card-safety-alert"
          className="bg-white border-3 border-red-300 p-6 sm:p-7 rounded-[32px] flex flex-col gap-3 shadow-sm"
        >
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-8 h-8 shrink-0" strokeWidth={3} />
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider">
              LƯU Ý & CẢNH BÁO AN TOÀN
            </h3>
          </div>

          <div className="bg-red-50/90 p-5 sm:p-6 rounded-[24px] border border-red-200">
            <p className="text-xl sm:text-2xl font-black text-red-800 leading-relaxed">
              {result.safety_alert}
            </p>
          </div>
        </div>
      )}

      {/* 5. CARING ADVICE / ASSISTANT SPEECH SCRIPT */}
      <div className="bg-[#E6F4EA] p-6 sm:p-7 rounded-[32px] border-2 border-[#34A853]/30 shadow-sm">
        <p className="text-[#137333] text-xs sm:text-sm font-black uppercase tracking-widest mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#137333]" />
          <span>LỜI TRỢ LÝ ĐỌC CHO BÁC:</span>
        </p>
        <p className="text-xl sm:text-2xl font-medium text-[#137333] italic leading-relaxed">
          "{result.speech_script}"
        </p>
      </div>

      {/* 6. SPEECH AUDIO CONTROL CARD */}
      <div
        id="card-speech-control"
        className="bg-[#E65F2B] text-white rounded-[32px] p-6 sm:p-8 flex flex-col gap-6 items-center shadow-xl shadow-orange-500/25"
      >
        <div className="text-center">
          <p className="text-sm uppercase font-black tracking-widest text-white/80 mb-1">
            GIỌNG NÓI TRỢ LÝ
          </p>
          <h3 className="text-2xl sm:text-3xl font-black uppercase leading-tight">
            {speechState.isSpeaking
              ? speechState.isPaused
                ? 'ĐANG TẠM DỪNG ĐỌC'
                : 'ĐANG ĐỌC HƯỚNG DẪN CHO BÁC...'
              : 'NHẤN ĐỂ NGHE LẠI HƯỚNG DẪN'}
          </h3>
        </div>

        {/* Dynamic Animated Sound Waveform (8 bars) */}
        <div className="w-full h-16 flex items-center justify-center gap-2 sm:gap-3 py-2 bg-white/10 rounded-[20px] border border-white/20">
          {[
            { height: 'h-6', dur: 'duration-300' },
            { height: 'h-10', dur: 'duration-500' },
            { height: 'h-14', dur: 'duration-400' },
            { height: 'h-8', dur: 'duration-300' },
            { height: 'h-12', dur: 'duration-600' },
            { height: 'h-16', dur: 'duration-450' },
            { height: 'h-10', dur: 'duration-350' },
            { height: 'h-6', dur: 'duration-500' },
          ].map((bar, i) => (
            <div
              key={i}
              className={`w-2.5 sm:w-3 bg-white rounded-full transition-all ${
                speechState.isSpeaking && !speechState.isPaused
                  ? `${bar.height} animate-pulse`
                  : 'h-3 opacity-40'
              }`}
              style={{
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>

        {/* Giant Play/Pause/Replay Button */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            id="btn-toggle-speech"
            onClick={handleToggleAudio}
            className="flex-1 min-h-[84px] bg-white text-[#E65F2B] font-black text-2xl sm:text-3xl px-6 py-4 rounded-[24px] flex items-center justify-center gap-4 hover:bg-white/95 active:scale-95 transition-all shadow-lg cursor-pointer"
          >
            {speechState.isSpeaking && !speechState.isPaused ? (
              <>
                <Pause className="w-9 h-9" strokeWidth={3} />
                <span className="uppercase tracking-tight">TẠM DỪNG ĐỌC</span>
              </>
            ) : (
              <>
                <Play className="w-9 h-9 fill-current" strokeWidth={3} />
                <span className="uppercase tracking-tight">{speechState.isPaused ? 'TIẾP TỤC ĐỌC' : '🔊 ĐỌC CHO BÁC NGHE'}</span>
              </>
            )}
          </button>

          {/* Replay button */}
          <button
            id="btn-replay-speech"
            onClick={handleReplay}
            title="Đọc lại từ đầu"
            className="sm:w-28 min-h-[64px] sm:min-h-[84px] bg-white/20 text-white font-black text-base sm:text-lg rounded-[24px] border border-white/30 flex flex-col items-center justify-center gap-1 hover:bg-white/30 active:scale-95 transition-all shadow-sm uppercase tracking-wider cursor-pointer"
          >
            <RotateCcw className="w-6 h-6 text-white" strokeWidth={2.75} />
            <span className="text-xs">ĐỌC LẠI</span>
          </button>
        </div>

        {/* Expandable full speech script for verification */}
        <div className="w-full border-t border-white/20 pt-4">
          <button
            id="btn-toggle-script"
            onClick={() => setShowFullScript(!showFullScript)}
            className="flex items-center justify-between w-full text-white/90 text-base sm:text-lg font-bold hover:underline"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span>{showFullScript ? 'Ẩn lời thoại chi tiết' : 'Xem toàn bộ lời đọc của trợ lý'}</span>
            </span>
            <span>{showFullScript ? '▲' : '▼'}</span>
          </button>

          {showFullScript && (
            <div className="mt-3 bg-white/10 p-4 rounded-[20px] border border-white/20 text-lg leading-relaxed text-white">
              <p className="italic font-medium">"{result.speech_script}"</p>
            </div>
          )}
        </div>
      </div>

      {/* 7. ACTION: SCAN ANOTHER ITEM */}
      <div className="pt-2">
        <button
          id="btn-scan-another"
          onClick={onScanAnother}
          className="w-full min-h-[76px] bg-[#E65F2B] text-white font-black text-2xl px-6 py-4 rounded-[28px] flex items-center justify-center gap-3 hover:bg-[#d85320] active:scale-95 transition-all shadow-lg shadow-orange-500/20 uppercase tracking-tight"
        >
          <Camera className="w-8 h-8 text-white" strokeWidth={2.75} />
          <span>CHỤP HOẶC TRA CỨU ĐỒ KHÁC</span>
        </button>
      </div>
    </div>
  );
};
