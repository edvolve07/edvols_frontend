import { memo } from 'react';
import { cn } from '../../lib/utils';

export function Message({ className, from, ...props }) {
  return (
    <div
      className={cn(
        'group flex w-full max-w-[95%] flex-col gap-2',
        from === 'user' ? 'is-user ml-auto justify-end' : 'is-assistant',
        className
      )}
      {...props}
    />
  );
}

export function MessageContent({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'is-user:dark flex w-fit max-w-full min-w-0 flex-col gap-2 overflow-hidden text-sm',
        'group-[.is-user]:bg-secondary group-[.is-user]:text-foreground group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:px-4 group-[.is-user]:py-3',
        'group-[.is-assistant]:text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export const MessageResponse = memo(
  ({ className, children, ...props }) => (
    <div className={cn('size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0', className)} {...props}>
      {children}
    </div>
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
MessageResponse.displayName = 'MessageResponse';
