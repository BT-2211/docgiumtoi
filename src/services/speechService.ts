// ResponsiveVoice Type Definition
declare global {
  interface Window {
    responsiveVoice?: {
      speak: (
        text: string,
        voice?: string,
        parameters?: {
          pitch?: number;
          rate?: number;
          volume?: number;
          onstart?: () => void;
          onend?: () => void;
          onerror?: (e: any) => void;
        }
      ) => void;
      cancel: () => void;
      pause?: () => void;
      resume?: () => void;
      isPlaying: () => boolean;
      voiceSupport: () => boolean;
      getVoices: () => Array<{ name: string; flag: string; gender: string; lang: string }>;
    };
  }
}

export type ResponsiveVoiceGender = 'Vietnamese Female' | 'Vietnamese Male';

class SpeechService {
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;
  private selectedVoiceName: ResponsiveVoiceGender = 'Vietnamese Female';
  private onStateChangeCallbacks: Set<(state: { isSpeaking: boolean; isPaused: boolean }) => void> = new Set();
  private audioCtx: AudioContext | null = null;

  // Sentence-by-sentence playback queue for reliable pause/resume and zero cutoff
  private currentSentences: string[] = [];
  private currentSentenceIndex: number = 0;
  private currentRate: number = 0.9;
  private currentVoice: ResponsiveVoiceGender = 'Vietnamese Female';
  private playbackTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedVoice = localStorage.getItem('docgiumtoi_rv_voice');
      if (savedVoice === 'Vietnamese Male' || savedVoice === 'Vietnamese Female') {
        this.selectedVoiceName = savedVoice;
      }
    }
  }

  public getSelectedVoiceName(): ResponsiveVoiceGender {
    return this.selectedVoiceName;
  }

  public setSelectedVoiceName(voiceName: ResponsiveVoiceGender) {
    this.selectedVoiceName = voiceName;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('docgiumtoi_rv_voice', voiceName);
    }
    this.notify();
  }

  public subscribe(callback: (state: { isSpeaking: boolean; isPaused: boolean }) => void) {
    this.onStateChangeCallbacks.add(callback);
    callback({ isSpeaking: this.isSpeaking, isPaused: this.isPaused });
    return () => {
      this.onStateChangeCallbacks.delete(callback);
    };
  }

  private notify() {
    this.onStateChangeCallbacks.forEach((cb) =>
      cb({ isSpeaking: this.isSpeaking, isPaused: this.isPaused })
    );
  }

  /**
   * Split full text into meaningful phrases and sentences so ResponsiveVoice never cuts off,
   * and pause/resume operates instantly and precisely.
   */
  private splitIntoSentences(text: string): string[] {
    if (!text) return [];
    // Clean text
    const clean = text.replace(/\s+/g, ' ').trim();
    
    // Split by sentence terminators (. ! ? : \n) while keeping meaningful lengths
    const parts = clean.split(/(?<=[.!?:\n])\s+/);
    const result: string[] = [];
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length > 0) {
        // If an individual clause is overly long (>180 chars), split by comma/semicolon
        if (trimmed.length > 180) {
          const subParts = trimmed.split(/(?<=[,;])\s+/);
          for (const sub of subParts) {
            const subTrimmed = sub.trim();
            if (subTrimmed.length > 0) {
              result.push(subTrimmed);
            }
          }
        } else {
          result.push(trimmed);
        }
      }
    }
    return result.length > 0 ? result : [clean];
  }

  /**
   * Main speech output using ResponsiveVoice JS with resilient sentence chunking
   */
  public speak(
    text: string,
    rate = 0.9,
    voice?: ResponsiveVoiceGender
  ) {
    if (!text || text.trim().length === 0) return;

    // Stop and clear previous playback
    this.stop();

    this.currentVoice = voice || this.selectedVoiceName || 'Vietnamese Female';
    this.currentRate = rate || 0.9;
    this.currentSentences = this.splitIntoSentences(text);
    this.currentSentenceIndex = 0;
    this.isSpeaking = true;
    this.isPaused = false;
    this.notify();

    this.playNextSentence();
  }

  /**
   * Play the current sentence in the queue
   */
  private playNextSentence() {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }

    if (!this.isSpeaking || this.isPaused) {
      return;
    }

    if (this.currentSentenceIndex >= this.currentSentences.length) {
      // Completed all sentences
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentSentences = [];
      this.currentSentenceIndex = 0;
      this.notify();
      return;
    }

    const sentence = this.currentSentences[this.currentSentenceIndex];

    if (typeof window !== 'undefined' && window.responsiveVoice) {
      try {
        window.responsiveVoice.speak(sentence, this.currentVoice, {
          rate: this.currentRate,
          pitch: 1.0,
          onstart: () => {
            if (!this.isPaused) {
              this.isSpeaking = true;
              this.notify();
            }
          },
          onend: () => {
            if (!this.isPaused && this.isSpeaking) {
              this.currentSentenceIndex++;
              // Conversational 180ms pause between sentences
              this.playbackTimer = setTimeout(() => {
                this.playNextSentence();
              }, 180);
            }
          },
          onerror: (e) => {
            console.warn('ResponsiveVoice chunk error:', e);
            if (!this.isPaused && this.isSpeaking) {
              this.currentSentenceIndex++;
              this.playNextSentence();
            }
          },
        });
      } catch (err) {
        console.error('Error invoking responsiveVoice.speak:', err);
        this.fallbackSpeakSentence(sentence);
      }
    } else {
      this.fallbackSpeakSentence(sentence);
    }
  }

  private fallbackSpeakSentence(sentence: string) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = 'vi-VN';
        utterance.rate = this.currentRate;
        utterance.onstart = () => {
          if (!this.isPaused) {
            this.isSpeaking = true;
            this.notify();
          }
        };
        utterance.onend = () => {
          if (!this.isPaused && this.isSpeaking) {
            this.currentSentenceIndex++;
            this.playbackTimer = setTimeout(() => {
              this.playNextSentence();
            }, 180);
          }
        };
        utterance.onerror = () => {
          if (!this.isPaused && this.isSpeaking) {
            this.currentSentenceIndex++;
            this.playNextSentence();
          }
        };
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error('Fallback speech failed:', e);
      }
    }
  }

  /**
   * Silences all audio output immediately across all engines
   */
  private silenceAudio() {
    if (typeof window !== 'undefined') {
      try {
        if (window.responsiveVoice) {
          window.responsiveVoice.cancel();
        }
      } catch (e) {
        console.warn('Error cancelling ResponsiveVoice:', e);
      }

      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {
        console.warn('Error cancelling SpeechSynthesis:', e);
      }

      // Stop any orphan HTMLAudioElements if ResponsiveVoice generated them
      try {
        const audios = document.querySelectorAll('audio');
        audios.forEach((a) => {
          if (!a.paused) {
            a.pause();
            a.currentTime = 0;
          }
        });
      } catch {
        // ignore DOM audio cleanup error
      }
    }
  }

  /**
   * Tạm dừng đọc: Lập tức ngắt tiếng và lưu vị trí câu đang đọc
   */
  public pause() {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }

    this.silenceAudio();
    this.isPaused = true;
    this.isSpeaking = true;
    this.notify();
  }

  /**
   * Tiếp tục đọc: Đọc tiếp các câu còn lại từ vị trí đã dừng
   */
  public resume() {
    if (!this.isSpeaking) return;

    this.isPaused = false;
    this.notify();
    this.playNextSentence();
  }

  /**
   * Dừng đọc hoàn toàn
   */
  public stop() {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }

    this.silenceAudio();
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentSentences = [];
    this.currentSentenceIndex = 0;
    this.notify();
  }

  public togglePlayPause(text: string, rate = 0.9) {
    if (this.isSpeaking) {
      if (this.isPaused) {
        this.resume();
      } else {
        this.pause();
      }
    } else {
      this.speak(text, rate);
    }
  }

  public getStatus() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      voiceName: this.selectedVoiceName === 'Vietnamese Male' ? 'Giọng Nam Tiếng Việt (ResponsiveVoice)' : 'Giọng Nữ Tiếng Việt (ResponsiveVoice)',
      isResponsiveVoiceReady: typeof window !== 'undefined' && !!window.responsiveVoice,
    };
  }

  // Senior-friendly audio chimes for tactile feedback
  public playFeedbackSound(type: 'camera' | 'success' | 'alert' | 'beep') {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'camera') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(330, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  }
}

export const speechService = new SpeechService();

