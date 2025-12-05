"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface AudioMessage {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  createdAt: Date;
}

interface AudioRecorderProps {
  onAudioRecorded: (audio: AudioMessage) => void;
  onAudioRemove?: () => void;
  currentAudio?: AudioMessage | null;
  maxDuration?: number; // in seconds
  translations?: {
    title?: string;
    subtitle?: string;
    record?: string;
    recording?: string;
    stop?: string;
    play?: string;
    pause?: string;
    delete?: string;
    timeRemaining?: string;
    recordingTip?: string;
    playbackTip?: string;
  };
}

// Waveform visualization component
function WaveformVisualizer({ 
  isRecording, 
  isPlaying,
}: { 
  isRecording: boolean; 
  isPlaying: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (isRecording || isPlaying) {
        // Animated wave when recording or playing
        const bars = 40;
        const barWidth = width / bars - 2;
        
        for (let i = 0; i < bars; i++) {
          const time = Date.now() / 100;
          const amplitude = Math.sin(time + i * 0.3) * 0.5 + 0.5;
          const barHeight = (amplitude * height * 0.8) + height * 0.1;
          
          const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
          gradient.addColorStop(0, isRecording ? "#ef4444" : "#ec4899");
          gradient.addColorStop(1, isRecording ? "#f87171" : "#f9a8d4");
          
          ctx.fillStyle = gradient;
          ctx.fillRect(
            i * (barWidth + 2) + 1,
            height - barHeight,
            barWidth,
            barHeight
          );
        }
      } else {
        // Static wave when idle
        const bars = 40;
        const barWidth = width / bars - 2;
        
        for (let i = 0; i < bars; i++) {
          const barHeight = Math.random() * height * 0.3 + height * 0.1;
          
          ctx.fillStyle = "#e5e7eb";
          ctx.fillRect(
            i * (barWidth + 2) + 1,
            height - barHeight,
            barWidth,
            barHeight
          );
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className="w-full h-[60px] rounded-lg"
    />
  );
}

// Format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function AudioRecorder({
  onAudioRecorded,
  onAudioRemove,
  currentAudio,
  maxDuration = 60, // 1 minute default
  translations = {},
}: AudioRecorderProps) {
  const {
    title = "Mensagem de Voz",
    subtitle = "Grave uma mensagem pessoal e única",
    recording = "Gravando...",
    delete: deleteText = "Excluir",
    recordingTip = "Clique no microfone para começar a gravar",
    playbackTip = "Sua mensagem de voz está pronta!",
  } = translations;

  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check for microphone permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const permission = await navigator.permissions.query({ name: "microphone" as PermissionName });
        setHasPermission(permission.state === "granted");
        
        permission.addEventListener("change", () => {
          setHasPermission(permission.state === "granted");
        });
      } catch {
        // Fallback for browsers that don't support permissions API
        setHasPermission(null);
      }
    };
    
    checkPermission();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") 
          ? "audio/webm" 
          : "audio/mp4",
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio: AudioMessage = {
          id: `audio-${Date.now()}`,
          blob: audioBlob,
          url: audioUrl,
          duration: recordingTime,
          createdAt: new Date(),
        };
        
        onAudioRecorded(audio);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setHasPermission(false);
      setError("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const playAudio = () => {
    if (!currentAudio) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(currentAudio.url);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      };
      audioRef.current.ontimeupdate = () => {
        setPlaybackTime(audioRef.current?.currentTime || 0);
      };
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const removeAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackTime(0);
    onAudioRemove?.();
  };

  // Auto-stop at max duration
  useEffect(() => {
    if (recordingTime >= maxDuration && isRecording) {
      stopRecording();
    }
  }, [recordingTime, maxDuration, isRecording, stopRecording]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white text-xl shadow-lg">
          🎙️
        </div>
        <div>
          <h3 className="font-bold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Permission denied message */}
      {hasPermission === false && !error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-medium">Permissão necessária</p>
              <p className="mt-1">Para gravar áudio, permita o acesso ao microfone nas configurações do navegador.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="bg-gradient-to-br from-gray-50 to-pink-50/50 rounded-2xl p-6 border border-gray-100">
        {!currentAudio ? (
          // Recording interface
          <div className="space-y-4">
            {/* Waveform visualization */}
            <WaveformVisualizer isRecording={isRecording} isPlaying={false} />
            
            {/* Timer */}
            <div className="text-center">
              <span className={`text-3xl font-mono font-bold ${isRecording ? "text-red-500" : "text-gray-400"}`}>
                {formatTime(recordingTime)}
              </span>
              <span className="text-gray-400 text-sm ml-2">
                / {formatTime(maxDuration)}
              </span>
            </div>

            {/* Progress bar */}
            {isRecording && (
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-red-500 to-pink-500 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
                />
              </div>
            )}

            {/* Record button */}
            <div className="flex justify-center">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`relative group transition-all duration-300 ${
                  isRecording 
                    ? "scale-110" 
                    : "hover:scale-105"
                }`}
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/50"
                    : "bg-gradient-to-br from-pink-500 to-red-500 shadow-lg hover:shadow-xl"
                }`}>
                  {isRecording ? (
                    <div className="w-6 h-6 bg-white rounded-sm" />
                  ) : (
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                  )}
                </div>
                
                {/* Pulse rings when recording */}
                {isRecording && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-30" />
                    <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-20 animation-delay-200" />
                  </>
                )}
              </button>
            </div>

            {/* Helper text */}
            <p className="text-center text-sm text-gray-500">
              {isRecording ? (
                <span className="text-red-500 font-medium flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  {recording} - Clique para parar
                </span>
              ) : (
                recordingTip
              )}
            </p>
          </div>
        ) : (
          // Playback interface
          <div className="space-y-4">
            {/* Waveform visualization */}
            <WaveformVisualizer isRecording={false} isPlaying={isPlaying} />

            {/* Playback timer */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-gray-500">
                {formatTime(playbackTime)}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full transition-all duration-100"
                  style={{ width: `${currentAudio.duration > 0 ? (playbackTime / currentAudio.duration) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm font-mono text-gray-500">
                {formatTime(currentAudio.duration)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={playAudio}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
              
              <button
                onClick={removeAudio}
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all"
                title={deleteText}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Success message */}
            <p className="text-center text-sm text-green-600 font-medium flex items-center justify-center gap-2">
              <span>✓</span>
              {playbackTip}
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-full text-xs font-medium">
          💡 Máximo {maxDuration} segundos
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">
          🎧 Use fones para melhor qualidade
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
          🤫 Ambiente silencioso recomendado
        </span>
      </div>
    </div>
  );
}

// Mini audio player for preview
export function MiniAudioPlayer({ 
  audio, 
  onRemove 
}: { 
  audio: AudioMessage; 
  onRemove?: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audio.url);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 rounded-full text-sm font-medium">
      <button
        onClick={togglePlay}
        className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 transition-colors"
      >
        {isPlaying ? (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        ) : (
          <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
      <span>🎙️ Mensagem de voz</span>
      <span className="text-xs text-pink-500">{formatTime(audio.duration)}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="w-5 h-5 rounded-full bg-pink-200 text-pink-600 flex items-center justify-center hover:bg-red-200 hover:text-red-600 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default AudioRecorder;
