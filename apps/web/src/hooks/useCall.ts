import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from './useSocket';

export interface CallState {
  isActive: boolean;
  isIncoming: boolean;
  callerId: string | null;
  callerName: string | null;
  callerAvatar: string | null;
  callType: 'audio' | 'video' | null;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

export function useCall() {
  const socket = useSocket();
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    isIncoming: false,
    callerId: null,
    callerName: null,
    callerAvatar: null,
    callType: null,
    isMicEnabled: true,
    isCameraEnabled: true,
    localStream: null,
    remoteStream: null,
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescription | null>(null);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('call:ice-candidate', {
          candidate: {
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
          },
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Remote track received:', event.track.kind);
      setCallState((prev) => ({
        ...prev,
        remoteStream: event.streams[0],
      }));
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        endCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [socket]);

  const startCall = useCallback(
    async (recipientId: string, callType: 'audio' | 'video') => {
      try {
        // Get media constraints
        const constraints: MediaStreamConstraints = {
          audio: true,
          video: callType === 'video' ? { width: 1280, height: 720 } : false,
        };

        // Get local media
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;

        setCallState((prev) => ({
          ...prev,
          isActive: true,
          callType,
          localStream: stream,
        }));

        // Create peer connection and add tracks
        const pc = createPeerConnection();
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket?.emit('call:initiate', {
          recipientId,
          callType,
          offer: {
            type: offer.type,
            sdp: offer.sdp,
          },
        });
      } catch (error) {
        console.error('Failed to start call:', error);
        alert('Не удалось начать звонок. Проверьте разрешения на доступ к микрофону и камере.');
      }
    },
    [socket, createPeerConnection]
  );

  const acceptCall = useCallback(async () => {
    try {
      const { callType } = callState;
      if (!callType) return;

      // Get media constraints
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video' ? { width: 1280, height: 720 } : false,
      };

      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      // Ensure peer connection exists with the remote offer
      let pc = peerConnectionRef.current;
      if (!pc) {
        pc = createPeerConnection();
      }

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc!.addTrack(track, stream);
      });

      // Set remote description if we have a pending offer
      if (pendingOfferRef.current) {
        await pc.setRemoteDescription(pendingOfferRef.current);
      }

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Mark call as active for callee
      setCallState((prev) => ({
        ...prev,
        isActive: true,
        isIncoming: false,
        localStream: stream,
      }));

      socket?.emit('call:answer', {
        answer: {
          type: answer.type,
          sdp: answer.sdp,
        },
      });
    } catch (error) {
      console.error('Failed to accept call:', error);
      alert('Не удалось принять звонок.');
    }
  }, [socket, callState, createPeerConnection]);

  const endCall = useCallback(() => {
    // Stop all tracks
    localStreamRef.current?.getTracks().forEach((track) => track.stop());

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Notify other peer
    socket?.emit('call:end');

    // Reset state
    setCallState({
      isActive: false,
      isIncoming: false,
      callerId: null,
      callerName: null,
      callerAvatar: null,
      callType: null,
      isMicEnabled: true,
      isCameraEnabled: true,
      localStream: null,
      remoteStream: null,
    });

    pendingOfferRef.current = null;
  }, [socket]);

  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setCallState((prev) => ({
        ...prev,
        isMicEnabled: !prev.isMicEnabled,
      }));
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setCallState((prev) => ({
        ...prev,
        isCameraEnabled: !prev.isCameraEnabled,
      }));
    }
  }, []);

  const rejectCall = useCallback(() => {
    socket?.emit('call:reject');
    setCallState({
      isActive: false,
      isIncoming: false,
      callerId: null,
      callerName: null,
      callerAvatar: null,
      callType: null,
      isMicEnabled: true,
      isCameraEnabled: true,
      localStream: null,
      remoteStream: null,
    });
    pendingOfferRef.current = null;
  }, [socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) {
      console.log('useCall: Socket not available');
      return;
    }

    console.log('useCall: Setting up socket listeners');

    // Incoming call
    socket.on('call:incoming', (payload: any) => {
      console.log('useCall: Incoming call received', payload);
      // Create peer connection immediately for incoming calls
      createPeerConnection();
      // Parse and store the offer
      const offerDescription = new RTCSessionDescription(payload.offer);
      pendingOfferRef.current = offerDescription;
      
      setCallState((prev) => ({
        ...prev,
        isIncoming: true,
        callerId: payload.callerId,
        callerName: payload.callerName,
        callerAvatar: payload.callerAvatar,
        callType: payload.callType,
      }));
    });

    // Answer received (callee sends answer to caller)
    socket.on('call:answer', async (payload: any) => {
      console.log('Answer received:', payload);
      const pc = peerConnectionRef.current;
      if (pc && payload.answer) {
        try {
          const answerDescription = new RTCSessionDescription(payload.answer);
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(answerDescription);
          }
        } catch (error) {
          console.error('Failed to set remote description:', error);
        }
      }
    });

    // Called (old event, kept for compatibility)
    socket.on('call:answered', async (payload: any) => {
      console.log('Call answered:', payload);
      const pc = peerConnectionRef.current;
      if (pc && payload.answer) {
        try {
          const answerDescription = new RTCSessionDescription(payload.answer);
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(answerDescription);
          }
        } catch (error) {
          console.error('Failed to set remote description:', error);
        }
      }
    });

    // ICE candidate
    socket.on('call:ice-candidate', async (payload: any) => {
      console.log('ICE candidate received:', payload);
      const pc = peerConnectionRef.current;
      if (pc && payload.candidate) {
        try {
          const candidate = new RTCIceCandidate(payload.candidate);
          await pc.addIceCandidate(candidate);
        } catch (error) {
          console.error('Failed to add ICE candidate:', error);
        }
      }
    });

    // Call ended
    socket.on('call:ended', () => {
      console.log('Call ended');
      endCall();
    });

    // Call rejected
    socket.on('call:rejected', () => {
      console.log('Call rejected');
      setCallState((prev) => ({
        ...prev,
        isIncoming: false,
        callerId: null,
        callerName: null,
        callerAvatar: null,
        callType: null,
      }));
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:answered');
      socket.off('call:answer');
      socket.off('call:ice-candidate');
      socket.off('call:ended');
      socket.off('call:rejected');
    };
  }, [socket, endCall, createPeerConnection]);

  return {
    callState,
    startCall,
    acceptCall,
    endCall,
    toggleMic,
    toggleCamera,
    rejectCall,
  };
}
