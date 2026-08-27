/**
 * Speech Service chuẩn hóa 100% Tiếng Việt qua Google Translate TTS (tl=vi).
 * Đơn giản, tin cậy, không phụ thuộc Web Speech API trình duyệt.
 */

class SpeechService {
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;
  private isMuted: boolean = false;
  private onStateChangeCallbacks: Set<(state: { isSpeaking: boolean; isPaused: boolean }) => void> = new Set();
  private audioCtx: AudioContext | null = null;

  // Session ID to completely eliminate audio overlap
  private sessionId: number = 0;

  // Queue xử lý phát âm thanh từng câu
  private currentSentences: string[] = [];
  private currentSentenceIndex: number = 0;
  private currentRate: number = 1.0;
  private currentAudio: HTMLAudioElement | null = null;
  private playbackTimer: any = null;

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
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

  private splitIntoSentences(text: string): string[] {
    if (!text) return [];
    let clean = text
      .replace(/\s+/g, ' ')
      .replace(/nhé\s+ạ/gi, 'ạ')
      .replace(/nhé\s+Bác/gi, 'ạ')
      .replace(/Bác\s+nhé/gi, 'ạ')
      .trim();
    const parts = clean.split(/(?<=[.!?:\n])\s+/);
    const result: string[] = [];

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length > 0) {
        if (trimmed.length > 140) {
          const subParts = trimmed.split(/(?<=[,;])\s+/);
          for (const sub of subParts) {
            const subTrimmed = sub.trim();
            if (subTrimmed.length > 0) result.push(subTrimmed);
          }
        } else {
          result.push(trimmed);
        }
      }
    }
    return result.length > 0 ? result : [clean];
  }

  public speak(text: string, rate = 0.85) {
    if (!text || text.trim().length === 0) return;
    if (this.isMuted) return;

    this.stop();

    this.sessionId++;
    const currentSession = this.sessionId;

    this.currentRate = rate || 0.85;
    this.currentSentences = this.splitIntoSentences(text);
    this.currentSentenceIndex = 0;
    this.isSpeaking = true;
    this.isPaused = false;
    this.notify();

    this.playNextSentence(currentSession);
  }

  private playNextSentence(session: number) {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }

    if (this.sessionId !== session || !this.isSpeaking || this.isPaused || this.isMuted) {
      return;
    }

    if (this.currentSentenceIndex >= this.currentSentences.length) {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentSentences = [];
      this.currentSentenceIndex = 0;
      this.notify();
      return;
    }

    const sentence = this.currentSentences[this.currentSentenceIndex];
    const encodedText = encodeURIComponent(sentence);

    // Dùng đường dẫn Google TTS Tiếng Việt chuẩn 100% qua proxy server
    const audioUrl = `/api/tts?text=${encodedText}`;

    try {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
        this.currentAudio = null;
      }

      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      const rate = this.currentRate || 0.85;
      audio.defaultPlaybackRate = rate;
      audio.playbackRate = rate;

      audio.addEventListener('canplay', () => {
        if (this.sessionId === session && this.currentAudio === audio) {
          audio.playbackRate = rate;
        }
      });

      audio.addEventListener('play', () => {
        if (this.sessionId === session && this.currentAudio === audio) {
          audio.playbackRate = rate;
        }
      });

      audio.onended = () => {
        if (this.sessionId === session && this.currentAudio === audio) {
          this.currentAudio = null;
          if (!this.isPaused && this.isSpeaking && !this.isMuted) {
            this.currentSentenceIndex++;
            this.playbackTimer = setTimeout(() => {
              this.playNextSentence(session);
            }, 180);
          }
        }
      };

      audio.onerror = () => {
        // Fallback đường dẫn trực tiếp Google nếu Proxy /api/tts lỗi
        if (this.sessionId === session && this.currentAudio === audio) {
          const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=vi&client=tw-ob`;
          const directAudio = new Audio(directUrl);
          this.currentAudio = directAudio;
          directAudio.playbackRate = rate;

          directAudio.onended = () => {
            if (this.sessionId === session && this.currentAudio === directAudio) {
              this.currentAudio = null;
              if (!this.isPaused && this.isSpeaking && !this.isMuted) {
                this.currentSentenceIndex++;
                this.playbackTimer = setTimeout(() => {
                  this.playNextSentence(session);
                }, 180);
              }
            }
          };

          directAudio.onerror = () => {
            if (this.sessionId === session) {
              this.currentAudio = null;
              if (!this.isPaused && this.isSpeaking && !this.isMuted) {
                this.currentSentenceIndex++;
                this.playNextSentence(session);
              }
            }
          };

          directAudio.play().catch(() => {
            if (this.sessionId === session) {
              this.currentAudio = null;
              if (!this.isPaused && this.isSpeaking && !this.isMuted) {
                this.currentSentenceIndex++;
                this.playNextSentence(session);
              }
            }
          });
        }
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Lỗi autoplay audio:', err);
          if (this.sessionId === session && this.currentAudio === audio) {
            this.currentAudio = null;
            if (!this.isPaused && this.isSpeaking && !this.isMuted) {
              this.currentSentenceIndex++;
              this.playNextSentence(session);
            }
          }
        });
      }
    } catch (err) {
      console.warn('Audio initialization error:', err);
      if (this.sessionId === session) {
        this.currentSentenceIndex++;
        this.playNextSentence(session);
      }
    }
  }

  public pause() {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    this.isPaused = true;
    this.isSpeaking = true;
    this.notify();
  }

  public resume() {
    if (!this.isSpeaking || this.isMuted) return;
    this.isPaused = false;
    this.notify();
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play();
    } else {
      this.playNextSentence(this.sessionId);
    }
  }

  public stop() {
    this.sessionId++; // Invalidate all pending callbacks from prior sessions
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentSentences = [];
    this.currentSentenceIndex = 0;
    this.notify();
  }

  public togglePlayPause(text: string, rate = 0.85) {
    if (this.isMuted) return;
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

  public getState() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      isMuted: this.isMuted,
      voiceName: 'Giọng Đọc Tiếng Việt Chuẩn',
    };
  }

  public playFeedbackSound(type: 'beep' | 'success' | 'alert' | 'shutter' | 'camera' = 'beep') {
    if (this.isMuted) return;
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

      if (type === 'shutter' || type === 'camera') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
        return;
      }

      if (type === 'beep') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
        return;
      }

      if (type === 'success') {
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now);
        osc2.frequency.setValueAtTime(659.25, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.1);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.25);
        return;
      }

      if (type === 'alert') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(330, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
        return;
      }
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  }
}

export const speechService = new SpeechService();
