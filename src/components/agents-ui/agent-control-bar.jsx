import { useEffect, useRef, useState } from 'react';
import { Track } from 'livekit-client';
import { Loader, MessageSquareTextIcon, SendHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { useChat } from '@livekit/components-react';
import { AgentDisconnectButton } from './agent-disconnect-button';
import { AgentTrackControl } from './agent-track-control';
import { AgentTrackToggle, agentTrackToggleVariants } from './agent-track-toggle';
import { Button } from '../ui/button';
import { Toggle } from '../ui/toggle';
import { useInputControls, usePublishPermissions } from '../../hooks/agents-ui/use-agent-control-bar';
import { cn } from '../../lib/utils';

const LK_TOGGLE_VARIANT_1 = [
  'data-[state=off]:bg-accent data-[state=off]:hover:bg-foreground/10',
  'data-[state=off]:[&_~_button]:bg-accent data-[state=off]:[&_~_button]:hover:bg-foreground/10',
  'data-[state=off]:border-border data-[state=off]:hover:border-foreground/12',
  'data-[state=off]:[&_~_button]:border-border data-[state=off]:[&_~_button]:hover:border-foreground/12',
  'data-[state=off]:text-destructive data-[state=off]:hover:text-destructive data-[state=off]:focus:text-destructive',
  'data-[state=off]:focus-visible:ring-foreground/12 data-[state=off]:focus-visible:border-ring',
  'dark:data-[state=off]:[&_~_button]:bg-accent dark:data-[state=off]:[&_~_button]:hover:bg-foreground/10',
];

const LK_TOGGLE_VARIANT_2 = [
  'data-[state=off]:bg-accent data-[state=off]:hover:bg-foreground/10',
  'data-[state=off]:border-border data-[state=off]:hover:border-foreground/12',
  'data-[state=off]:focus-visible:border-ring data-[state=off]:focus-visible:ring-foreground/12',
  'data-[state=off]:text-foreground data-[state=off]:hover:text-foreground data-[state=off]:focus:text-foreground',
  'data-[state=on]:bg-blue-500/20 data-[state=on]:hover:bg-blue-500/30',
  'data-[state=on]:border-blue-700/10 data-[state=on]:text-blue-700 data-[state=on]:ring-blue-700/30',
  'data-[state=on]:focus-visible:border-blue-700/50',
  'dark:data-[state=on]:bg-blue-500/20 dark:data-[state=on]:text-blue-300',
];

const MOTION_PROPS = {
  variants: { hidden: { height: 0, opacity: 0, marginBottom: 0 }, visible: { height: 'auto', opacity: 1, marginBottom: 12 } },
  initial: 'hidden',
  transition: { duration: 0.3, ease: 'easeOut' },
};

function AgentChatInput({ chatOpen, onSend = async () => {}, className }) {
  const inputRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const isDisabled = isSending || message.trim().length === 0;

  const handleSend = async () => {
    if (isDisabled) return;
    try {
      setIsSending(true);
      await onSend(message.trim());
      setMessage('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (!chatOpen) return;
    inputRef.current?.focus();
  }, [chatOpen]);

  return (
    <div className={cn('mb-3 flex w-full items-end gap-2', className)}>
      <div className="flex flex-1 items-end rounded-xl border border-input/50 bg-accent/30 px-3 transition-colors focus-within:border-ring focus-within:bg-background has-[textarea:disabled]:opacity-50">
        <textarea
          autoFocus
          ref={inputRef}
          value={message}
          disabled={!chatOpen || isSending}
          placeholder="Ask a question..."
          onKeyDown={handleKeyDown}
          onChange={(e) => setMessage(e.target.value)}
          className="field-sizing-content max-h-20 min-h-[38px] flex-1 resize-none bg-transparent py-2.5 text-sm leading-5 outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed"
        />
        <Button size="icon" type="button" disabled={isDisabled}
          variant={isDisabled ? 'secondary' : 'default'}
          title={isSending ? 'Sending...' : 'Send'}
          onClick={handleSend}
          className="mb-1 ml-1 size-8 shrink-0 self-end disabled:cursor-not-allowed [&_svg]:size-4"
        >
          {isSending ? <Loader className="animate-spin" /> : <SendHorizontal />}
        </Button>
      </div>
    </div>
  );
}

export function AgentControlBar({
  variant = 'default', controls, isChatOpen = false, isConnected = false, saveUserChoices = true,
  onDisconnect, onDeviceError, onIsChatOpenChange, className, ...props
}) {
  const { send } = useChat();
  const publishPermissions = usePublishPermissions();
  const [isChatOpenUncontrolled, setIsChatOpenUncontrolled] = useState(isChatOpen);
  const {
    microphoneTrack, cameraToggle, microphoneToggle, screenShareToggle,
    handleAudioDeviceChange, handleVideoDeviceChange,
    handleMicrophoneDeviceSelectError, handleCameraDeviceSelectError,
  } = useInputControls({ onDeviceError, saveUserChoices });

  const handleSendMessage = async (message) => { await send(message); };

  const visibleControls = {
    leave: controls?.leave ?? true,
    microphone: controls?.microphone ?? publishPermissions.microphone,
    screenShare: controls?.screenShare ?? publishPermissions.screenShare,
    camera: controls?.camera ?? publishPermissions.camera,
    chat: controls?.chat ?? publishPermissions.data,
  };

  const isEmpty = Object.values(visibleControls).every((value) => !value);
  if (isEmpty) {
    console.warn('AgentControlBar: `visibleControls` contains only false values.');
    return null;
  }

  return (
    <div aria-label="Voice assistant controls"
      className={cn('bg-background border-input/50 dark:border-muted flex flex-col border p-3 drop-shadow-md/3',
        variant === 'livekit' ? 'rounded-[31px]' : 'rounded-lg', className)} {...props}
    >
      <motion.div {...MOTION_PROPS}
        inert={(!(isChatOpen || isChatOpenUncontrolled)).toString()}
        animate={isChatOpen || isChatOpenUncontrolled ? 'visible' : 'hidden'}
        className="border-input/50 flex w-full items-start overflow-hidden border-b"
      >
        <AgentChatInput chatOpen={isChatOpen || isChatOpenUncontrolled} onSend={handleSendMessage}
          className={cn(variant === 'livekit' && '[&_button]:rounded-full')} />
      </motion.div>

      <div className="flex gap-1">
        <div className="flex grow gap-1">
          {visibleControls.microphone && (
            <AgentTrackControl variant={variant === 'outline' ? 'outline' : 'default'} kind="audioinput"
              aria-label="Toggle microphone" source={Track.Source.Microphone}
              pressed={microphoneToggle.enabled} disabled={microphoneToggle.pending}
              audioTrack={microphoneTrack}
              onPressedChange={microphoneToggle.toggle}
              onActiveDeviceChange={handleAudioDeviceChange}
              onMediaDeviceError={handleMicrophoneDeviceSelectError}
              className={cn(variant === 'livekit' && [LK_TOGGLE_VARIANT_1,
                'rounded-full [&_button:first-child]:rounded-l-full [&_button:last-child]:rounded-r-full'])}
            />
          )}

          {visibleControls.camera && (
            <AgentTrackControl variant={variant === 'outline' ? 'outline' : 'default'} kind="videoinput"
              aria-label="Toggle camera" source={Track.Source.Camera}
              pressed={cameraToggle.enabled} pending={cameraToggle.pending} disabled={cameraToggle.pending}
              onPressedChange={cameraToggle.toggle}
              onMediaDeviceError={handleCameraDeviceSelectError}
              onActiveDeviceChange={handleVideoDeviceChange}
              className={cn(variant === 'livekit' && [LK_TOGGLE_VARIANT_1,
                'rounded-full [&_button:first-child]:rounded-l-full [&_button:last-child]:rounded-r-full'])}
            />
          )}

          {visibleControls.screenShare && (
            <AgentTrackToggle variant={variant === 'outline' ? 'outline' : 'default'}
              aria-label="Toggle screen share" source={Track.Source.ScreenShare}
              pressed={screenShareToggle.enabled} disabled={screenShareToggle.pending}
              onPressedChange={screenShareToggle.toggle}
              className={cn(variant === 'livekit' && [LK_TOGGLE_VARIANT_2, 'rounded-full'])}
            />
          )}

          {visibleControls.chat && (
            <Toggle variant={variant === 'outline' ? 'outline' : 'default'}
              pressed={isChatOpen || isChatOpenUncontrolled}
              aria-label="Toggle transcript"
              onPressedChange={(state) => {
                if (!onIsChatOpenChange) setIsChatOpenUncontrolled(state);
                else onIsChatOpenChange(state);
              }}
              className={agentTrackToggleVariants({
                variant: variant === 'outline' ? 'outline' : 'default',
                className: cn(variant === 'livekit' && [LK_TOGGLE_VARIANT_2, 'rounded-full']),
              })}
            >
              <MessageSquareTextIcon />
            </Toggle>
          )}
        </div>

        {visibleControls.leave && (
          <AgentDisconnectButton onClick={onDisconnect} disabled={!isConnected}
            className={cn(variant === 'livekit' &&
              'bg-destructive/10 dark:bg-destructive/10 text-destructive hover:bg-destructive/20 dark:hover:bg-destructive/20 focus:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/4 rounded-full font-mono text-xs font-bold tracking-wider'
            )}
          >
            <span className="hidden md:inline">END CALL</span>
            <span className="inline md:hidden">END</span>
          </AgentDisconnectButton>
        )}
      </div>
    </div>
  );
}
