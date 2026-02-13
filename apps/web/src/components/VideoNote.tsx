import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface VideoNoteProps {
  url: string;
  size?: number;
}

export function VideoNote({ url, size = 128 }: VideoNoteProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const radius = (size / 2) - 4;
  const circumference = 2 * Math.PI * radius;
  const progress = duration > 0 ? (currentTime / duration) : 0;
  const strokeDashoffset = circumference * (1 - progress);

  // Simple synchronous play/pause
  const handlePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(err => {
        console.error('[VideoNote] Play error:', err.message);
      });
    }
  };

  // Seek on ring click
  const handleSeek = (e: React.MouseEvent<SVGElement>) => {
    e.stopPropagation();
    
    const video = videoRef.current;
    if (!video || duration === 0) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    
    const seekPercent = angle / 360;
    video.currentTime = seekPercent * duration;
  };

  return (
    <motion.div
      className="relative inline-block"
      style={{ width: size, height: size }}
      animate={{ scale: isPlaying ? 1.1 : 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Video container - clickable */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden cursor-pointer"
        onClick={handlePlay}
        style={{
          boxShadow: isPlaying
            ? '0 2px 8px rgba(0,0,0,0.2), 0 0 16px rgba(29,155,240,0.4)'
            : '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <video
          ref={videoRef}
          src={url}
          className="w-full h-full object-cover"
          preload="metadata"
          crossOrigin="anonymous"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedMetadata={(e) => {
            const video = e.currentTarget;
            setDuration(video.duration || 0);
          }}
          onTimeUpdate={(e) => {
            setCurrentTime(e.currentTarget.currentTime || 0);
          }}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/10 pointer-events-none" />

        {/* Play button - only when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20" />
            <motion.div
              className="relative z-10 w-2/5 h-2/5 flex items-center justify-center bg-white rounded-full shadow-md"
              whileHover={{ scale: 1.12 }}
            >
              <svg viewBox="0 0 24 24" className="w-1/2 h-1/2 text-blue-500 ml-0.5" fill="currentColor">
                <polygon points="8,5 8,19 19,12" />
              </svg>
            </motion.div>
          </div>
        )}
      </div>

      {/* Progress ring - clickable */}
      <svg
        className="absolute top-0 left-0 w-full h-full"
        viewBox={`0 0 ${size} ${size}`}
        onClick={handleSeek}
        style={{ cursor: 'pointer' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={2.5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: `${size / 2}px ${size / 2}px`,
            transition: 'stroke-dashoffset 0.1s linear',
            filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.3))',
          }}
        />
      </svg>
    </motion.div>
  );
}

export default VideoNote;


