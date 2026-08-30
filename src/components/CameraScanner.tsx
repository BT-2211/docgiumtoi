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
  Tag,
  RotateCcw,
  Timer
} from 'lucide-react';
import { SAMPLE_MEDICINES, SampleMedicine } from '../data/sampleMedicines';
import { MedicineAnalysisResult, MultiSideSession, SeniorSettings } from '../types';
import { speechService } from '../services/speechService';
import { compressImage } from '../utils/imageCompressor';

const MULTI_SIDE_STORAGE_KEY = 'docgiumtoi_multi_side_session';
const MULTI_SIDE_TIMEOUT_SECONDS = 45;

interface CameraScannerProps {
  settings: SeniorSettings;
  isActive?: boolean;
  onAnalysisSuccess: (result: MedicineAnalysisResult, imagePreview?: string) => void;
  onError: (errorMsg: string) => void;
}

export type ScanMode = 'ALL_INFO' | 'EXPIRATION_FOCUS';

export const CameraScanner: React.FC<CameraScannerProps> = ({
  settings,
  isActive = true,
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

  // Multi-side session state
  const [multiSideSession, setMultiSideSession] = useState<MultiSideSession | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(MULTI_SIDE_TIMEOUT_SECONDS);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);

  // Flash shutter visual state & capture flash state
  const [isFlashingShutter, setIsFlashingShutter] = useState<boolean>(false);

  // Smart Auto-Flash state
  const [autoFlashNotice, setAutoFlashNotice] = useState<boolean>(false);
  const manualTorchOverrideRef = useRef<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isActiveRef = useRef<boolean>(isActive);
  const cameraSessionIdRef = useRef<number>(0);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, []);

  // Initialize and check multi-side session on mount and reload
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(MULTI_SIDE_STORAGE_KEY);
      if (raw) {
        const parsed: MultiSideSession = JSON.parse(raw);
        const elapsed = (Date.now() - parsed.timestamp) / 1000;
        if (elapsed < MULTI_SIDE_TIMEOUT_SECONDS) {
          setMultiSideSession(parsed);
          setCountdownSeconds(Math.max(1, Math.round(MULTI_SIDE_TIMEOUT_SECONDS - elapsed)));
        } else {
          sessionStorage.removeItem(MULTI_SIDE_STORAGE_KEY);
          setMultiSideSession(null);
        }
      }
    } catch (e) {
      console.warn('Failed to parse multi-side session from sessionStorage:', e);
    }
  }, []);

  // 45-second timer countdown for multi-side capture
  useEffect(() => {
    if (!multiSideSession) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          // 45 seconds expired! Clean up sessionStorage and reset
          clearInterval(timer);
          sessionStorage.removeItem(MULTI_SIDE_STORAGE_KEY);
          setMultiSideSession(null);
          setSessionExpiredNotice('Đã quá 45 giây chờ chụp mặt sau. Trợ lý đã đặt lại về chế độ chụp ban đầu ạ.');
          setTimeout(() => setSessionExpiredNotice(null), 6000);
          return MULTI_SIDE_TIMEOUT_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [multiSideSession]);

  const handleCancelMultiSide = () => {
    sessionStorage.removeItem(MULTI_SIDE_STORAGE_KEY);
    setMultiSideSession(null);
    setCountdownSeconds(MULTI_SIDE_TIMEOUT_SECONDS);
  };

  // Smart Auto-Flash: Detect ambient light level from video stream and auto-trigger Flash
  useEffect(() => {
    if (!cameraActive) return;

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = 24;
    offscreenCanvas.height = 24;
    const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

    const checkBrightnessInterval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !ctx) return;

      try {
        ctx.drawImage(video, 0, 0, 24, 24);
        const frameData = ctx.getImageData(0, 0, 24, 24);
        const data = frameData.data;
        let totalBrightness = 0;
        const totalPixels = 24 * 24;

        for (let i = 0; i < data.length; i += 4) {
          totalBrightness += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }

        const avgBrightness = totalBrightness / totalPixels;

        // If environment is dark (< 48 luminance out of 255) and user hasn't manually overridden
        if (avgBrightness < 48 && !torchOn && !manualTorchOverrideRef.current) {
          triggerAutoFlash();
        }
      } catch (err) {
        // Ignore cross-origin issues
      }
    }, 1200);

    return () => {
      clearInterval(checkBrightnessInterval);
    };
  }, [cameraActive, torchOn, hasTorch]);

  const triggerAutoFlash = async () => {
    if (streamRef.current && hasTorch) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities = (track.getCapabilities?.() as any) || {};
          if (capabilities.torch && typeof (track as any).applyConstraints === 'function') {
            await (track as any).applyConstraints({
              advanced: [{ torch: true }],
            }).catch(() => {});
          }
        } catch (e) {
          console.warn('Auto torch apply failed:', e);
        }
      }
    }
    setTorchOn(true);
    setAutoFlashNotice(true);
    if (settings.soundFeedback) {
      speechService.playFeedbackSound('beep');
    }
    setTimeout(() => {
      setAutoFlashNotice(false);
    }, 4500);
  };

  const releaseMediaStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          if (track && typeof track.getCapabilities === 'function') {
            const capabilities = (track.getCapabilities() as any) || {};
            if (capabilities.torch && typeof (track as any).applyConstraints === 'function') {
              (track as any).applyConstraints({
                advanced: [{ torch: false }],
              }).catch(() => {});
            }
          }
        } catch {}
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch {}
    }
    setTorchOn(false);
    setAutoFlashNotice(false);
  };

  const stopCamera = () => {
    cameraSessionIdRef.current++; // Invalidate pending startCamera promises
    releaseMediaStream();
    setCameraActive(false);
  };

  // Initialize camera stream
  const startCamera = async () => {
    // Release any old stream without invalidating the new session
    releaseMediaStream();

    const currentSession = ++cameraSessionIdRef.current;

    if (!isActiveRef.current || !isMountedRef.current) {
      return;
    }

    try {
      setCameraPermissionDenied(false);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraActive(false);
        return;
      }

      let stream: MediaStream | null = null;
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintErr: any) {
        console.warn('Primary camera constraints failed, attempting fallback:', constraintErr);
        // Fallback with relaxed constraint
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false,
          });
        } catch {
          // Final fallback with bare video
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (!stream) {
        setCameraActive(false);
        return;
      }

      // Critical check: if user navigated away or unmounted while waiting for camera access
      if (!isMountedRef.current || !isActiveRef.current || currentSession !== cameraSessionIdRef.current) {
        stream.getTracks().forEach((track) => {
          try {
            const capabilities = (track.getCapabilities?.() as any) || {};
            if (capabilities.torch && typeof (track as any).applyConstraints === 'function') {
              (track as any).applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
            }
          } catch {}
          try {
            track.stop();
          } catch {}
        });
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play error:', playErr);
        }
      }

      setCameraActive(true);
      setCameraPermissionDenied(false);

      // Check for torch capability safely
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        try {
          const capabilities = (track.getCapabilities() as any) || {};
          setHasTorch(Boolean(capabilities.torch));
        } catch {
          setHasTorch(false);
        }
      } else {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.warn('Cannot open live camera:', err);
      setCameraActive(false);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraPermissionDenied(true);
      }
    }
  };

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [facingMode, isActive]);

  // Turn off camera & flash when user switches browser tab or minimizes app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      } else if (isActive) {
        startCamera();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, facingMode]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const toggleTorch = async () => {
    const nextState = !torchOn;
    manualTorchOverrideRef.current = !nextState; // If turning off manually, respect override

    if (streamRef.current && hasTorch) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && typeof (track as any).applyConstraints === 'function') {
        try {
          const capabilities = (track.getCapabilities?.() as any) || {};
          if (capabilities.torch) {
            await (track as any).applyConstraints({
              advanced: [{ torch: nextState }],
            }).catch(() => {});
          }
        } catch (e) {
          console.warn('Torch toggle failed:', e);
        }
      }
    }
    setTorchOn(nextState);
    if (nextState) {
      setAutoFlashNotice(false);
    }
  };

  const processImagePayload = async (imageBase64: string, customQuery?: string) => {
    setIsLoading(true);
    setLoadingStep(
      multiSideSession
        ? `Đang đối chiếu mặt sau với "${multiSideSession.item_name}" và tìm HSD...`
        : 'Đang gửi hình ảnh nhãn bao bì đến trợ lý AI...'
    );
    if (settings.soundFeedback) speechService.playFeedbackSound('beep');

    const step1 = setTimeout(() => {
      setLoadingStep('Đang quét đọc chữ và tìm kiếm hạn sử dụng...');
    }, 1800);

    const step2 = setTimeout(() => {
      setLoadingStep('Đang đối chiếu thông tin và chuẩn bị giọng đọc...');
    }, 3800);

    try {
      // Send step and previousItemName for cross-product validation & model routing
      const payload: any = {
        imageBase64: imageBase64,
        mimeType: 'image/jpeg',
        textQuery: customQuery || textQuery,
        scanMode: multiSideSession ? 'EXPIRATION_FOCUS' : scanMode,
        step: multiSideSession ? 2 : 1,
        previousItemName: multiSideSession ? multiSideSession.item_name : undefined,
      };

      const response = await fetch('/api/analyze-medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        throw new Error('Máy chủ đang bận xử lý. Bác vui lòng đợi vài giây rồi bấm chụp lại ạ.');
      }

      if (!response.ok || !json || !json.success || !json.data) {
        throw new Error(json?.error || 'Không thể nhận diện được vỏ sản phẩm. Bác vui lòng thử chụp lại rõ nét hơn ạ.');
      }

      const result: MedicineAnalysisResult = json.data;

      // Handle multi-side session persistence
      if (result.status === 'need_second_side') {
        const newSession: MultiSideSession = {
          step: 2,
          item_name: result.item_name || result.product_name || 'Sản phẩm',
          timestamp: Date.now(),
          first_side_data: result,
          first_side_image: imageBase64,
        };
        try {
          sessionStorage.setItem(MULTI_SIDE_STORAGE_KEY, JSON.stringify(newSession));
          setMultiSideSession(newSession);
          setCountdownSeconds(MULTI_SIDE_TIMEOUT_SECONDS);
        } catch (e) {
          console.warn('Failed to save to sessionStorage:', e);
        }
      } else {
        // If capture was completed (success, individual_pack, cross_product_mismatch, etc.)
        sessionStorage.removeItem(MULTI_SIDE_STORAGE_KEY);
        setMultiSideSession(null);
      }

      if (settings.soundFeedback) speechService.playFeedbackSound('success');
      stopCamera();
      onAnalysisSuccess(result, imageBase64);
    } catch (err: any) {
      clearTimeout(step1);
      clearTimeout(step2);
      console.error('Analysis error:', err);
      if (settings.soundFeedback) speechService.playFeedbackSound('alert');

      let message = err?.message || 'Lỗi khi đọc sản phẩm. Xin Bác chụp lại nơi đủ ánh sáng ạ.';
      if (message.includes('high demand') || message.includes('503') || message.includes('UNAVAILABLE')) {
        message = 'Máy chủ đang có nhiều người cùng tra cứu. Bác vui lòng đợi vài giây rồi bấm "Thử Lại" ạ.';
      } else if (message.startsWith('{') && message.includes('error')) {
        try {
          const parsed = JSON.parse(message);
          if (parsed?.error?.message) {
            message = parsed.error.message.includes('high demand')
              ? 'Máy chủ đang có nhiều người cùng tra cứu. Bác vui lòng đợi vài giây rồi bấm "Thử Lại" ạ.'
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

  // Capture current camera frame with simultaneous flash activation and post-capture shutoff
  const capturePhoto = async () => {
    // Prime and unlock audio context immediately on direct user click
    speechService.primeAudio();

    if (!videoRef.current || !cameraActive) {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }

    if (settings.soundFeedback) speechService.playFeedbackSound('camera');

    // Trigger visual screen shutter flash
    setIsFlashingShutter(true);
    setTimeout(() => setIsFlashingShutter(false), 300);

    const track = streamRef.current?.getVideoTracks()[0];
    let temporaryTorchActivated = false;

    // Turn ON flash simultaneously when clicking capture to illuminate the object and avoid blurry images
    if (track && !torchOn) {
      try {
        const capabilities = (track.getCapabilities?.() as any) || {};
        if (capabilities.torch && typeof (track as any).applyConstraints === 'function') {
          await (track as any).applyConstraints({
            advanced: [{ torch: true }],
          }).catch(() => {});
          temporaryTorchActivated = true;
          // Brief 180ms delay for camera sensor exposure and focus to adapt to bright flash light
          await new Promise((resolve) => setTimeout(resolve, 180));
        }
      } catch (err) {
        console.warn('Capture flash activation error:', err);
      }
    }

    let compressedDataUrl: string | null = null;
    try {
      compressedDataUrl = await compressImage(videoRef.current, 1024, 0.85);
    } catch (err) {
      console.warn('Capture/compression fallback:', err);
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(1024, video.videoWidth || 640);
      canvas.height = Math.min(1024, video.videoHeight || 480);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    // Turn OFF flash immediately after the photo frame has been captured
    if (temporaryTorchActivated && track) {
      try {
        if (typeof (track as any).applyConstraints === 'function') {
          await (track as any).applyConstraints({
            advanced: [{ torch: false }],
          }).catch(() => {});
        }
      } catch (err) {
        console.warn('Capture flash deactivation error:', err);
      }
    }

    if (compressedDataUrl) {
      setCapturedImage(compressedDataUrl);
      processImagePayload(compressedDataUrl);
    }
  };

  // Handle uploaded file from device with compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 1024, 0.8);
      setCapturedImage(compressed);
      processImagePayload(compressed);
    } catch (err) {
      console.warn('File upload compression failed, falling back to raw reader:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setCapturedImage(base64);
        processImagePayload(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Select a preset sample medicine for instant demo
  const handleSelectSample = (sample: SampleMedicine) => {
    if (settings.soundFeedback) speechService.playFeedbackSound('success');
    stopCamera();
    sessionStorage.removeItem(MULTI_SIDE_STORAGE_KEY);
    setMultiSideSession(null);
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
          throw new Error(json.error || 'Không tìm thấy sản phẩm.');
        }
        if (settings.soundFeedback) speechService.playFeedbackSound('success');
        stopCamera();
        sessionStorage.removeItem(MULTI_SIDE_STORAGE_KEY);
        setMultiSideSession(null);
        onAnalysisSuccess(json.data);
      })
      .catch((err) => {
        if (settings.soundFeedback) speechService.playFeedbackSound('alert');
        onError(err.message || 'Lỗi khi tra cứu sản phẩm.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3.5 pb-28 pt-1 px-3 sm:px-4">
      {/* MULTI-SIDE CAPTURE STATE BANNER (WITH 45S COUNTDOWN TIMER) */}
      {multiSideSession && (
        <div
          id="banner-multi-side-mode"
          className="bg-blue-600 text-white rounded-[28px] p-4 sm:p-5 flex flex-col gap-3 shadow-lg border-2 border-blue-400 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-7 h-7 text-yellow-300 animate-spin" style={{ animationDuration: '8s' }} strokeWidth={2.75} />
              <span className="text-lg sm:text-xl font-black uppercase tracking-wide">
                ĐANG CHỤP MẶT 2: TÌM HẠN SỬ DỤNG
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-yellow-400 text-blue-950 px-3 py-1 rounded-full font-black text-sm uppercase tracking-wider shadow-sm">
              <Timer className="w-4 h-4" />
              <span>{countdownSeconds}s</span>
            </div>
          </div>

          <p className="text-base sm:text-lg font-bold leading-snug text-blue-50">
            Bác đang chụp mặt sau hoặc mặt đáy của: <span className="text-yellow-300 underline font-black">{multiSideSession.item_name}</span>
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-blue-400/50 text-xs sm:text-sm font-semibold">
            <span className="text-blue-100">
              Tự động trở về màn hình chính sau {countdownSeconds} giây nếu không chụp.
            </span>
            <button
              onClick={handleCancelMultiSide}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full font-bold transition-all cursor-pointer"
            >
              Hủy / Đổi món khác
            </button>
          </div>
        </div>
      )}

      {/* SESSION EXPIRED TOAST NOTICE */}
      {sessionExpiredNotice && (
        <div className="bg-amber-100 border-2 border-amber-400 text-amber-900 rounded-[20px] p-3.5 text-base font-bold text-center shadow-sm">
          {sessionExpiredNotice}
        </div>
      )}

      {/* 1. TOP CONCISE INSTRUCTION CARD (Standard mode) */}
      {!multiSideSession && (
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
      )}

      {/* 2. CAMERA VIEWFINDER (OPTIMIZED LIVE PREVIEW) */}
      <div
        id="camera-viewfinder-container"
        className={`relative w-full h-[70vh] sm:h-[75vh] md:h-[80vh] bg-[#111827] border-4 ${
          multiSideSession ? 'border-blue-500' : 'border-[#E65F2B]'
        } rounded-[32px] overflow-hidden shadow-2xl flex flex-col items-center justify-center transition-all`}
      >
        {/* Live Video */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transition-transform duration-300 ${cameraActive ? 'block' : 'hidden'} ${
            facingMode === 'user' ? '-scale-x-100' : 'scale-x-100'
          } ${
            torchOn ? 'brightness-110 contrast-105' : ''
          }`}
        />

        {/* Visual Camera Shutter Flash Overlay */}
        {isFlashingShutter && (
          <div
            id="shutter-flash-overlay"
            className="absolute inset-0 bg-white z-30 pointer-events-none transition-opacity duration-300 opacity-90"
          />
        )}

        {/* Minimalist Top Notification Pill Badge */}
        <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20 px-16 sm:px-20">
          <div
            id="pill-instruction-badge"
            className={`${
              multiSideSession ? 'bg-blue-900/90 border-blue-400' : 'bg-[#1A1A1A]/85 border-white/30'
            } text-white backdrop-blur-md px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border-2 shadow-xl flex items-center gap-2 text-center max-w-full`}
          >
            {multiSideSession ? (
              <>
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 shrink-0" strokeWidth={2.75} />
                <span className="text-xs sm:text-base font-black tracking-wide uppercase text-white truncate">
                  LẬT MẶT SAU / ĐÁY SOI HSD
                </span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-[#E65F2B] shrink-0" strokeWidth={2.75} />
                <span className="text-xs sm:text-base font-black tracking-wide uppercase text-white truncate">
                  ĐẶT VẬT DỤNG VÀO KHUNG HÌNH
                </span>
              </>
            )}
          </div>
        </div>

        {/* Smart Auto-Flash Toast Notification */}
        {autoFlashNotice && (
          <div
            id="toast-auto-flash-notification"
            className="absolute bottom-4 inset-x-4 mx-auto max-w-sm bg-yellow-400 text-yellow-950 border-2 border-yellow-200 px-4 py-2.5 rounded-full shadow-2xl flex items-center justify-center gap-2 z-20 animate-bounce font-black text-xs sm:text-sm text-center"
          >
            <span className="text-base">💡</span>
            <span>Đã tự động bật đèn Flash để đọc rõ hơn ạ</span>
          </div>
        )}

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
              <div className={`w-12 h-12 border-t-4 border-l-4 ${multiSideSession ? 'border-blue-400' : 'border-[#E65F2B]'} rounded-tl-2xl`} />
              <div className={`w-12 h-12 border-t-4 border-r-4 ${multiSideSession ? 'border-blue-400' : 'border-[#E65F2B]'} rounded-tr-2xl`} />
            </div>

            <div className="w-full flex justify-between">
              <div className={`w-12 h-12 border-b-4 border-l-4 ${multiSideSession ? 'border-blue-400' : 'border-[#E65F2B]'} rounded-bl-2xl`} />
              <div className={`w-12 h-12 border-b-4 border-r-4 ${multiSideSession ? 'border-blue-400' : 'border-[#E65F2B]'} rounded-br-2xl`} />
            </div>
          </div>
        )}

        {/* Camera Control Overlays (Top-Right) */}
        {cameraActive && (
          <div className="absolute top-4 right-3 sm:right-4 flex items-center gap-2 z-20">
            {/* Manual Flash Toggle Icon Button (Compact Icon Only) */}
            <button
              id="btn-toggle-flash-manual"
              onClick={toggleTorch}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xl backdrop-blur-md border-2 transition-all cursor-pointer ${
                torchOn
                  ? 'bg-yellow-400 text-yellow-950 border-yellow-200 ring-2 ring-yellow-400/80 shadow-yellow-500/30'
                  : 'bg-black/60 text-white border-white/30 hover:bg-black/80'
              }`}
              title={torchOn ? 'Đang bật Flash (Chạm để tắt)' : 'Đang tắt Flash (Chạm để bật)'}
              aria-label={torchOn ? 'Tắt đèn Flash' : 'Bật đèn Flash'}
            >
              {torchOn ? (
                <Zap className="w-5 h-5 fill-current text-yellow-950 animate-pulse" />
              ) : (
                <ZapOff className="w-5 h-5 text-gray-200" />
              )}
            </button>

            {/* Flip camera */}
            <button
              id="btn-toggle-camera-facing"
              onClick={toggleCameraFacing}
              className="w-11 h-11 rounded-full bg-black/60 text-white shadow-lg hover:bg-black/80 flex items-center justify-center border-2 border-white/30 cursor-pointer transition-all active:scale-95"
              title="Đổi camera trước/sau"
              aria-label="Đổi camera trước hoặc sau"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center p-6 text-center gap-6 backdrop-blur-md">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
              <div className="w-full h-full rounded-full border-[6px] border-orange-100 shrink-0" />
              <div className="absolute inset-0 w-full h-full rounded-full border-[6px] border-transparent border-t-[#E65F2B] border-r-[#E65F2B] animate-spin shrink-0" />
              <div className="absolute inset-0 flex items-center justify-center text-[#E65F2B]">
                <Camera className="w-9 h-9 animate-pulse text-[#E65F2B]" strokeWidth={2.5} />
              </div>
            </div>

            <div className="max-w-md">
              <h3 className="text-2xl sm:text-3xl font-black uppercase text-[#E65F2B] mb-2 tracking-tight">
                {multiSideSession ? 'ĐANG QUÉT MẶT SAU & HSD' : 'ĐANG ĐỌC NHÃN BAO BÌ & HSD'}
              </h3>
              <p className="text-xl sm:text-2xl font-bold text-[#1A1A1A] leading-relaxed">
                {loadingStep}
              </p>
              <p className="text-base text-gray-500 mt-3 font-medium italic">
                Bác chờ cháu một chút ạ, cháu đang tìm hạn sử dụng và kiểm tra cho Bác...
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
        className={`w-full min-h-[130px] sm:min-h-[150px] ${
          multiSideSession ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-[#E65F2B] hover:bg-[#d85320] shadow-orange-500/25'
        } text-white rounded-[32px] flex flex-col justify-center items-center gap-2 active:scale-[0.98] transition-all shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-300 disabled:opacity-50 cursor-pointer`}
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center">
          {multiSideSession ? (
            <RotateCcw className="w-9 h-9 sm:w-10 sm:h-10 text-white" strokeWidth={2.75} />
          ) : (
            <Camera className="w-9 h-9 sm:w-10 sm:h-10 text-white" strokeWidth={2.75} />
          )}
        </div>
        <span className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-center px-4 leading-none text-white">
          {multiSideSession ? 'CHỤP MẶT SAU / MẶT ĐÁY' : 'ẤN ĐỂ CHỤP'}
        </span>
        <span className="text-xs sm:text-sm font-bold text-white/90 uppercase tracking-wider">
          {multiSideSession
            ? `(Đối chiếu với ${multiSideSession.item_name} & Đọc HSD)`
            : '(Bấm vào đây để AI đọc thông tin & Hạn Sử Dụng ngay)'}
        </span>
      </button>

      {/* 3. SECONDARY ACTIONS: UPLOAD PHOTO & TYPE MEDICINE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        <button
          id="btn-upload-photo"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="min-h-[68px] bg-[#E65F2B] text-white rounded-[24px] flex items-center justify-center gap-3 font-black text-lg sm:text-xl px-5 hover:bg-[#d85320] active:scale-95 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
        >
          <Upload className="w-6 h-6 text-white" strokeWidth={2.75} />
          <span className="uppercase tracking-wider">TẢI ẢNH TỪ MÁY</span>
        </button>

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
                      sample.result.status === 'need_second_side'
                        ? 'bg-blue-100 text-blue-800'
                        : sample.result.status === 'individual_pack'
                        ? 'bg-amber-100 text-amber-800'
                        : sample.result.status === 'cross_product_mismatch'
                        ? 'bg-red-100 text-red-800'
                        : sample.result.expiration_info?.status === 'EXPIRED'
                        ? 'bg-red-100 text-red-700'
                        : sample.result.expiration_info?.status === 'VALID'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {sample.result.status === 'need_second_side'
                      ? 'Lật mặt sau'
                      : sample.result.status === 'individual_pack'
                      ? 'Gói lẻ'
                      : sample.result.status === 'cross_product_mismatch'
                      ? 'Khác mặt 1'
                      : sample.result.expiration_info?.status === 'EXPIRED'
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
