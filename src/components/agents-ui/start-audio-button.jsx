import { useEnsureRoom, useStartAudio } from '@livekit/components-react';
import { Button } from '../ui/button';

export function StartAudioButton({ size = 'default', variant = 'default', label, room, ...props }) {
  const roomEnsured = useEnsureRoom(room);
  const { mergedProps } = useStartAudio({ room: roomEnsured, props });

  return (
    <Button size={size} variant={variant} {...props} {...mergedProps}>
      {label}
    </Button>
  );
}
