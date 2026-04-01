'use client';

import { useEffect, useRef } from 'react';
import { HiOutlineMicrophone } from 'react-icons/hi2';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CONFIG = {
  sm: {
    button: 'w-8 h-8',
    icon: 'text-sm',
    ring: 'w-8 h-8',
    container: 'gap-1.5',
    text: 'text-[10px]',
    stopBtn: 'w-5 h-5',
    stopInner: 'w-2 h-2',
  },
  md: {
    button: 'w-10 h-10',
    icon: 'text-lg',
    ring: 'w-10 h-10',
    container: 'gap-2',
    text: 'text-xs',
    stopBtn: 'w-6 h-6',
    stopInner: 'w-2.5 h-2.5',
  },
  lg: {
    button: 'w-16 h-16',
    icon: 'text-2xl',
    ring: 'w-16 h-16',
    container: 'gap-3',
    text: 'text-sm',
    stopBtn: 'w-10 h-10',
    stopInner: 'w-4 h-4',
  },
};

export default function VoiceButton({ onTranscript, className = '', size = 'sm' }: VoiceButtonProps) {
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript, error } = useVoiceInput();
  const lastTranscriptRef = useRef('');
  const cfg = SIZE_CONFIG[size];

  // When listening stops and we have a transcript, send it
  useEffect(() => {
    if (!isListening && transcript && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;
      onTranscript(transcript);
      resetTranscript();
    }
  }, [isListening, transcript, onTranscript, resetTranscript]);

  // Don't render if not supported
  if (!isSupported) return null;

  const handleStop = () => {
    stopListening();
  };

  const handleStart = () => {
    lastTranscriptRef.current = '';
    resetTranscript();
    startListening();
  };

  if (isListening) {
    return (
      <div className={`inline-flex items-center ${cfg.container} ${className}`}>
        {/* Pulsing ring + stop button */}
        <div className="relative flex items-center justify-center">
          {/* Pulse ring */}
          <span
            className={`absolute ${cfg.ring} rounded-full bg-red-400 opacity-75`}
            style={{
              animation: 'voice-pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          {/* Stop button */}
          <button
            onClick={handleStop}
            className={`relative ${cfg.button} rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors z-10`}
            title="Stop recording"
          >
            <span className={`${cfg.stopInner} bg-white rounded-sm`} />
          </button>
        </div>
        <span className={`${cfg.text} text-red-600 font-medium`}>Listening...</span>

        {/* Inline keyframe style */}
        <style jsx>{`
          @keyframes voice-pulse-ring {
            0% {
              transform: scale(0.8);
              opacity: 1;
            }
            100% {
              transform: scale(1.4);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${cfg.container} ${className}`}>
      <button
        onClick={handleStart}
        className={`${cfg.button} rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors`}
        title="Start voice input"
      >
        <HiOutlineMicrophone className={cfg.icon} />
      </button>
      {error && (
        <span className={`${cfg.text} text-red-500 max-w-[200px] truncate`} title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
