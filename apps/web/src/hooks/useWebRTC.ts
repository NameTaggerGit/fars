/**
 * Минимальный хук для WebRTC-звонков.
 * Сигналы (offer/answer/ice) передаются через Socket.io.
 * Для полной реализации: использовать simple-peer или native RTCPeerConnection.
 */
import { useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';

export function useWebRTC(socket: Socket | null) {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCall = useCallback(
    async (remoteUserId: string) => {
      if (!socket) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        streamRef.current = stream;
        const peer = new RTCPeerConnection();
        peerRef.current = peer;
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));
        peer.onicecandidate = (e) => {
          if (e.candidate) socket.emit('webrtc_signal', { toUserId: remoteUserId, signal: { candidate: e.candidate } });
        };
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('webrtc_signal', { toUserId: remoteUserId, signal: { type: 'offer', sdp: offer.sdp } });
      } catch (err) {
        console.error('WebRTC startCall', err);
      }
    },
    [socket],
  );

  const endCall = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  return { startCall, endCall };
}
