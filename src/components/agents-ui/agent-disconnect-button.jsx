import { PhoneOffIcon } from 'lucide-react';
import { useRoomContext } from '@livekit/components-react';
import { Button, buttonVariants } from '../ui/button';
import { cn } from '../../lib/utils';

export function AgentDisconnectButton({ icon, size = 'default', variant = 'destructive', children, onClick, ...props }) {
  const room = useRoomContext();
  const handleClick = (event) => {
    onClick?.(event);
    room?.disconnect();
  };

  return (
    <Button size={size} variant={variant} onClick={handleClick} {...props}>
      {icon ?? <PhoneOffIcon />}
      {children ?? <span className={cn(size?.includes('icon') && 'sr-only')}>END CALL</span>}
    </Button>
  );
}
