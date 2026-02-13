import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface VoiceMessageProps {
  url: string;
  isOwn: boolean;
}

export function VoiceMessage({ url, isOwn }: VoiceMessageProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !url) return;

    // Reset state when URL changes
    setError(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const updateCurrentTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: any) => {
      console.error('Audio error:', {
        error: e,
        networkState: audio.networkState,
        readyState: audio.readyState,
        src: audio.src,
      });
      setError(true);
      setIsPlaying(false);
    };

    const handleLoadStart = () => {
      console.log('Audio loading started:', url);
    };

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded');
      updateDuration();
    };

    // Set up audio element (no crossOrigin to avoid CORS preflight; backend CORS allows origin)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', updateCurrentTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);

    // Set src and load
    audio.src = url;
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', updateCurrentTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [url]);

  const handlePlayPause = async () => {
    if (!audioRef.current || error) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Ensure audio is loaded before playing
        if (audioRef.current.readyState < 2) {
          await new Promise((resolve) => {
            audioRef.current!.addEventListener('canplay', resolve, { once: true });
          });
        }
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
        }
      }
    } catch (err) {
      setError(true);
      setIsPlaying(false);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || error || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    audioRef.current.currentTime = percentage * duration;
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-2xl ${
          isOwn
            ? 'bg-white/20 backdrop-blur-sm'
            : 'bg-slate-200/70 dark:bg-slate-600/50 backdrop-blur-sm'
        }`}
      >
        <div className="text-sm text-red-500">⚠️ Ошибка загрузки</div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl ${
        isOwn
          ? 'bg-white/20 backdrop-blur-sm'
          : 'bg-slate-200/70 dark:bg-slate-600/50 backdrop-blur-sm'
      }`}
    >
      {/* Audio element - hidden but loaded */}
      <audio
        ref={audioRef}
        preload="metadata"
        src={url}
      />

      {/* Play/Pause Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={handlePlayPause}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
          isOwn
            ? 'bg-white/30 hover:bg-white/40 text-white'
            : 'bg-white/50 hover:bg-white/60 dark:bg-slate-700/70 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white'
        }`}
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: isPlaying ? 1 : 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {isPlaying ? '⏸' : '▶'}
        </motion.div>
      </motion.button>

      {/* Waveform & Progress */}
      <div className="flex-1 flex flex-col gap-1.5">
        {/* Waveform visualization */}
        <div className="flex items-center gap-1 h-6">
          {[...Array(20)].map((_, i) => {
            const randomHeight = Math.sin((i + (isPlaying ? currentTime * 10 : 0)) / 3) * 0.5 + 0.5;
            return (
              <motion.div
                key={i}
                className={`w-0.5 rounded-full transition-all ${
                  progress > (i / 20) * 100
                    ? isOwn
                      ? 'bg-white'
                      : 'bg-slate-700 dark:bg-white'
                    : isOwn
                      ? 'bg-white/40'
                      : 'bg-slate-400 dark:bg-slate-400/60'
                }`}
                animate={{
                  height: isPlaying ? `${12 + randomHeight * 8}px` : '12px',
                }}
                transition={{
                  duration: 0.1,
                  ease: 'easeInOut',
                }}
              />
            );
          })}
        </div>

        {/* Progress bar */}
        <div
          onClick={handleProgressClick}
          className={`w-full h-1 rounded-full cursor-pointer ${
            isOwn
              ? 'bg-white/25 hover:bg-white/35'
              : 'bg-slate-400/40 dark:bg-slate-500/40 hover:bg-slate-400/50 dark:hover:bg-slate-500/50'
          }`}
        >
          <motion.div
            className={`h-full rounded-full ${
              isOwn ? 'bg-white' : 'bg-slate-700 dark:bg-white'
            }`}
            animate={{
              width: `${progress}%`,
            }}
            transition={{
              duration: 0.1,
              ease: 'linear',
            }}
          />
        </div>

        {/* Time display */}
        <div className={`text-xs font-medium ${isOwn ? 'text-white/70' : 'text-slate-600 dark:text-slate-300'}`}>
          <span>{formatTime(currentTime)}</span>
          <span className="mx-1">/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
