import React, { useState, useEffect } from 'react';
import { History, Volume2, Pause, Trash2, Clock, AlertTriangle, Play, ChevronRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ScannedRecord, SeniorSettings } from '../types';
import { speechService } from '../services/speechService';

interface HistoryViewProps {
  records: ScannedRecord[];
  settings: SeniorSettings;
  onSelectRecord: (record: ScannedRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  settings,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [playingRecordId, setPlayingRecordId] = useState<string | null>(null);
  const [speechState, setSpeechState] = useState(speechService.getState());

  useEffect(() => {
    const unsub = speechService.subscribe((state) => {
      setSpeechState(state);
      if (!state.isSpeaking) {
        setPlayingRecordId(null);
      }
    });
    return () => {
      unsub();
      speechService.stop();
    };
  }, []);

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Phát lại âm thanh trực tiếp từ dữ liệu offline đã lưu - KHÔNG GỌI LẠI GEMINI API
  const handleToggleSpeak = (e: React.MouseEvent, record: ScannedRecord) => {
    e.stopPropagation();

    if (playingRecordId === record.id && speechState.isSpeaking) {
      speechService.stop();
      setPlayingRecordId(null);
      return;
    }

    speechService.stop();

    const script =
      record.result.speech_text ||
      record.result.speech_script ||
      `Dạ đây là ${record.result.item_name || record.result.product_name} ạ. ${
        record.result.expiration_info?.expiry_date_text
          ? `Hạn sử dụng: ${record.result.expiration_info.expiry_date_text}. `
          : ''
      }${record.result.usage_instructions || record.result.usage_instruction || ''}`;

    setPlayingRecordId(record.id);
    speechService.speak(script, settings.speechRate || 0.85);
  };

  const handleConfirmClear = () => {
    speechService.stop();
    onClearAll();
    setShowConfirmModal(false);
    if (settings.soundFeedback) {
      speechService.playFeedbackSound('alert');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 pb-28 pt-2 px-3 sm:px-4 relative">
      {/* Header Info */}
      <div className="flex items-center justify-between bg-white border-4 border-[#E65F2B]/15 p-5 sm:p-6 rounded-[32px] sm:rounded-[36px] shadow-xl shadow-orange-500/5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[20px] bg-[#E65F2B]/10 text-[#E65F2B] flex items-center justify-center font-black">
            <History className="w-7 h-7" strokeWidth={2.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight uppercase">
                TỦ ĐỒ ĐÃ ĐỌC
              </h2>
              <span className="bg-[#E65F2B] text-white px-3 py-0.5 rounded-full text-xs sm:text-sm font-black">
                {records.length} món
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold text-gray-500 mt-0.5">
              Danh sách thuốc & đồ dùng Bác đã nhờ trợ lý đọc
            </p>
          </div>
        </div>

        {records.length > 0 && (
          <button
            id="btn-clear-all-history"
            onClick={() => setShowConfirmModal(true)}
            className="flex items-center gap-1.5 bg-red-50 text-red-600 border-2 border-red-200 px-4 py-2.5 rounded-full font-black text-xs sm:text-sm hover:bg-red-100 active:scale-95 transition-all uppercase tracking-wider cursor-pointer"
          >
            <Trash2 className="w-4 h-4 stroke-[2.5]" />
            <span>Xóa Hết</span>
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border-4 border-[#E65F2B] rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E65F2B]/15 text-[#E65F2B] mx-auto flex items-center justify-center">
              <AlertTriangle className="w-9 h-9 stroke-[2.75]" />
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight uppercase">
                Xóa Hết Lịch Sử?
              </h3>
              <p className="text-base sm:text-lg font-bold text-gray-600 mt-2 leading-relaxed">
                Bác có chắc chắn muốn xóa toàn bộ lịch sử các món đồ đã đọc không ạ?
              </p>
              <p className="text-xs sm:text-sm font-semibold text-red-500 mt-1">
                (Dữ liệu sau khi xóa sẽ không thể phục hồi lại được)
              </p>
            </div>

            {/* Buttons: Left = Cancel (Không), Right = Orange Delete (Xóa) */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="btn-cancel-clear-history"
                onClick={() => setShowConfirmModal(false)}
                className="min-h-[58px] bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-lg rounded-[20px] border-2 border-gray-300 active:scale-95 transition-all cursor-pointer"
              >
                Không, giữ lại
              </button>

              <button
                id="btn-confirm-clear-history"
                onClick={handleConfirmClear}
                className="min-h-[58px] bg-[#E65F2B] hover:bg-[#d85320] text-white font-black text-lg rounded-[20px] shadow-lg shadow-orange-500/25 active:scale-95 transition-all uppercase tracking-wide cursor-pointer"
              >
                Xóa Hết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {records.length === 0 ? (
        <div className="bg-white border-4 border-[#E65F2B]/10 p-8 sm:p-12 rounded-[32px] sm:rounded-[40px] flex flex-col items-center justify-center text-center gap-4 py-16 shadow-xl shadow-orange-500/5">
          <div className="w-20 h-20 rounded-full bg-[#E65F2B]/10 text-[#E65F2B] flex items-center justify-center">
            <Clock className="w-10 h-10" strokeWidth={2.75} />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] uppercase tracking-tight">
            Chưa có lịch sử đọc nhãn
          </h3>
          <p className="text-lg text-gray-600 max-w-md font-medium leading-relaxed">
            Mỗi khi Bác chụp hoặc tra cứu một vỏ thuốc hay sản phẩm mới, thông tin và hạn sử dụng sẽ tự động được lưu lại tại đây để Bác nghe lại bất cứ lúc nào ạ.
          </p>
        </div>
      ) : (
        /* Records List */
        <div className="flex flex-col gap-5">
          {records.map((rec) => {
            const isExpired = rec.result.expiration_info?.status === 'EXPIRED';
            const isValid = rec.result.expiration_info?.status === 'VALID';
            const isMedicine = rec.result.item_category === 'MEDICINE' || rec.result.item_type === 'MEDICINE';
            const isIndividual = rec.result.status === 'individual_pack';
            const isCrossMismatch = rec.result.status === 'cross_product_mismatch';
            const isPlayingThis = playingRecordId === rec.id && speechState.isSpeaking;

            const productName = rec.result.item_name || rec.result.product_name || 'Sản phẩm đã quét';
            const purpose = rec.result.usage_summary || rec.result.primary_purpose || rec.result.primary_function || 'Đã đọc thông tin nhãn';
            const expiryText = rec.result.expiry_date || rec.result.expiration_info?.expiry_date_text || (isValid ? 'Còn HSD' : 'Không rõ HSD');

            return (
              <div
                key={rec.id}
                id={`history-item-${rec.id}`}
                onClick={() => onSelectRecord(rec)}
                className={`bg-white border-3 ${
                  isPlayingThis ? 'border-[#E65F2B] ring-4 ring-orange-500/20 shadow-xl' : 'border-gray-200 hover:border-[#E65F2B]'
                } p-5 sm:p-6 rounded-[30px] flex flex-col gap-4 cursor-pointer hover:shadow-lg active:scale-[0.99] transition-all shadow-sm group`}
              >
                {/* Top Row: Thumbnail + Details */}
                <div className="flex items-start gap-4">
                  {rec.imagePreview ? (
                    <img
                      src={rec.imagePreview}
                      alt={productName}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-[22px] border-2 border-gray-200 shrink-0 bg-gray-50 shadow-xs"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] bg-[#E65F2B]/10 text-[#E65F2B] flex items-center justify-center font-black text-3xl shrink-0 border-2 border-[#E65F2B]/20">
                      {isMedicine ? '💊' : '🧴'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="bg-gray-100 text-gray-800 text-xs sm:text-sm font-black px-3 py-0.5 rounded-full uppercase">
                        {isMedicine ? '💊 Thuốc' : '🧴 Đồ Dùng'}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-black px-3 py-0.5 rounded-full ${
                          isExpired
                            ? 'bg-red-100 text-red-700 font-black border border-red-200'
                            : isValid
                            ? 'bg-green-100 text-green-800 font-black border border-green-200'
                            : isIndividual
                            ? 'bg-amber-100 text-amber-900 font-black border border-amber-300'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {isExpired ? '⚠️ ' : isValid ? '✅ ' : 'ℹ️ '}
                        {expiryText}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-xl sm:text-2xl font-black text-[#1A1A1A] group-hover:text-[#E65F2B] tracking-tight leading-tight line-clamp-2">
                      {productName}
                    </h3>

                    {/* Purpose / Summary */}
                    <p className="text-sm sm:text-base font-bold text-gray-600 mt-1 line-clamp-2">
                      {purpose}
                    </p>

                    {/* Timestamp */}
                    <p className="text-xs sm:text-sm font-semibold text-gray-400 mt-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(rec.timestamp)}</span>
                    </p>
                  </div>
                </div>

                {/* Bottom Row: 01 Prominent NGHE LẠI button + Delete Button */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  {/* 01 NÚT NỔI BẬT: NGHE LẠI / DỪNG ĐỌC (Offline, No API call) */}
                  <button
                    id={`btn-replay-history-${rec.id}`}
                    onClick={(e) => handleToggleSpeak(e, rec)}
                    className={`flex-1 min-h-[56px] sm:min-h-[60px] px-6 rounded-[20px] font-black text-lg sm:text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-md uppercase tracking-tight cursor-pointer ${
                      isPlayingThis
                        ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/30'
                        : 'bg-[#E65F2B] text-white hover:bg-[#d85320] shadow-orange-500/25'
                    }`}
                  >
                    {isPlayingThis ? (
                      <>
                        <Pause className="w-6 h-6 fill-current animate-pulse" />
                        <span>⏸ DỪNG ĐỌC</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-6 h-6 stroke-[2.75]" />
                        <span>🔊 NGHE LẠI</span>
                      </>
                    )}
                  </button>

                  {/* Delete button */}
                  <button
                    id={`btn-delete-history-${rec.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecord(rec.id);
                    }}
                    title="Xóa khỏi lịch sử"
                    className="min-h-[56px] sm:min-h-[60px] px-4 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-600 font-bold rounded-[20px] active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-gray-200/80"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
