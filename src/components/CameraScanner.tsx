import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Zap,
  ZapOff,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Pill,
  Search,
  X,
  Calendar,
  Clock,
  Scan,
  Tag
} from 'lucide-react';
import { SAMPLE_MEDICINES, SampleMedicine } from '../data/sampleMedicines';
import { MedicineAnalysisResult, SeniorSettings } from '../types';
import { speechService } from '../services/speechService';

interface CameraScannerProps {
  settings: SeniorSettings;
  onAnalysisSuccess: (result: MedicineAnalysisResult, imagePreview?: string) => void;
  onError: (errorMsg: string) => void;
}

export type ScanMode = 'ALL_INFO' | 'EXPIRATION_FOCUS';

export const CameraScanner: React.FC<CameraScannerProps> = ({
  settings,
  onAnalysisSuccess,
  onError,
}) => {
  const [scanMode, setScanMode] = useState<ScanMode>('ALL_INFO');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('Đang phân tích hình ảnh...');
  const [textQuery, setTextQuery] = useState<string>('');
  const [showTextInput, setShowTextInput] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [cameraPermissionDenied, setCameraPermissionDenied] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera stream
  const startCamera = async () => {
    try {
      stopCamera();
      setCameraPermissionDenied(false);
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setCameraPermissionDenied(false);

      // Check for torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities?.() as any) || {};
      setHasTorch(!!capabilities.torch);
    } catch (err: any) {
      console.warn('Cannot open live camera:', err);
      setCameraActive(false);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraPermissionDenied(true);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    // Attempt camera startup if permissions allow, otherwise user can click
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  const processImagePayload = async (imageBase64: string, customQuery?: string) => {
    setIsLoading(true);
    setLoadingStep('Đang gửi hình ảnh nhãn bao bì đến trợ lý AI...');
    if (settings.soundFeedback) speechService.playFeedbackSound('beep');

    // Dynamic reassurance steps while AI processes
    const step1 = setTimeout(() => {
      setLoadingStep('Đang quét đọc chữ và tìm kiếm hạn sử dụng...');
    }, 1800);

    const step2 = setTimeout(() => {
      setLoadingStep('Đang đối chiếu thông tin và chuẩn bị giọng đọc...');
    }, 3800);

    try {
      const response = await fetch('/api/analyze-medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64,
          mimeType: 'image/jpeg',
          textQuery: customQuery || textQuery,
          scanMode: scanMode,
        }),
      });

      clearTimeout(step1);
      clearTimeout(step2);
      setLoadingStep('Đang hoàn tất thông tin cho Bác...');

      let json: any = null;
      try {
        const rawText = await response.text();
        json = JSON.parse(rawText);
      } catch (parseErr) {
        console.warn('Failed to parse response JSON:', parseErr);
        throw new Error('Máy chủ đang bận xử lý. Bác vui lòng đợi vài giây rồi bấm chụp lại nhé.');
      }

      if (!response.ok || !json || !json.success || !json.data) {
        throw new Error(json?.error || 'Không thể nhận diện được vỏ thuốc. Bác vui lòng thử chụp lại rõ nét hơn nhé.');
      }

      if (settings.soundFeedback) speechService.playFeedbackSound('success');
      stopCamera();
      onAnalysisSuccess(json.data, imageBase64);
    } catch (err: any) {
      clearTimeout(step1);
      clearTimeout(step2);
      console.error('Analysis error:', err);
      if (settings.soundFeedback) speechService.playFeedbackSound('alert');
      
      let message = err?.message || 'Lỗi khi đọc thuốc. Xin Bác chụp lại nơi đủ ánh sáng nhé.';
      if (message.includes('high demand') || message.includes('503') || message.includes('UNAVAILABLE')) {
        message = 'Máy chủ đang có nhiều người cùng tra cứu. Bác vui lòng đợi vài giây rồi bấm "Thử Lại" nhé.';
      } else if (message.startsWith('{') && message.includes('error')) {
        try {
          const parsed = JSON.parse(message);
          if (parsed?.error?.message) {
            message = parsed.error.message.includes('high demand') 
              ? 'Máy chủ đang có nhiều người cùng tra cứu. Bác vui lòng đợi vài giây rồi bấm "Thử Lại" nhé.'
              : parsed.error.message;
          }
        } catch {
          // keep sanitized
        }
      }
      onError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Capture current camera frame
  const capturePhoto = () => {
    if (settings.soundFeedback) speechService.playFeedbackSound('camera');

    if (!videoRef.current || !cameraActive) {
      // If camera stream is not live, trigger file upload dialog
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);

    processImagePayload(dataUrl);
  };

  // Handle uploaded file from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCapturedImage(base64);
      processImagePayload(base64);
    };
    reader.readAsDataURL(file);
  };

  // Select a preset sample medicine for instant demo
  const handleSelectSample = (sample: SampleMedicine) => {
    if (settings.soundFeedback) speechService.playFeedbackSound('success');
    stopCamera();
    onAnalysisSuccess(sample.result);
  };

  // Search by text query
  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textQuery.trim()) return;
    setIsLoading(true);
    setLoadingStep(`Đang tra cứu thông tin và hạn dùng "${textQuery}"...`);

    fetch('/api/analyze-medicine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textQuery: textQuery,
        scanMode: scanMode,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Không tìm thấy thuốc.');
        }
        if (settings.soundFeedback) speechService.playFeedbackSound('success');
        stopCamera();
        onAnalysisSuccess(json.data);
      })
      .catch((err) => {
        if (settings.soundFeedback) speechService.playFeedbackSound('alert');
        onError(err.message || 'Lỗi khi tra cứu thuốc.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3.5 pb-28 pt-1 px-3 sm:px-4">
      {/* 1. TOP CONCISE INSTRUCTION CARD */}
      <div
        id="card-top-instruction"
        className="bg-white border-2 border-[#E65F2B]/20 rounded-[28px] sm:rounded-[32px] p-4 sm:p-5 flex flex-col items-center justify-center gap-2 text-center shadow-sm transition-all"
      >
        <div className="w-10 h-10 rounded-full bg-[#E65F2B]/10 text-[#E65F2B] flex items-center justify-center">
          <Info className="w-6 h-6" strokeWidth={2.75} />
        </div>
        <p className="text-xl sm:text-2xl font-black text-[#1A1A1A] leading-tight tracking-tight">
          Chụp hình để đọc thông tin & hạn sử dụng
        </p>
      </div>

      {/* 2. CAMERA VIEWFINDER (OPTIMIZED LIVE PREVIEW) */}
      <div
        id="camera-viewfinder-container"
        className="relative w-full h-[70vh] sm:h-[75vh] md:h-[80vh] bg-[#111827] border-4 border-[#E65F2B] rounded-[32px] overflow-hidden shadow-2xl flex flex-col items-center justify-center transition-all"
      >
        {/* Live Video */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
        />

        {/* Minimalist Top Notification Pill Badge (Clean & Fixed near top edge of camera) */}
        <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20 px-4">
          <div
            id="pill-instruction-badge"
            className="bg-[#1A1A1A]/85 text-white backdrop-blur-md px-5 py-2.5 rounded-full border-2 border-white/30 shadow-xl flex items-center gap-2"
          >
            <Camera className="w-5 h-5 text-[#E65F2B] shrink-0" strokeWidth={2.75} />
            <span className="text-sm sm:text-base font-black tracking-wide uppercase text-white">
              📸 ĐẶT VẬT DỤNG VÀO KHUNG HÌNH
            </span>
          </div>
        </div>

        {/* Fallback if camera is inactive / Access Request */}
        {!cameraActive && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-gray-200 gap-3 z-10">
            <Camera className="w-16 h-16 text-[#E65F2B] animate-bounce" strokeWidth={2.5} />
            <p className="text-xl sm:text-2xl font-bold text-white max-w-md leading-snug">
              {cameraPermissionDenied
                ? 'Ứng dụng cần quyền truy cập Máy ảnh (Camera) để chụp và đọc nhãn'
                : 'Máy ảnh sẵn sàng để chụp nhãn sản phẩm hoặc soi hạn sử dụng'}
            </p>
            <button
              id="btn-camera-access-request"
              onClick={startCamera}
              className="mt-2 bg-[#E65F2B] text-white font-black px-7 py-3.5 rounded-full hover:bg-[#d85320] active:scale-95 shadow-lg shadow-orange-500/40 uppercase tracking-wider text-lg sm:text-xl flex items-center gap-2.5 cursor-pointer transition-all"
            >
              <Camera className="w-6 h-6 stroke-[2.75]" />
              <span>{cameraPermissionDenied ? 'CẤP QUYỀN MÁY ẢNH' : 'MỞ LẠI MÁY ẢNH'}</span>
            </button>
          </div>
        )}

        {/* Viewfinder Target Corner Framing Guides */}
        {cameraActive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6 sm:p-8 z-10">
            <div className="w-full flex justify-between">
              <div className="w-12 h-12 border-t-4 border-l-4 border-[#E65F2B] rounded-tl-2xl" />
              <div className="w-12 h-12 border-t-4 border-r-4 border-[#E65F2B] rounded-tr-2xl" />
            </div>

            <div className="w-full flex justify-between">
              <div className="w-12 h-12 border-b-4 border-l-4 border-[#E65F2B] rounded-bl-2xl" />
              <div className="w-12 h-12 border-b-4 border-r-4 border-[#E65F2B] rounded-br-2xl" />
            </div>
          </div>
        )}

        {/* Camera Control Overlays (Top-Right) */}
        {cameraActive && (
          <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-3 rounded-full shadow-lg cursor-pointer transition-all ${
                  torchOn ? 'bg-[#E65F2B] text-white ring-2 ring-white' : 'bg-black/60 text-white hover:bg-black/80'
                }`}
                title="Bật/Tắt đèn pin"
              >
                {torchOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
              </button>
            )}

            <button
              onClick={toggleCameraFacing}
              className="p-3 rounded-full bg-black/60 text-white shadow-lg hover:bg-black/80 cursor-pointer transition-all"
              title="Đổi camera trước/sau"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center p-6 text-center gap-6 backdrop-blur-md">
            {/* Perfectly circular dual-layer spinner */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
              {/* Outer soft track ring */}
              <div className="w-full h-full rounded-full border-[6px] border-orange-100 shrink-0" />
              {/* Spinning active orange arc */}
              <div className="absolute inset-0 w-full h-full rounded-full border-[6px] border-transparent border-t-[#E65F2B] border-r-[#E65F2B] animate-spin shrink-0" />
              {/* Inner glowing icon */}
              <div className="absolute inset-0 flex items-center justify-center text-[#E65F2B]">
                <Camera className="w-9 h-9 animate-pulse text-[#E65F2B]" strokeWidth={2.5} />
              </div>
            </div>

            <div className="max-w-md">
              <h3 className="text-2xl sm:text-3xl font-black uppercase text-[#E65F2B] mb-2 tracking-tight">
                ĐANG ĐỌC NHÃN BAO BÌ & HSD
              </h3>
              <p className="text-xl sm:text-2xl font-bold text-[#1A1A1A] leading-relaxed">
                {loadingStep}
              </p>
              <p className="text-base text-gray-500 mt-3 font-medium italic">
                Bác chờ cháu một chút xíu nhé, cháu đang tìm hạn sử dụng và kiểm tra cho Bác...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. MASSIVE PRIMARY ACTION BUTTON */}
      <button
        id="btn-capture-medicine"
        onClick={capturePhoto}
        disabled={isLoading}
        className="w-full min-h-[130px] sm:min-h-[150px] bg-[#E65F2B] hover:bg-[#d85320] text-white rounded-[32px] flex flex-col justify-center items-center gap-2 active:scale-[0.98] transition-all shadow-xl shadow-orange-500/25 focus:outline-none focus:ring-4 focus:ring-orange-300 disabled:opacity-50 cursor-pointer"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center">
          <Camera className="w-9 h-9 sm:w-10 sm:h-10 text-white" strokeWidth={2.75} />
        </div>
        <span className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-center px-4 leading-none text-white">
          CHỤP HÌNH NHÃN SẢN PHẨM
        </span>
        <span className="text-xs sm:text-sm font-bold text-white/90 uppercase tracking-wider">
          (Bấm vào đây để AI đọc tên & Hạn Sử Dụng ngay)
        </span>
      </button>

      {/* 3. SECONDARY ACTIONS: UPLOAD PHOTO & TYPE MEDICINE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Upload file button */}
        <button
          id="btn-upload-photo"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="min-h-[68px] bg-[#E65F2B] text-white rounded-[24px] flex items-center justify-center gap-3 font-black text-lg sm:text-xl px-5 hover:bg-[#d85320] active:scale-95 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
        >
          <Upload className="w-6 h-6 text-white" strokeWidth={2.75} />
          <span className="uppercase tracking-wider">TẢI ẢNH TỪ MÁY</span>
        </button>

        {/* Search by text button */}
        <button
          id="btn-toggle-text-search"
          onClick={() => setShowTextInput(!showTextInput)}
          className="min-h-[68px] bg-white text-[#1A1A1A] border-2 border-gray-300 rounded-[24px] flex items-center justify-center gap-3 font-black text-lg sm:text-xl px-5 hover:bg-gray-50 active:scale-95 transition-all shadow-sm cursor-pointer"
        >
          <Search className="w-6 h-6 text-[#E65F2B]" strokeWidth={2.75} />
          <span className="uppercase tracking-wider">GÕ TÊN TAY</span>
        </button>
      </div>

      {/* Manual Text Search Accordion */}
      {showTextInput && (
        <form
          onSubmit={handleTextSearch}
          className="bg-white border-2 border-[#E65F2B]/40 p-6 rounded-[28px] flex flex-col gap-4 shadow-lg"
        >
          <label htmlFor="input-medicine-name" className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Pill className="w-6 h-6 text-[#E65F2B]" />
            <span>Nhập tên thuốc, thực phẩm hoặc sản phẩm Bác cần hỏi:</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id="input-medicine-name"
              type="text"
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              placeholder="Ví dụ: Dầu gội Sunsilk, Amlodipine, Sữa TH True Milk..."
              className="flex-1 min-h-[58px] bg-[#F7F9FC] border-2 border-gray-300 rounded-[20px] px-5 text-xl font-bold text-[#1A1A1A] placeholder-gray-400 focus:border-[#E65F2B] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !textQuery.trim()}
              className="min-h-[58px] px-8 bg-[#E65F2B] text-white font-black text-xl rounded-[20px] hover:bg-[#d85320] active:scale-95 disabled:opacity-50 uppercase tracking-wider cursor-pointer shadow-md shadow-orange-500/20"
            >
              TRA CỨU
            </button>
          </div>
        </form>
      )}

      {/* 6. SAMPLE ITEMS FOR INSTANT 1-TAP DEMO */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center gap-2 text-[#1A1A1A]">
          <Sparkles className="w-6 h-6 text-[#E65F2B]" />
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            Hoặc chọn sản phẩm mẫu để thử ngay:
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SAMPLE_MEDICINES.map((sample) => (
            <button
              key={sample.id}
              id={`sample-btn-${sample.id}`}
              onClick={() => handleSelectSample(sample)}
              className="bg-white border-2 border-gray-200/90 rounded-[24px] p-4 flex items-center justify-between gap-3 text-left hover:border-[#E65F2B] hover:shadow-md active:scale-95 transition-all group cursor-pointer"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {sample.typeBadge}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      sample.result.expiration_info?.status === 'EXPIRED'
                        ? 'bg-red-100 text-red-700'
                        : sample.result.expiration_info?.status === 'VALID'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {sample.result.expiration_info?.status === 'EXPIRED'
                      ? 'Hết hạn'
                      : sample.result.expiration_info?.status === 'VALID'
                      ? 'Còn hạn'
                      : 'Mờ HSD'}
                  </span>
                </div>
                <h4 className="text-lg sm:text-xl font-black text-[#1A1A1A] mt-1 group-hover:text-[#E65F2B] transition-colors">
                  {sample.name}
                </h4>
                <p className="text-xs sm:text-sm font-semibold text-gray-500 line-clamp-1">
                  {sample.result.expiration_info?.expiry_date_text}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-50 text-[#E65F2B] flex items-center justify-center shrink-0 group-hover:bg-[#E65F2B] group-hover:text-white transition-all">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
