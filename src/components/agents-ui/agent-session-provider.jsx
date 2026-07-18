import { SessionProvider, RoomAudioRenderer } from '@livekit/components-react';

export function AgentSessionProvider({ session, children }) {
  return (
    <SessionProvider session={session}>
      {children}
      <RoomAudioRenderer />
    </SessionProvider>
  );
}
