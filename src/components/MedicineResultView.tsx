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
  Volume2,
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

  // Helper to ensure Expiration Date (HSD) is always clearly included in speech audio
  const getFullSpeechText = () => {
    let script = result.speech_text || result.speech_script || '';
    if (result.status === 'unclear' || result.status === 'not_found') {
      return script;
    }
    const mentionsHSD = /hạn|hsd|exp|hết hạn|ngày sản xuất/i.test(script);
    if (!mentionsHSD && result.expiration_info) {
      let hsdSpoken = '';
      if (result.expiration_info.status === 'EXPIRED') {
        hsdSpoken = ` Cảnh báo: Sản phẩm này ĐÃ HẾT HẠN SỬ DỤNG (${result.expiration_info.expiry_date_text}), Bác tuyệt đối không được dùng nữa ạ!`;
      } else if (result.expiration_info.status === 'VALID') {
        hsdSpoken = ` Về hạn sử dụng: Sản phẩm còn hạn dùng, ${result.expiration_info.expiry_date_text} ạ.`;
      }
      script = `${script} ${hsdSpoken}`;
    }
    return script;
  };

  // Tự động phát giọng nói (Auto-play) ngay lập tức khi hiển thị màn hình kết quả
  useEffect(() => {
    const unsubscribe = speechService.subscribe((state) => {
      setSpeechState(state);
    });

    const fullText = getFullSpeechText();
    let timer: any = null;
    if (fullText) {
      // Dừng các âm thanh camera trước đó và tự động đọc ngay lập tức
      speechService.stop();
      timer = setTimeout(() => {
        speechService.speak(fullText, settings.speechRate || 0.85);
      }, 150);
    }

    return () => {
      if (timer) clearTimeout(timer);
      speechService.stop();
      unsubscribe();
    };
  }, [result]);

  // 01 Nút điều khiển giọng nói chính: Đang đọc -> Dừng đọc; Đã dừng/Xong -> Nghe lại
  const handleMainSpeechControl = () => {
    if (speechState.isSpeaking) {
      speechService.stop();
    } else {
      speechService.speak(getFullSpeechText(), settings.speechRate || 0.85);
    }
  };

  const handleSpeakOnlyHSD = (e: React.MouseEvent) => {
    e.stopPropagation();
    let text = '';
    const mfgText = result.detected_mfg_date || result.mfg_date || result.expiration_info?.mfg_date_text?.replace(/^NSX:\s*/i, '');
    const shelfLifeText = result.detected_shelf_life || result.shelf_life_text || result.expiration_info?.shelf_life_text;

    if (result.expiration_info?.status === 'EXPIRED') {
      if (mfgText && shelfLifeText) {
        text = `Dạ Bác ơi! Sản phẩm ${result.product_name} sản xuất ngày ${mfgText}, hạn ${shelfLifeText} nên ĐÃ HẾT HẠN SỬ DỤNG (${result.expiration_info.expiry_date_text}). Bác tuyệt đối không được dùng nữa để bảo vệ sức khỏe ạ!`;
      } else {
        text = `Dạ Bác ơi! Sản phẩm ${result.product_name} này ĐÃ HẾT HẠN SỬ DỤNG từ ${result.expiration_info.expiry_date_text}. Bác tuyệt đối không được dùng nữa để bảo vệ sức khỏe ạ!`;
      }
    } else if (result.expiration_info?.status === 'VALID') {
      if (mfgText && shelfLifeText) {
        text = `Dạ sản phẩm này sản xuất ngày ${mfgText}, hạn sử dụng ${shelfLifeText} nên Bác dùng tốt đến ${result.expiration_info.expiry_date_text} ạ!`;
      } else if (mfgText) {
        text = `Dạ sản phẩm này sản xuất ngày ${mfgText}, hạn sử dụng đến ${result.expiration_info.expiry_date_text} ạ!`;
      } else {
        text = `Dạ thưa Bác! Sản phẩm ${result.product_name} CÒN HẠN SỬ DỤNG đến ${result.expiration_info.expiry_date_text} ạ.`;
      }
    } else {
      text = `Dạ thưa Bác! Trên bao bì sản phẩm ${result.product_name} hiện không thấy rõ ngày hết hạn. Bác nên nhờ con cháu kiểm tra lại trước khi dùng ạ.`;
    }
    speechService.speak(text, settings.speechRate);
  };

  const isSuccess = !result.status || result.status === 'success';
  const isNeedSecondSide = result.status === 'need_second_side';
  const isIndividualPack = result.status === 'individual_pack';
  const isCrossMismatch = result.status === 'cross_product_mismatch' || result.is_cross_mismatch;
  const isUnclear = result.status === 'unclear';
  const isNotFound = result.status === 'not_found';
  const isUnclearOrNotFound = isUnclear || isNotFound;

  const rawType = (result.item_type || result.item_category || '').toUpperCase();
  const isMedicine = rawType.includes('MEDICINE') || rawType.includes('THUỐC');
  const isPersonalItem = rawType.includes('PERSONAL') || rawType.includes('VÍ') || rawType.includes('ĐIỆN THOẠI') || rawType.includes('CHÌA KHÓA') || rawType.includes('KÍNH');
  const isConsumerGoods = !isMedicine && !isPersonalItem;

  const isExpired = Boolean(result.is_expired || result.expiration_info?.status === 'EXPIRED');
  const isValid = !isExpired && result.expiration_info?.status === 'VALID';
  const isHsdUnclear = !isExpired && result.expiration_info?.status === 'UNCLEAR';
  const shouldShowExpiration = isSuccess && !isPersonalItem && result.expiration_info?.status !== 'NOT_APPLICABLE';

  const usageSummaryText = result.usage_summary || result.primary_purpose || result.primary_function || '';
  
  const defaultUsageFallback = isIndividualPack
    ? (isMedicine
      ? 'Nếu Bác không nhớ rõ ngày mua, Bác tuyệt đối không nên uống liều thuốc này để đảm bảo an toàn ạ.'
      : 'Nếu vỏ hộp lớn mua đã lâu hoặc bánh có dấu hiệu bị hỏng, Bác không nên ăn để đảm bảo sức khỏe ạ.')
    : isCrossMismatch
    ? 'Bác vui lòng lấy đúng sản phẩm lúc nãy và chụp lại mặt sau ạ.'
    : isMedicine
    ? 'Bác dùng theo đơn thuốc của bác sĩ hoặc hướng dẫn trên bao bì ạ.'
    : isPersonalItem
    ? 'Bác nhớ cất gọn gàng vào nơi quen thuộc để dễ tìm khi cần ạ!'
    : 'Bảo quản nơi khô ráo thoáng mát và sử dụng theo hướng dẫn ạ.';

  const usageInstructionsText =
    result.usage_instructions ||
    result.usage_instruction ||
    result.how_to_use ||
    defaultUsageFallback;

  // Clean up any remaining 'nhé ạ' phrases in display
  const cleanedUsageInstructions = usageInstructionsText.replace(/nhé\s+ạ/gi, 'ạ').replace(/nhé\s+bác/gi, 'Bác ạ');

  const hasSpecificSafetyAlert =
    (isSuccess || isIndividualPack || isCrossMismatch) &&
    !isExpired &&
    Boolean(
      result.safety_alert &&
        result.safety_alert.trim().length > 0 &&
        !result.safety_alert.toLowerCase().includes('bình thường') &&
        !result.safety_alert.toLowerCase().includes('không có cảnh báo') &&
        !result.safety_alert.toLowerCase().includes('không có lưu ý')
    );

  const speechScriptText = (result.speech_text || result.speech_script || '').replace(/nhé\s+ạ/gi, 'ạ').replace(/nhé\s+bác/gi, 'Bác ạ');

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 pb-28 pt-2 px-3 sm:px-4">
      {/* Visual Header Confirmation & Category */}
      {isSuccess ? (
        <div className="flex items-center justify-between bg-[#E6F4EA] border-2 border-[#34A853]/30 rounded-[24px] px-5 py-3.5 shadow-sm">
          <div className="flex items-center gap-2.5 text-[#137333]">
            <CheckCircle2 className="w-7 h-7 shrink-0" strokeWidth={2.75} />
            <span className="text-lg sm:text-xl font-black uppercase tracking-wide">
              {isPersonalItem ? 'ĐÃ NHẬN DIỆN ĐỒ VẬT' : 'ĐÃ NHẬN DIỆN NHÃN BAO BÌ'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black bg-[#137333] text-white px-3 py-1.5 rounded-full uppercase tracking-wider shadow-xs">
            <BookmarkCheck className="w-4 h-4" />
            <span>Đã lưu vào tủ</span>
          </div>
        </div>
      ) : isCrossMismatch ? (
        <div className="flex items-center justify-between bg-red-50 border-2 border-red-400 rounded-[24px] px-5 py-3.5 shadow-sm">
          <div className="flex items-center gap-2.5 text-red-900">
            <AlertOctagon className="w-7 h-7 text-red-600 shrink-0" strokeWidth={2.75} />
            <span className="text-lg sm:text-xl font-black uppercase tracking-wide">
              CHỤP NHẦM SẢN PHẨM KHÁC
            </span>
          </div>
          <span className="text-xs sm:text-sm font-black bg-red-200 text-red-900 px-3 py-1.5 rounded-full uppercase tracking-wider">
            Khác mặt 1
          </span>
        </div>
      ) : isNeedSecondSide ? (
        <div className="flex items-center justify-between bg-blue-50 border-2 border-blue-300 rounded-[24px] px-5 py-3.5 shadow-sm">
          <div className="flex items-center gap-2.5 text-blue-900">
            <RotateCcw className="w-7 h-7 text-blue-600 shrink-0" strokeWidth={2.75} />
            <span className="text-lg sm:text-xl font-black uppercase tracking-wide">
              CẦN CHỤP THÊM MẶT SAU / MẶT ĐÁY
            </span>
          </div>
          <span className="text-xs sm:text-sm font-black bg-blue-200 text-blue-900 px-3 py-1.5 rounded-full uppercase tracking-wider">
            Chưa thấy HSD
          </span>
        </div>
      ) : isIndividualPack ? (
        <div className={`flex items-center justify-between ${isMedicine ? 'bg-red-50 border-2 border-red-300' : 'bg-amber-50 border-2 border-amber-300'} rounded-[24px] px-5 py-3.5 shadow-sm`}>
          <div className={`flex items-center gap-2.5 ${isMedicine ? 'text-red-900' : 'text-amber-900'}`}>
            <AlertTriangle className={`w-7 h-7 ${isMedicine ? 'text-red-600' : 'text-amber-600'} shrink-0`} strokeWidth={2.75} />
            <span className="text-lg sm:text-xl font-black uppercase tracking-wide">
              {isMedicine ? 'VỈ THUỐC XÉ LẺ (KHÔNG HSD)' : 'GÓI BÓC LẺ TỪ HỘP LỚN'}
            </span>
          </div>
          <span className={`text-xs sm:text-sm font-black ${isMedicine ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'} px-3 py-1.5 rounded-full uppercase tracking-wider`}>
            Không in HSD lẻ
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-amber-50 border-2 border-amber-300 rounded-[24px] px-5 py-3.5 shadow-sm">
          <div className="flex items-center gap-2.5 text-amber-900">
            <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0" strokeWidth={2.75} />
            <span className="text-lg sm:text-xl font-black uppercase tracking-wide">
              {isUnclear ? 'ẢNH BỊ MỜ / LÓA SÁNG' : 'CHƯA TÌM THẤY VẬT PHẨM'}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-black bg-amber-200 text-amber-900 px-3 py-1.5 rounded-full uppercase tracking-wider">
            Cần chụp lại
          </span>
        </div>
      )}

      {/* Optional Captured Image Thumbnail */}
      {imagePreview && (
        <div className="bg-white border-4 border-[#E65F2B]/15 rounded-[28px] p-4 flex items-center gap-4 shadow-sm">
          <img
            src={imagePreview}
            alt="Hình ảnh đồ vật"
            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-[20px] border-2 border-gray-200 shrink-0"
          />
          <div className="flex-1">
            <span className="bg-[#E65F2B] text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              Ảnh vừa chụp
            </span>
            <p className="text-base text-[#1A1A1A] font-bold mt-1.5">
              {isSuccess
                ? (isPersonalItem ? 'Đã nhận diện chính xác đồ vật cá nhân của Bác.' : 'Đã đọc chính xác nhãn mác và hạn sử dụng cho Bác.')
                : isCrossMismatch
                ? 'Hình như Bác đang chụp một sản phẩm khác. Bác kiểm tra lại đúng hộp lúc nãy để cháu đọc lại ạ!'
                : isNeedSecondSide
                ? 'Đã thấy tên sản phẩm! Nhưng mặt này chưa có hạn dùng. Bác lật mặt sau rồi chụp lại giúp cháu ạ.'
                : isIndividualPack
                ? (isMedicine ? 'Vỉ thuốc xé lẻ không có hạn dùng. Bác xem lưu ý an toàn bên dưới ạ!' : 'Đây là gói lẻ không có hạn dùng trên vỏ. Bác xem hộp lớn giúp cháu ạ.')
                : isUnclear
                ? 'Ảnh chụp bị lóa hoặc mờ nét do run tay. Bác bấm chụp lại giúp cháu ạ.'
                : 'Chưa nhận diện được đồ vật. Bác để đồ vật lại gần camera và chụp lại giúp cháu ạ.'}
            </p>
          </div>
        </div>
      )}

      {/* SPECIAL PROMPT BANNER FOR CROSS PRODUCT MISMATCH */}
      {isCrossMismatch && (
        <div className="bg-red-50 border-4 border-red-500 p-6 sm:p-7 rounded-[32px] flex flex-col gap-3 shadow-md animate-pulse">
          <div className="flex items-center gap-3 text-red-900">
            <AlertOctagon className="w-8 h-8 shrink-0 text-red-600" strokeWidth={3} />
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider">
              HÌNH NHƯ BÁC ĐANG CHỤP SẢN PHẨM KHÁC RỒI Ạ
            </h3>
          </div>
          <p className="text-lg sm:text-xl font-bold text-red-950 leading-relaxed">
            Cháu thấy hình này khác với mặt trước lúc nãy. Bác kiểm tra lại đúng hộp sản phẩm lúc nãy rồi bấm nút chụp lại ở dưới để cháu đọc hạn dùng cho Bác ạ!
          </p>
        </div>
      )}

      {/* SPECIAL PROMPT BANNER FOR NEED_SECOND_SIDE */}
      {isNeedSecondSide && (
        <div className="bg-blue-50 border-4 border-blue-400 p-6 sm:p-7 rounded-[32px] flex flex-col gap-3 shadow-md">
          <div className="flex items-center gap-3 text-blue-800">
            <RotateCcw className="w-8 h-8 shrink-0 text-blue-600" strokeWidth={3} />
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider">
              CHƯA THẤY HẠN SỬ DỤNG TRÊN MẶT NÀY
            </h3>
          </div>
          <p className="text-lg sm:text-xl font-bold text-blue-950 leading-relaxed">
            Cháu đã nhận diện được sản phẩm. Hạn sử dụng thường được in ở <span className="underline decoration-blue-500 font-black">mặt sau, mặt đáy hoặc nắp hộp</span>. Bác lật hộp lại và bấm nút chụp tiếp ở dưới ạ!
          </p>
        </div>
      )}

      {/* SPECIAL SAFETY CARD FOR INDIVIDUAL_PACK (LƯU Ý AN TOÀN BAO BÌ) */}
      {isIndividualPack && (
        isMedicine ? (
          <div className="bg-red-50 border-4 border-red-500 p-6 sm:p-7 rounded-[32px] flex flex-col gap-3 shadow-md">
            <div className="flex items-center gap-3 text-red-900">
              <AlertOctagon className="w-8 h-8 shrink-0 text-red-600" strokeWidth={3} />
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider">
                CẢNH BÁO ĐỎ: VỈ THUỐC XÉ LẺ KHÔNG HSD
              </h3>
            </div>
            <p className="text-lg sm:text-xl font-bold text-red-950 leading-relaxed">
              Bác ơi, đây là vỉ thuốc xé lẻ không có thông tin hạn sử dụng. Để đảm bảo an toàn tuyệt đối cho sức khỏe, nếu Bác không nhớ rõ ngày mua, Bác <span className="font-black underline decoration-red-600 text-red-900">tuyệt đối KHÔNG NÊN UỐNG</span> liều thuốc này ạ!
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 border-4 border-amber-400 p-6 sm:p-7 rounded-[32px] flex flex-col gap-3 shadow-md">
            <div className="flex items-center gap-3 text-amber-900">
              <AlertTriangle className="w-8 h-8 shrink-0 text-amber-600" strokeWidth={3} />
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider">
                LƯU Ý AN TOÀN BAO BÌ
              </h3>
            </div>
            <p className="text-lg sm:text-xl font-bold text-amber-950 leading-relaxed">
              Dạ đây là gói <span className="font-black text-amber-900">{result.item_name || result.product_name}</span> lẻ nên không ghi hạn sử dụng trên vỏ ạ. Nếu vỏ hộp lớn mua đã lâu hoặc bánh có dấu hiệu bị hỏng, Bác không nên ăn để đảm bảo sức khỏe ạ.
            </p>
          </div>
        )
      )}

      {/* 1. EXPIRATION DATE BANNER - Only shown on SUCCESS for medicines/consumer goods with expiration */}
      {shouldShowExpiration && (
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
                    isExpired ? 'text-white' : isHsdUnclear ? 'text-amber-950' : 'text-[#137333]'
                  }`}
                >
                  {result.expiration_info?.expiry_date_text || result.expiry_date || 'Không tìm thấy HSD trên nhãn'}
                </h3>
                {isExpired && (
                  <p className="text-white/95 font-black text-base sm:text-lg mt-1 uppercase">
                    TUYỆT ĐỐI KHÔNG DÙNG SẢN PHẨM NÀY NỮA ĐỂ BẢO VỆ SỨC KHỎE!
                  </p>
                )}
                {isHsdUnclear && (
                  <p className="text-amber-800 font-bold text-sm sm:text-base mt-1">
                    Ngày in trên nhãn bị mờ hoặc không in. Bác nên nhờ con cháu kiểm tra lại ạ.
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

          {/* Extra Expiration Metadata Sub-box (NSX, Quy định thời hạn, Phép tính, Mở nắp) */}
          {(result.detected_mfg_date ||
            result.mfg_date ||
            result.expiration_info?.mfg_date_text ||
            result.detected_shelf_life ||
            result.shelf_life_text ||
            result.expiration_info?.shelf_life_text ||
            result.after_opening_instruction ||
            result.opened_storage_note ||
            result.expiry_calculation_note ||
            result.expiration_info?.calculation_note ||
            result.expiration_info?.location_found) && (
            <div
              className={`pt-3.5 border-t flex flex-col gap-2 text-sm sm:text-base font-bold ${
                isExpired ? 'border-white/20 text-white/95' : isValid ? 'border-green-200 text-green-950' : 'border-amber-200 text-amber-950'
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(result.Text_In_Phun_1 || result.raw_text_inkjet) && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-black/10 px-2 py-0.5 rounded font-mono">In phun:</span>
                    <span>{result.Text_In_Phun_1 || result.raw_text_inkjet}</span>
                  </div>
                )}
                {(result.Text_Chu_Nho_xung_quanh || result.raw_text_fine_print) && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-black/10 px-2 py-0.5 rounded font-mono">Chữ nhỏ:</span>
                    <span>{result.Text_Chu_Nho_xung_quanh || result.raw_text_fine_print}</span>
                  </div>
                )}
                {(result.detected_mfg_date || result.mfg_date || result.expiration_info?.mfg_date_text) && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>
                      {result.expiration_info?.mfg_date_text || `NSX: ${result.detected_mfg_date || result.mfg_date}`}
                    </span>
                  </div>
                )}
                {(result.detected_shelf_life || result.shelf_life_text || result.expiration_info?.shelf_life_text) && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Thời hạn: {result.detected_shelf_life || result.shelf_life_text || result.expiration_info?.shelf_life_text}
                    </span>
                  </div>
                )}
                {result.expiration_info?.location_found && (
                  <div className="flex items-center gap-2">
                    <span>📍 Vị trí in: {result.expiration_info.location_found}</span>
                  </div>
                )}
              </div>

              {(result.after_opening_instruction || result.opened_storage_note) && (
                <div
                  className={`mt-1 px-3.5 py-2.5 rounded-[16px] text-xs sm:text-sm font-black flex items-start gap-2.5 ${
                    isExpired
                      ? 'bg-black/30 text-amber-200 border border-amber-400/30'
                      : isValid
                      ? 'bg-blue-600/15 text-blue-950 border border-blue-300/40'
                      : 'bg-amber-400/30 text-amber-950 border border-amber-300'
                  }`}
                >
                  <span className="text-base shrink-0">🥛</span>
                  <div>
                    <span className="uppercase tracking-wide font-black block text-[11px] opacity-80">Sau khi mở nắp:</span>
                    <span>{result.after_opening_instruction || result.opened_storage_note}</span>
                  </div>
                </div>
              )}

              {(result.expiry_calculation_note || result.expiration_info?.calculation_note) && (
                <div
                  className={`mt-1 px-3 py-2 rounded-[14px] text-xs sm:text-sm font-black flex items-center gap-2 ${
                    isExpired
                      ? 'bg-black/25 text-yellow-300'
                      : isValid
                      ? 'bg-green-700/15 text-[#137333]'
                      : 'bg-amber-400/30 text-amber-950'
                  }`}
                >
                  <span>💡</span>
                  <span>{result.expiry_calculation_note || result.expiration_info?.calculation_note}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. PRODUCT NAME & CATEGORY CARD */}
      <div
        id="card-product-identity"
        className="bg-white border-4 border-[#E65F2B]/15 rounded-[36px] sm:rounded-[40px] p-6 sm:p-8 flex flex-col gap-4 text-center shadow-xl shadow-orange-500/5"
      >
        {/* Category Pill */}
        <div className="inline-flex items-center justify-center gap-2 bg-[#FDFBF7] text-[#1A1A1A] border-2 border-gray-200 px-5 py-2 rounded-full mx-auto shadow-xs">
          {isMedicine ? (
            <>
              <Pill className="w-5 h-5 text-red-600" strokeWidth={2.75} />
              <span className="text-sm sm:text-base font-black uppercase tracking-wider text-gray-700">
                💊 THUỐC & DƯỢC PHẨM Y TẾ
              </span>
            </>
          ) : isPersonalItem ? (
            <>
              <BookmarkCheck className="w-5 h-5 text-amber-600" strokeWidth={2.75} />
              <span className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-800">
                👛 ĐỒ DÙNG CÁ NHÂN
              </span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5 text-[#2B67E6]" strokeWidth={2.75} />
              <span className="text-sm sm:text-base font-black uppercase tracking-wider text-gray-700">
                🧴 HÀNG TIÊU DÙNG / THỰC PHẨM
              </span>
            </>
          )}
        </div>

        <h2 className="text-3xl sm:text-5xl font-black uppercase text-[#E65F2B] tracking-tight leading-tight">
          {result.item_name || result.product_name}
        </h2>

        {/* Primary function / Purpose - Only shown on SUCCESS if available */}
        {isSuccess && usageSummaryText && (
          <div className="bg-[#F7F9FC] border-2 border-gray-200/80 rounded-[24px] p-5 sm:p-6 text-left">
            <p className="text-xs uppercase tracking-widest text-[#2B67E6] font-black mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#2B67E6]" />
              <span>{isPersonalItem ? 'CÔNG DỤNG ĐỒ VẬT' : 'CÔNG DỤNG CHÍNH'}</span>
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] leading-relaxed">
              {usageSummaryText}
            </p>
          </div>
        )}
      </div>

      {/* 3. HOW TO USE / HƯỚNG DẪN CÁCH DÙNG / LỜI KHUYÊN (ONLY SHOWN ON SUCCESS AND NOT EXPIRED) */}
      {isSuccess && !isExpired && (
        <div className={`p-6 sm:p-7 rounded-[32px] border-l-8 shadow-sm flex flex-col gap-3 ${
          isMedicine ? 'bg-[#F7F9FC] border-[#2B67E6]' : 'bg-[#FFF9F5] border-[#E65F2B]'
        }`}>
          <p className={`text-xs sm:text-sm font-black uppercase tracking-widest flex items-center gap-2 ${
            isMedicine ? 'text-[#2B67E6]' : 'text-[#E65F2B]'
          }`}>
            <BookOpen className="w-5 h-5" strokeWidth={2.75} />
            <span>{isMedicine ? 'HƯỚNG DẪN DÙNG THUỐC' : 'MẸO SỬ DỤNG & LƯU Ý'}</span>
          </p>

          <div className="bg-white text-[#1A1A1A] border-2 border-gray-200/80 p-5 sm:p-6 rounded-[24px] shadow-xs">
            <p className="text-xl sm:text-2xl font-black leading-snug tracking-tight text-[#1A1A1A]">
              {cleanedUsageInstructions}
            </p>
          </div>
        </div>
      )}

      {/* 4. SAFETY ALERT / CẢNH BÁO AN TOÀN (ONLY SHOWN ON SUCCESS WHEN THERE IS A SPECIFIC ALERT) */}
      {hasSpecificSafetyAlert && (
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

      {/* 5. CARING ADVICE / ASSISTANT SPEECH SCRIPT (ALWAYS SHOWN FOR THE SENIOR) */}
      <div className="bg-[#E6F4EA] p-6 sm:p-7 rounded-[32px] border-2 border-[#34A853]/30 shadow-sm">
        <p className="text-[#137333] text-xs sm:text-sm font-black uppercase tracking-widest mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#137333]" />
          <span>LỜI TRỢ LÝ ĐỌC CHO BÁC:</span>
        </p>
        <p className="text-xl sm:text-2xl font-medium text-[#137333] italic leading-relaxed">
          "{speechScriptText}"
        </p>
      </div>

      {/* 6. SPEECH AUDIO CONTROL CARD */}
      <div
        id="card-speech-control"
        className="bg-[#E65F2B] text-white rounded-[32px] p-6 sm:p-8 flex flex-col gap-5 items-center shadow-xl shadow-orange-500/25"
      >
        <div className="text-center">
          <p className="text-sm sm:text-base uppercase font-black tracking-widest text-white/80 mb-1">
            GIỌNG NÓI TRỢ LÝ
          </p>
          <h3 className="text-2xl sm:text-3xl font-black uppercase leading-tight">
            {speechState.isSpeaking
              ? 'ĐANG ĐỌC CHO BÁC NGHE...'
              : 'BẤM ĐỂ NGHE LẠI TỪ ĐẦU'}
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

        {/* 01 Nút điều khiển chính duy nhất (Dừng đọc / Nghe lại) */}
        <button
          id="btn-main-speech-control"
          onClick={handleMainSpeechControl}
          className="w-full min-h-[84px] sm:min-h-[92px] bg-white text-[#E65F2B] font-black text-2xl sm:text-3xl px-6 py-4 rounded-[26px] flex items-center justify-center gap-4 hover:bg-white/95 active:scale-95 transition-all shadow-lg ring-4 ring-white/30 uppercase tracking-tight cursor-pointer"
        >
          {speechState.isSpeaking ? (
            <>
              <Pause className="w-9 h-9 sm:w-10 sm:h-10 fill-current text-red-600" strokeWidth={2.5} />
              <span className="text-red-600">⏸ DỪNG ĐỌC</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-9 h-9 sm:w-10 sm:h-10 text-[#E65F2B]" strokeWidth={3} />
              <span>🔄 NGHE LẠI</span>
            </>
          )}
        </button>

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
              <p className="italic font-medium">"{speechScriptText}"</p>
            </div>
          )}
        </div>
      </div>

      {/* 7. ACTION: SCAN ANOTHER ITEM */}
      <div className="pt-2">
        <button
          id="btn-scan-another"
          onClick={onScanAnother}
          className="w-full min-h-[76px] bg-[#E65F2B] text-white font-black text-2xl px-6 py-4 rounded-[28px] flex items-center justify-center gap-3 hover:bg-[#d85320] active:scale-95 transition-all shadow-lg shadow-orange-500/20 uppercase tracking-tight cursor-pointer"
        >
          <Camera className="w-8 h-8 text-white" strokeWidth={2.75} />
          <span>
            {isNeedSecondSide
              ? '📸 LẬT HỘP & CHỤP MẶT SAU'
              : isIndividualPack
              ? '📸 CHỤP VỎ HỘP LỚN / ĐỒ KHÁC'
              : isSuccess
              ? 'CHỤP HOẶC TRA CỨU ĐỒ KHÁC'
              : 'CHỤP LẠI ẢNH RÕ HƠN'}
          </span>
        </button>
      </div>
    </div>
  );
};
