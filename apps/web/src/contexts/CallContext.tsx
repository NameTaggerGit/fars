import React, { createContext, useContext } from 'react';
import { useCall, type CallState } from '../hooks/useCall';

interface CallContextType {
  callState: CallState;
  startCall: (recipientId: string, callType: 'audio' | 'video') => Promise<void>;
  acceptCall: () => Promise<void>;
  endCall: () => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  rejectCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const call = useCall();

  return (
    <CallContext.Provider value={call}>
      {children}
    </CallContext.Provider>
  );
}

export function useCallContext() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCallContext must be used within CallProvider');
  }
  return context;
}
