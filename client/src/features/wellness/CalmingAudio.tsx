import React, { useState, useEffect, useRef } from 'react';
import { CALMING_AUDIO_TRACKS, AudioTrack, recordWellnessCompletion } from './wellnessData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CalmingAudio: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTrack, setActiveTrack] = useState<AudioTrack>(CALMING_AUDIO_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const totalDurationSeconds = 300; // 5 minutes

  // Web Audio Synthesizer refs for zero-dependency realistic ambient sound
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const noiseSourceRef = useRef<AudioNode | null>(null);
  const oscillatorIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Stop current audio engine
  const stopAudio = () => {
    if (noiseSourceRef.current) {
      try {
        (noiseSourceRef.current as any).stop?.();
        noiseSourceRef.current.disconnect();
      } catch {}
      noiseSourceRef.current = null;
    }

    if (oscillatorIntervalRef.current) {
      clearInterval(oscillatorIntervalRef.current);
      oscillatorIntervalRef.current = null;
    }

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.suspend();
      } catch {}
    }
  };

  // Start synthesized ambient audio based on category
  const startAudio = (track: AudioTrack) => {
    stopAudio();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // 1. Rain or Ocean Waves: Filtered Noise Generator
      if (track.id === 'rain' || track.id === 'waves' || track.id === 'forest') {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        // Generate Pink-ish Noise for relaxing sound
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.12;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        if (track.id === 'rain') {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, ctx.currentTime);
        } else if (track.id === 'waves') {
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(450, ctx.currentTime);
          // Modulate wave swell
          const swell = ctx.createOscillator();
          const swellGain = ctx.createGain();
          swell.frequency.setValueAtTime(0.12, ctx.currentTime); // 8 second tide cycle
          swellGain.gain.setValueAtTime(200, ctx.currentTime);
          swell.connect(swellGain);
          swellGain.connect(filter.frequency);
          swell.start();
        } else {
          // Forest breeze
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(600, ctx.currentTime);
        }

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();
        noiseSourceRef.current = whiteNoise;
      } else if (track.id === 'piano') {
        // 2. Gentle Meditative Ambient Chords (Pentatonic harmony)
        const notes = [261.63, 329.63, 392.0, 523.25]; // C, E, G, C
        const playTone = () => {
          if (!audioCtxRef.current || audioCtxRef.current.state !== 'running') return;
          const osc = audioCtxRef.current.createOscillator();
          const noteGain = audioCtxRef.current.createGain();
          const freq = notes[Math.floor(Math.random() * notes.length)];

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);

          noteGain.gain.setValueAtTime(0.01, audioCtxRef.current.currentTime);
          noteGain.gain.exponentialRampToValueAtTime(0.15 * volume, audioCtxRef.current.currentTime + 1.2);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 4.5);

          osc.connect(noteGain);
          noteGain.connect(masterGain);
          osc.start();
          osc.stop(audioCtxRef.current.currentTime + 5);
        };

        playTone();
        oscillatorIntervalRef.current = setInterval(playTone, 3200);
      }
    } catch (err) {
      console.warn('[CalmingAudio] Web Audio engine note:', err);
    }
  };

  // Synchronize master gain with volume slider
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume * 0.4, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Elapsed Session Timer
  useEffect(() => {
    if (isPlaying) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          if (prev >= totalDurationSeconds) {
            setIsPlaying(false);
            stopAudio();
            recordWellnessCompletion('audio', 5);
            return totalDurationSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPlaying]);

  // Handle Play / Pause toggle
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopAudio();
    } else {
      setIsPlaying(true);
      startAudio(activeTrack);
    }
  };

  // Change Track Category
  const handleSelectTrack = (track: AudioTrack) => {
    setActiveTrack(track);
    if (isPlaying) {
      startAudio(track);
    }
  };

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setElapsedSeconds(0);
      setIsPlaying(false);
    } else {
      stopAudio();
      setIsPlaying(false);
    }
    return () => {
      stopAudio();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.round((elapsedSeconds / totalDurationSeconds) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-surface-container-lowest border border-surface-variant/70 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between min-h-[540px] overflow-hidden">
        {/* Soft Background Emerald/Teal Tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-surface-container-low/40 pointer-events-none" />

        {/* Top Bar */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
              🎧
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-sm text-on-background">
                Calming Audio
              </span>
              <span className="text-[11px] text-on-surface-variant">
                5-Minute Peaceful Soundscape
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-variant text-on-surface-variant flex items-center justify-center transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Central Audio Player Showcase */}
        <div className="z-10 flex flex-col items-center text-center gap-5 my-auto max-w-md mx-auto w-full">
          {/* Pulsing Visualizer Disc */}
          <div className="relative flex items-center justify-center w-36 h-36">
            <div
              className={`absolute inset-0 rounded-full border-2 border-emerald-500/30 transition-all duration-700 ${
                isPlaying
                  ? 'scale-115 shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-pulse'
                  : 'scale-100 opacity-40'
              }`}
            />
            <div className="w-28 h-28 rounded-full bg-surface-container-high/90 border border-outline-variant/40 flex items-center justify-center text-5xl shadow-md">
              <span>{activeTrack.emoji}</span>
            </div>
          </div>

          {/* Current Track Info */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {activeTrack.category}
            </span>
            <h3 className="font-headline font-bold text-2xl text-on-background tracking-tight">
              {activeTrack.name}
            </h3>
            <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed mt-0.5">
              {activeTrack.description}
            </p>
          </div>

          {/* Progress Bar & Timers */}
          <div className="w-full max-w-sm flex flex-col gap-1.5 mt-2">
            <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-on-surface-variant font-medium">
              <span>{formatTime(elapsedSeconds)}</span>
              <span>{formatTime(totalDurationSeconds)}</span>
            </div>
          </div>

          {/* Volume Slider */}
          <div className="w-full max-w-xs flex items-center gap-3 px-3 py-1.5 rounded-full bg-surface-container/60 border border-outline-variant/30">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">
              {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-1.5"
              title="Adjust volume"
            />
            <span className="text-[10px] font-mono text-on-surface-variant w-7">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        {/* Category Track Selector Pills */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-surface-variant/40 z-10">
          {CALMING_AUDIO_TRACKS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectTrack(t)}
              className={`p-2 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTrack.id === t.id
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/30 text-on-surface-variant'
              }`}
            >
              <span>{t.emoji}</span>
              <span className="truncate">{t.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Master Play / Pause Toggle Button */}
        <div className="w-full flex items-center justify-center mt-3 z-10">
          <button
            type="button"
            onClick={togglePlay}
            className="px-8 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-headline font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-lg">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
            <span>{isPlaying ? 'Pause Ambience' : 'Play Soundscape'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
