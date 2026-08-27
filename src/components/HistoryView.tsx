import React from 'react';
import { History, Volume2, Trash2, ChevronRight, Clock, Sparkles, AlertCircle } from 'lucide-react';
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

  const handleSpeak = (e: React.MouseEvent, script: string) => {
    e.stopPropagation();
    speechService.speak(script, settings.speechRate);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 pb-28 pt-2 px-3 sm:px-4">
      {/* Header Info */}
      <div className="flex items-center justify-between bg-white border-4 border-[#E65F2B]/15 p-6 rounded-[32px] sm:rounded-[36px] shadow-xl shadow-orange-500/5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[18px] bg-[#E65F2B]/10 text-[#E65F2B] flex items-center justify-center font-black">
            <History className="w-7 h-7" strokeWidth={2.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight uppercase">
                Tủ Đồ Đã Đọc
              </h2>
              <span className="bg-[#E65F2B] text-white px-3 py-0.5 rounded-full text-xs font-black">
                {records.length} món
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold text-gray-500 mt-0.5">
              Danh sách thuốc & đồ dùng Bác đã nhờ đọc nhãn
            </p>
          </div>
        </div>

        {records.length > 0 && (
          <button
            id="btn-clear-history"
            onClick={onClearAll}
            className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-full font-black text-xs sm:text-sm hover:bg-red-100 active:scale-95 transition-all uppercase tracking-wider"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa hết</span>
          </button>
        )}
      </div>

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
            Mỗi khi Bác chụp hoặc tra cứu một vỏ thuốc hay sản phẩm mới, thông tin và hạn sử dụng sẽ tự động được lưu lại tại đây.
          </p>
        </div>
      ) : (
        /* Records List */
        <div className="flex flex-col gap-4">
          {records.map((rec) => {
            const isExpired = rec.result.expiration_info?.status === 'EXPIRED';
            const isValid = rec.result.expiration_info?.status === 'VALID';
            const isMedicine = rec.result.item_category === 'MEDICINE';

            return (
              <div
                key={rec.id}
                id={`history-item-${rec.id}`}
                onClick={() => onSelectRecord(rec)}
                className="bg-white border-2 border-gray-200/90 hover:border-[#E65F2B] p-5 sm:p-6 rounded-[28px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:shadow-md active:scale-[0.99] transition-all shadow-xs group min-h-[96px]"
              >
                <div className="flex items-start gap-4 flex-1">
                  {rec.imagePreview ? (
                    <img
                      src={rec.imagePreview}
                      alt={rec.result.product_name}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-[20px] border-2 border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[20px] bg-[#E65F2B]/10 text-[#E65F2B] flex items-center justify-center font-black text-2xl shrink-0">
                      {isMedicine ? '💊' : '🧴'}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="bg-gray-100 text-gray-700 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                        {isMedicine ? '💊 Thuốc' : '🧴 Đồ Dùng'}
                      </span>
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                          isExpired
                            ? 'bg-red-100 text-red-700 font-bold'
                            : isValid
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.result.expiration_info?.expiry_date_text || (isValid ? 'Còn HSD' : 'Không rõ HSD')}
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] group-hover:text-[#E65F2B] tracking-tight leading-tight">
                      {rec.result.product_name}
                    </h3>
                    <div className="inline-flex items-center gap-1.5 bg-[#FDFBF7] text-[#1A1A1A] border border-[#E65F2B]/30 px-3 py-1 rounded-full font-bold text-sm sm:text-base mt-1 shadow-xs">
                      <span>{rec.result.primary_purpose || rec.result.primary_function}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-400 mt-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(rec.timestamp)}</span>
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                  <button
                    id={`btn-speak-history-${rec.id}`}
                    onClick={(e) => handleSpeak(e, rec.result.speech_script)}
                    title="Nghe đọc lại"
                    className="min-h-[50px] px-5 bg-[#E65F2B] text-white font-black rounded-[18px] flex items-center gap-2 hover:bg-[#d85320] active:scale-95 shadow-md shadow-orange-500/20 uppercase text-sm tracking-wider cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" strokeWidth={2.75} />
                    <span>Nghe</span>
                  </button>

                  <button
                    id={`btn-delete-history-${rec.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecord(rec.id);
                    }}
                    title="Xóa bản ghi này"
                    className="min-h-[50px] px-3.5 bg-gray-100 text-gray-500 hover:text-red-600 hover:bg-red-50 font-bold rounded-[18px] active:scale-95 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <div className="hidden sm:flex text-[#E65F2B] text-2xl font-black group-hover:translate-x-1 transition-transform pl-1">
                    ➔
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
