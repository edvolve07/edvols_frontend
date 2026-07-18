import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAgent, useSessionContext, useSessionMessages } from '@livekit/components-react';
import { AgentChatTranscript } from '../../../agent-chat-transcript';
import { AgentControlBar } from '../../../agent-control-bar';
import { Shimmer } from '../../../../ai-elements/shimmer';
import { cn } from '../../../../../lib/utils';
import { TileLayout } from './tile-view';

const MotionMessage = motion.create(Shimmer);

const BOTTOM_VIEW_MOTION_PROPS = {
  variants: { visible: { opacity: 1, translateY: '0%' }, hidden: { opacity: 0, translateY: '100%' } },
  initial: 'hidden', animate: 'visible', exit: 'hidden',
  transition: { duration: 0.3, delay: 0.5, ease: 'easeOut' },
};

const CHAT_MOTION_PROPS = {
  variants: { hidden: { opacity: 0, transition: { ease: 'easeOut', duration: 0.3 } },
    visible: { opacity: 1, transition: { delay: 0.2, ease: 'easeOut', duration: 0.3 } } },
  initial: 'hidden', animate: 'visible', exit: 'hidden',
};

const SHIMMER_MOTION_PROPS = {
  variants: { visible: { opacity: 1, transition: { ease: 'easeIn', duration: 0.5, delay: 0.8 } },
    hidden: { opacity: 0, transition: { ease: 'easeIn', duration: 0.5, delay: 0 } } },
  initial: 'hidden', animate: 'visible', exit: 'hidden',
};

function Fade({ top = false, bottom = false, className }) {
  return (
    <div className={cn('from-background pointer-events-none h-4 bg-linear-to-b to-transparent',
      top && 'bg-linear-to-b', bottom && 'bg-linear-to-t', className)} />
  );
}

export function AgentSessionView_01({
  preConnectMessage = 'Agent is listening, ask it a question', supportsChatInput = true,
  supportsVideoInput = true, supportsScreenShare = true, isPreConnectBufferEnabled = true,
  audioVisualizerType, audioVisualizerColor, audioVisualizerColorShift, audioVisualizerBarCount,
  audioVisualizerGridRowCount, audioVisualizerGridColumnCount, audioVisualizerRadialBarCount,
  audioVisualizerRadialRadius, audioVisualizerWaveLineWidth,
  className, ...props
}) {
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const [chatOpen, setChatOpen] = useState(false);
  const scrollAreaRef = useRef(null);
  const { state: agentState } = useAgent();

  const controls = {
    leave: true, microphone: true, chat: supportsChatInput,
    camera: supportsVideoInput, screenShare: supportsScreenShare,
  };

  useEffect(() => {
    const lastMessage = messages.at(-1);
    const lastMessageIsLocal = lastMessage?.from?.isLocal === true;
    if (scrollAreaRef.current && lastMessageIsLocal) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <section ref={scrollAreaRef} className={cn('bg-background relative z-10 h-full w-full overflow-hidden', className)} {...props}>
      <Fade top className="absolute inset-x-4 top-0 z-10 h-40" />

      <div className="absolute top-0 bottom-[135px] flex w-full flex-col md:bottom-[170px]">
        <AnimatePresence>
          {chatOpen && (
            <motion.div {...CHAT_MOTION_PROPS}
              className="flex h-full w-full flex-col gap-4 space-y-3 transition-opacity duration-300 ease-out">
              <AgentChatTranscript agentState={agentState} messages={messages}
                className="mx-auto w-full max-w-2xl [&_.is-user>div]:rounded-[22px] [&>div>div]:px-4 [&>div>div]:pt-40 md:[&>div>div]:px-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TileLayout chatOpen={chatOpen} audioVisualizerType={audioVisualizerType}
        audioVisualizerColor={audioVisualizerColor} audioVisualizerColorShift={audioVisualizerColorShift}
        audioVisualizerBarCount={audioVisualizerBarCount}
        audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
        audioVisualizerRadialRadius={audioVisualizerRadialRadius}
        audioVisualizerGridRowCount={audioVisualizerGridRowCount}
        audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
        audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth} />

      <motion.div {...BOTTOM_VIEW_MOTION_PROPS} className="absolute inset-x-3 bottom-0 z-50 md:inset-x-12">
        {isPreConnectBufferEnabled && (
          <AnimatePresence>
            {messages.length === 0 && (
              <MotionMessage key="pre-connect-message" duration={2}
                aria-hidden={messages.length > 0}
                {...SHIMMER_MOTION_PROPS}
                className="pointer-events-none mx-auto block w-full max-w-2xl pb-4 text-center text-sm font-semibold">
                {preConnectMessage}
              </MotionMessage>
            )}
          </AnimatePresence>
        )}
        <div className="bg-background relative mx-auto max-w-2xl pb-3 md:pb-12">
          <Fade bottom className="absolute inset-x-0 top-0 h-4 -translate-y-full" />
          <AgentControlBar variant="livekit" controls={controls} isChatOpen={chatOpen}
            isConnected={session.isConnected} onDisconnect={session.end} onIsChatOpenChange={setChatOpen} />
        </div>
      </motion.div>
    </section>
  );
}
