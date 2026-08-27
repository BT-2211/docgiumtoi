import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Volume2,
  Type,
  PhoneCall,
  Heart,
  Play,
  Check,
  ShieldCheck,
  HelpCircle,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { SeniorSettings } from '../types';
import { speechService } from '../services/speechService';

interface SettingsViewProps {
  settings: SeniorSettings;
  onUpdateSettings: (newSettings: Partial<SeniorSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [selectedVoice, setSelectedVoice] = useState<'Vietnamese Female' | 'Vietnamese Male'>('Vietnamese Female');

  // Camera permission states in Settings
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [isTestingCamera, setIsTestingCamera] = useState<boolean>(false);
  const [cameraTestSuccess, setCameraTestSuccess] = useState<boolean | null>(null);
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const testVideoRef = useRef<HTMLVideoElement | null>(null);
  const testStreamRef = useRef<MediaStream | null>(null);

  // Check initial camera permission and load active voice
  useEffect(() => {
    setSelectedVoice(speechService.getSelectedVoiceName());
    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'camera' as any });
          setCameraPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
          result.onchange = () => {
            setCameraPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
          };
        }
      } catch {
        setCameraPermissionStatus('unknown');
      }
    };
    checkPermission();

    return () => {
      stopTestCamera();
    };
  }, []);

  const stopTestCamera = () => {
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((track) => track.stop());
      testStreamRef.current = null;
    }
    setIsTestingCamera(false);
  };

  const handleRequestAndTestCamera = async () => {
    stopTestCamera();
    setIsTestingCamera(true);
    setCameraErrorMessage(null);
    setCameraTestSuccess(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      testStreamRef.current = stream;
      setCameraPermissionStatus('granted');
      setCameraTestSuccess(true);

      if (testVideoRef.current) {
        testVideoRef.current.srcObject = stream;
        await testVideoRef.current.play();
      }

      if (settings.soundFeedback) {
        speechService.playFeedbackSound('beep');
      }

      // Auto stop test after 6 seconds
      setTimeout(() => {
        stopTestCamera();
      }, 6000);
    } catch (err: any) {
      console.warn('Camera request error:', err);
      stopTestCamera();
      setCameraTestSuccess(false);

      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraPermissionStatus('denied');
        setCameraErrorMessage('Quyền máy ảnh đang bị từ chối hoặc bị trình duyệt chặn.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setCameraErrorMessage('Không tìm thấy thiết bị máy ảnh trên máy này.');
      } else {
        setCameraErrorMessage('Không thể mở máy ảnh. Vui lòng kiểm tra lại quyền truy cập.');
      }
    }
  };

  const handleVoiceChange = (voice: 'Vietnamese Female' | 'Vietnamese Male') => {
    setSelectedVoice(voice);
    speechService.setSelectedVoiceName(voice);
    if (settings.soundFeedback) {
      speechService.playFeedbackSound('beep');
    }
  };

  const handleTestVoice = () => {
    const testText =
      'Dạ thưa Bác! Cháu là trợ lý Đọc Giùm Tôi. Cháu luôn sẵn sàng đọc to rõ ràng tên thuốc, công dụng, cách dùng và đặc biệt là Hạn Sử Dụng giúp Bác ạ.';
    speechService.speak(testText, 0.9, selectedVoice);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 pb-28 pt-2 px-3 sm:px-4">
      {/* Header */}
      <div className="bg-white border-4 border-[#E65F2B]/15 p-6 rounded-[32px] sm:rounded-[36px] flex items-center gap-4 shadow-xl shadow-orange-500/5">
        <div className="w-12 h-12 rounded-[18px] bg-[#E65F2B]/10 text-[#E65F2B] flex items-center justify-center font-black">
          <Settings className="w-7 h-7" strokeWidth={2.75} />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight uppercase">
            Cài Đặt Trợ Lý
          </h2>
          <p className="text-sm sm:text-base font-bold text-gray-500 mt-0.5">
            Cấp quyền máy ảnh, chỉnh cỡ chữ và giọng nói sao cho Bác dễ dùng nhất
          </p>
        </div>
      </div>

      {/* CAMERA PERMISSION & ACCESS MANAGEMENT CARD */}
      <div
        id="card-camera-permission-settings"
        className="bg-white border-2 border-gray-200/90 p-6 sm:p-7 rounded-[32px] flex flex-col gap-4 shadow-xs"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[#1A1A1A]">
            <Camera className="w-7 h-7 text-[#E65F2B]" strokeWidth={2.75} />
            <h3 className="text-2xl font-black uppercase tracking-tight">Quyền Máy Ảnh (Camera)</h3>
          </div>

          <span
            className={`text-xs font-black px-3 py-1.5 rounded-full uppercase flex items-center gap-1.5 ${
              cameraPermissionStatus === 'granted'
                ? 'bg-[#E6F4EA] text-[#137333] border border-[#34A853]/40'
                : cameraPermissionStatus === 'denied'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-orange-50 text-[#E65F2B] border border-orange-200'
            }`}
          >
            {cameraPermissionStatus === 'granted' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ĐÃ CẤP QUYỀN</span>
              </>
            ) : cameraPermissionStatus === 'denied' ? (
              <>
                <CameraOff className="w-3.5 h-3.5" />
                <span>BỊ TỪ CHỐI</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>CHƯA CẤP QUYỀN</span>
              </>
            )}
          </span>
        </div>

        <p className="text-base sm:text-lg font-bold text-gray-600">
          Máy ảnh dùng để chụp và soi hạn sử dụng, tên thuốc, chai dầu gội và thực phẩm. Bác có thể bấm cấp quyền hoặc kiểm tra lại bất cứ lúc nào:
        </p>

        {/* Live Mini Camera Test Preview */}
        {isTestingCamera && (
          <div className="relative w-full aspect-[16/9] bg-black rounded-[24px] overflow-hidden border-3 border-[#E65F2B] shadow-md flex items-center justify-center">
            <video
              ref={testVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-[#137333] text-white px-3.5 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md">
              <CheckCircle2 className="w-4 h-4" />
              <span>MÁY ẢNH HOẠT ĐỘNG TỐT!</span>
            </div>
            <button
              onClick={stopTestCamera}
              className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-black"
            >
              Đóng xem thử
            </button>
          </div>
        )}

        {/* Success message */}
        {cameraTestSuccess && !isTestingCamera && (
          <div className="bg-[#E6F4EA] border-2 border-[#34A853]/40 p-4 rounded-[20px] flex items-center gap-3 text-[#137333]">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <p className="text-base font-bold">
              Tuyệt vời! Máy ảnh đã được kết nối thành công. Bác có thể quay lại tab <strong>Chụp & Soi HSD</strong> để dùng ngay.
            </p>
          </div>
        )}

        {/* Error / Denied message with instructions */}
        {cameraErrorMessage && (
          <div className="bg-red-50 border-2 border-red-200 p-4 rounded-[20px] flex flex-col gap-2 text-red-900">
            <div className="flex items-center gap-2 font-black text-base text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{cameraErrorMessage}</span>
            </div>
            <div className="bg-white/90 p-3 rounded-[16px] text-sm font-semibold text-gray-800 flex flex-col gap-1 border border-red-100">
              <p className="font-bold flex items-center gap-1.5 text-red-800">
                <Lock className="w-4 h-4 text-red-600" />
                <span>Cách mở lại quyền nếu bị chặn trên trình duyệt:</span>
              </p>
              <p>1. Bấm vào biểu tượng ổ khóa 🔒 hoặc biểu tượng camera 📷 trên thanh địa chỉ web (góc trên cùng màn hình).</p>
              <p>2. Chọn <strong>"Quyền trang web"</strong> (Site settings) hoặc tìm mục <strong>"Máy ảnh / Camera"</strong>.</p>
              <p>3. Đổi sang <strong>"Cho phép" (Allow)</strong> rồi bấm nút màu cam bên dưới để thử lại.</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          id="btn-request-camera-permission"
          onClick={handleRequestAndTestCamera}
          className="w-full min-h-[64px] bg-[#E65F2B] hover:bg-[#d85320] text-white font-black text-xl rounded-[22px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-orange-500/25 uppercase tracking-wide cursor-pointer"
        >
          {isTestingCamera ? (
            <>
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>ĐANG KÍCH HOẠT MÁY ẢNH...</span>
            </>
          ) : (
            <>
              <Camera className="w-7 h-7 stroke-[2.75]" />
              <span>
                {cameraPermissionStatus === 'granted'
                  ? 'KIỂM TRA HOẠT ĐỘNG MÁY ẢNH'
                  : 'CẤP QUYỀN MÁY ẢNH NGAY'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* 1. VIETNAMESE VOICE SELECTION & STATUS */}
      <div className="bg-white border-2 border-gray-200/90 p-6 sm:p-7 rounded-[32px] flex flex-col gap-4 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[#1A1A1A]">
            <Volume2 className="w-7 h-7 text-[#137333]" strokeWidth={2.75} />
            <h3 className="text-2xl font-black uppercase tracking-tight">Giọng Đọc Tiếng Việt</h3>
          </div>
          <span className="bg-[#E6F4EA] text-[#137333] border border-[#34A853]/40 text-xs font-black px-3 py-1 rounded-full uppercase">
            ResponsiveVoice Chuẩn Tiếng Việt
          </span>
        </div>

        <p className="text-base sm:text-lg font-bold text-gray-600">
          Chọn giọng đọc tiếng Việt rõ ràng, truyền cảm mà Bác cảm thấy dễ nghe nhất:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'Vietnamese Female', label: '👩 Giọng Nữ Miền Nam / Bắc', desc: 'Dịu dàng, phát âm chuẩn' },
            { id: 'Vietnamese Male', label: '👨 Giọng Nam Trầm Ấm', desc: 'Rõ ràng, dõng dạc' },
          ].map((voiceOption) => {
            const isSelected = selectedVoice === voiceOption.id;
            return (
              <button
                key={voiceOption.id}
                id={`btn-voice-${voiceOption.id.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => handleVoiceChange(voiceOption.id as any)}
                className={`min-h-[72px] rounded-[24px] p-4 font-black text-left flex items-center justify-between transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-[#137333] text-white shadow-lg shadow-green-700/25 ring-4 ring-green-500/20'
                    : 'bg-[#FDFBF7] text-[#1A1A1A] border-2 border-gray-300 hover:border-[#137333] hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="text-lg font-black">{voiceOption.label}</div>
                  <div className={`text-xs font-bold ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                    {voiceOption.desc}
                  </div>
                </div>
                {isSelected && <Check className="w-6 h-6 stroke-[3] text-white shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Test voice button */}
        <button
          id="btn-test-voice-primary"
          onClick={handleTestVoice}
          className="w-full min-h-[60px] bg-[#137333] text-white hover:bg-[#0f5c29] font-black text-lg rounded-[20px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-md shadow-green-600/20 uppercase tracking-wider cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>🔊 BẤM NGHE THỬ GIỌNG TIẾNG VIỆT</span>
        </button>
      </div>

      {/* 2. FONT SIZE ADJUSTMENT */}
      <div className="bg-white border-2 border-gray-200/90 p-6 sm:p-7 rounded-[32px] flex flex-col gap-4 shadow-xs">
        <div className="flex items-center gap-3 text-[#1A1A1A]">
          <Type className="w-7 h-7 text-[#E65F2B]" strokeWidth={2.75} />
          <h3 className="text-2xl font-black uppercase tracking-tight">Cỡ Chữ Hiển Thị</h3>
        </div>

        <p className="text-base sm:text-lg font-bold text-gray-600">
          Chọn kích cỡ chữ phù hợp nhất với mắt của Bác:
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {[
            { scale: 1.0, label: 'Vừa', desc: '100%' },
            { scale: 1.15, label: 'Lớn', desc: '115%' },
            { scale: 1.3, label: 'Rất Lớn', desc: '130%' },
            { scale: 1.45, label: 'Cực Đại', desc: '145%' },
          ].map((item) => {
            const isSelected = Math.abs(settings.fontSizeScale - item.scale) < 0.05;
            return (
              <button
                key={item.scale}
                id={`btn-font-scale-${item.scale}`}
                onClick={() => onUpdateSettings({ fontSizeScale: item.scale })}
                className={`min-h-[72px] rounded-[24px] font-black flex flex-col items-center justify-center p-2.5 transition-all active:scale-95 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#E65F2B] text-white shadow-lg shadow-orange-500/30 ring-4 ring-[#E65F2B]/30'
                    : 'bg-[#FDFBF7] text-[#1A1A1A] border-2 border-gray-300 hover:border-[#E65F2B] hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-1">
                  {isSelected && <Check className="w-5 h-5 stroke-[3]" />}
                  <span className="text-xl font-black uppercase tracking-wide">{item.label}</span>
                </div>
                <span className={`text-xs font-bold ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Font Preview Box */}
        <div className="bg-[#FDFBF7] border border-gray-200 p-4 rounded-[20px] mt-1">
          <p className="text-xs uppercase tracking-widest text-[#E65F2B] font-black mb-1">
            XEM TRƯỚC CỠ CHỮ HIỆN TẠI:
          </p>
          <p
            style={{ fontSize: `${20 * settings.fontSizeScale}px`, lineHeight: 1.4 }}
            className="font-black text-[#1A1A1A]"
          >
            "Amlodipine 5mg - Uống 1 viên sau khi ăn sáng"
          </p>
        </div>
      </div>

      {/* 3. SPEECH RATE ADJUSTMENT */}
      <div className="bg-white border-2 border-gray-200/90 p-6 sm:p-7 rounded-[32px] flex flex-col gap-4 shadow-xs">
        <div className="flex items-center gap-3 text-[#1A1A1A]">
          <Volume2 className="w-7 h-7 text-[#E65F2B]" strokeWidth={2.75} />
          <h3 className="text-2xl font-black uppercase tracking-tight">Tốc Độ Giọng Đọc</h3>
        </div>

        <p className="text-base sm:text-lg font-bold text-gray-600">
          Chọn tốc độ đọc hướng dẫn:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { rate: 0.85, label: '🐢 Chậm Rãi (Khuyên dùng)' },
            { rate: 1.0, label: '⚡ Bình Thường' },
          ].map((item) => (
            <button
              key={item.rate}
              onClick={() => onUpdateSettings({ speechRate: item.rate })}
              className={`min-h-[64px] rounded-[20px] font-black text-lg flex items-center justify-center gap-2 p-3 text-center transition-all active:scale-95 cursor-pointer ${
                Math.abs(settings.speechRate - item.rate) < 0.05
                  ? 'bg-[#E65F2B] text-white shadow-lg shadow-orange-500/25'
                  : 'bg-[#FDFBF7] text-[#1A1A1A] border-2 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {Math.abs(settings.speechRate - item.rate) < 0.05 && <Check className="w-5 h-5 stroke-[3] shrink-0" />}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Test voice button */}
        <button
          id="btn-test-voice-secondary"
          onClick={handleTestVoice}
          className="w-full min-h-[58px] bg-[#E65F2B]/10 text-[#E65F2B] hover:bg-[#E65F2B]/20 font-black text-lg rounded-[20px] flex items-center justify-center gap-3 active:scale-95 transition-all mt-1 uppercase tracking-wider cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>🔊 Thử Nghe Giọng Đọc Mẫu</span>
        </button>
      </div>

      {/* 4. AUTO-PLAY SOUND TOGGLE */}
      <div className="bg-white border-2 border-gray-200/90 p-6 sm:p-7 rounded-[32px] flex items-center justify-between gap-4 shadow-xs">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-[#1A1A1A] uppercase tracking-tight">
            Tự Động Đọc To
          </h3>
          <p className="text-sm sm:text-base font-bold text-gray-500 mt-0.5">
            Tự động đọc hướng dẫn thuốc ngay sau khi chụp xong
          </p>
        </div>

        <button
          id="btn-toggle-auto-read"
          onClick={() => onUpdateSettings({ autoReadSound: !settings.autoReadSound })}
          className={`w-20 h-11 rounded-full transition-colors relative flex items-center px-1 shrink-0 cursor-pointer ${
            settings.autoReadSound ? 'bg-[#E65F2B]' : 'bg-gray-300'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-full bg-white shadow-md transition-transform ${
              settings.autoReadSound ? 'translate-x-9' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* 5. EMERGENCY HOTLINES FOR SENIORS */}
      <div className="bg-white border-2 border-red-200 p-6 sm:p-7 rounded-[32px] flex flex-col gap-4 shadow-xs">
        <div className="flex items-center gap-3 text-red-600">
          <PhoneCall className="w-8 h-8 shrink-0" strokeWidth={2.75} />
          <h3 className="text-2xl font-black uppercase tracking-tight">Đường Dây Nóng Khẩn Cấp</h3>
        </div>

        <p className="text-base sm:text-lg font-bold text-gray-600">
          Khi có dấu hiệu bất thường về sức khỏe hoặc cần hỗ trợ y tế khẩn cấp:
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="tel:115"
            className="flex-1 min-h-[64px] bg-red-600 text-white rounded-[20px] flex items-center justify-center gap-3 font-black text-xl hover:bg-red-700 active:scale-95 shadow-md shadow-red-500/25 uppercase tracking-wide"
          >
            <PhoneCall className="w-6 h-6" strokeWidth={2.75} />
            <span>🚑 CẤP CỨU 115</span>
          </a>

          <a
            href="tel:19009095"
            className="flex-1 min-h-[64px] bg-[#2B67E6] text-white rounded-[20px] flex items-center justify-center gap-3 font-black text-xl hover:bg-[#2055cb] active:scale-95 shadow-md shadow-blue-500/25 uppercase tracking-wide"
          >
            <PhoneCall className="w-6 h-6" strokeWidth={2.75} />
            <span>📞 1900 9095 (Bộ Y Tế)</span>
          </a>
        </div>
      </div>

      {/* 6. ABOUT THE APP */}
      <div className="bg-[#E6F4EA] border-2 border-[#34A853]/30 p-5 rounded-[24px] flex items-center gap-4 text-center justify-center shadow-xs">
        <Heart className="w-7 h-7 text-red-500 fill-current shrink-0" />
        <p className="text-base text-[#137333] font-bold text-left">
          ĐọcGiùmTôi được thiết kế với tình yêu thương dành cho ông bà, cha mẹ Việt Nam.
        </p>
      </div>
    </div>
  );
};

