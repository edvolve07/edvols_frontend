import { useCallback } from 'react';
import { ArrowDownIcon } from 'lucide-react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export function Conversation({ className, ...props }) {
  return (
    <StickToBottom
      className={cn('relative flex-1 overflow-y-hidden', className)}
      initial="smooth"
      resize="smooth"
      role="log"
      {...props}
    />
  );
}

export function ConversationContent({ className, ...props }) {
  return <StickToBottom.Content className={cn('flex flex-col gap-8 p-4', className)} {...props} />;
}

export function ConversationEmptyState({ className, title = 'No messages yet', description = 'Start a conversation to see messages here', icon, children, ...props }) {
  return (
    <div className={cn('flex size-full flex-col items-center justify-center gap-3 p-8 text-center', className)} {...props}>
      {children ?? (
        <>
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <div className="space-y-1">
            <h3 className="text-sm font-medium">{title}</h3>
            {description && <p className="text-muted-foreground text-sm">{description}</p>}
          </div>
        </>
      )}
    </div>
  );
}

export function ConversationScrollButton({ className, ...props }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    !isAtBottom && (
      <Button
        className={cn('absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full', className)}
        onClick={handleScrollToBottom}
        size="icon"
        type="button"
        variant="outline"
        {...props}
      >
        <ArrowDownIcon className="size-4" />
      </Button>
    )
  );
}
