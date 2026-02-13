import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallContext } from '../contexts/CallContext';

export function CallModal() {
  const { callState, acceptCall, endCall, toggleMic, toggleCamera, rejectCall } = useCallContext();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // Setup local video stream
  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream]);

  // Setup remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState.remoteStream]);

  // Track call duration
  useEffect(() => {
    if (!callState.isActive || callState.isIncoming) return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState.isActive, callState.isIncoming]);

  // Detect speech with audio analyser
  useEffect(() => {
    if (!callState.remoteStream) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      const audioSource = audioContext.createMediaStreamSource(callState.remoteStream);
      audioSource.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkSpeech = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setIsSpeaking(average > 30);
        requestAnimationFrame(checkSpeech);
      };

      checkSpeech();
      analyserRef.current = analyser;
    } catch (error) {
      console.error('Failed to setup speech detection:', error);
    }

    return () => {
      analyserRef.current = null;
    };
  }, [callState.remoteStream]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await acceptCall();
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <AnimatePresence>
      {(callState.isActive || callState.isIncoming) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl shadow-2xl overflow-hidden border border-slate-700/50"
          >
            {/* Video Section */}
            {callState.callType === 'video' ? (
              <div className="relative w-full aspect-video bg-black">
                {/* Remote video */}
                {callState.remoteStream && (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {/* Local video (PIP) */}
                {callState.localStream && (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute bottom-4 right-4 w-32 h-24 object-cover rounded-2xl border-2 border-white/20 bg-black"
                  />
                )}

                {/* Call info overlay */}
                {callState.isActive && !callState.isIncoming && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-6">
                    <div className="text-center">
                      <p className="text-white/80 text-sm">Текущий звонок</p>
                      <p className="text-white text-2xl font-bold mt-2">
                        {formatDuration(callDuration)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Audio call UI */
              <div className="w-full bg-gradient-to-b from-slate-800 to-slate-900 p-8">
                <div className="text-center">
                  {/* Avatar with speech animation */}
                  <motion.div
                    animate={isSpeaking ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="mb-6 flex justify-center"
                  >
                    <div className={`relative w-32 h-32 rounded-full overflow-hidden border-4 ${
                      isSpeaking ? 'border-green-500 shadow-lg shadow-green-500/50' : 'border-slate-600'
                    } transition-all`}>
                      {callState.callerAvatar ? (
                        <img
                          src={callState.callerAvatar}
                          alt={callState.callerName || 'Caller'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl">
                          👤
                        </div>
                      )}
                      {isSpeaking && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.5 }}
                          className="absolute inset-0 border-2 border-green-500 rounded-full"
                        />
                      )}
                    </div>
                  </motion.div>

                  <h2 className="text-white text-2xl font-bold mb-2">
                    {callState.callerName || 'Неизвестный'}
                  </h2>
                  <p className="text-white/60 mb-6">
                    {callState.isIncoming ? 'Входящий звонок' : formatDuration(callDuration)}
                  </p>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="bg-slate-900/50 border-t border-slate-700/50 p-6">
              {callState.isIncoming ? (
                <div className="flex gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => rejectCall()}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all"
                    title="Отклонить"
                  >
                    ✕
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAccept}
                    disabled={isAccepting}
                    className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg transition-all disabled:opacity-50"
                    title="Принять"
                  >
                    {isAccepting ? '⟳' : '✓'}
                  </motion.button>
                </div>
              ) : (
                <div className="flex gap-3 justify-center">
                  {callState.callType === 'video' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleCamera()}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                          callState.isCameraEnabled
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        } shadow-lg`}
                        title={callState.isCameraEnabled ? 'Выключить камеру' : 'Включить камеру'}
                      >
                        {callState.isCameraEnabled ? '📹' : '📷'}
                      </motion.button>
                    </>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleMic()}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      callState.isMicEnabled
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    } shadow-lg`}
                    title={callState.isMicEnabled ? 'Отключить микрофон' : 'Включить микрофон'}
                  >
                    {callState.isMicEnabled ? '🎤' : '🔇'}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => endCall()}
                    className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all"
                    title="Завершить звонок"
                  >
                    📞
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
