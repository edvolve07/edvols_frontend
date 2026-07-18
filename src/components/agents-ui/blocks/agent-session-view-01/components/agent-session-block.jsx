import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAgent, useSessionContext, useSessionMessages } from '@livekit/components-react';
import { AgentChatTranscript } from '../../../agent-chat-transcript';
import { AgentControlBar } from '../../../agent-control-bar';
import { Shimmer } from '../../../../ai-elements/shimmer';
import { cn } from '../../../../../lib/utils';
import { TileLayout } from './tile-view';

const MotionMessage = motion.create(Shimmer);

const CHAT_MOTION_PROPS = {
  variants: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  initial: 'hidden', animate: 'visible', exit: 'hidden',
  transition: { duration: 0.3, ease: 'easeOut' },
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
  onDisconnect: onDisconnectProp, className, ...props
}) {
  const { ref, ...restProps } = props;
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const [chatOpen, setChatOpen] = useState(false);
  const chatScrollRef = useRef(null);
  const { state: agentState } = useAgent();

  const controls = {
    leave: true, microphone: true, chat: supportsChatInput,
    camera: supportsVideoInput, screenShare: supportsScreenShare,
  };

  useEffect(() => {
    if (chatScrollRef.current && messages.length > 0) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <section className={cn('bg-background relative z-10 h-full w-full overflow-hidden', className)} {...restProps}>
      <Fade top className="absolute inset-x-4 top-0 z-20 h-40" />

      <div className="absolute inset-0 flex flex-col">
        <div className="relative flex-1 min-h-0">
          <TileLayout chatOpen={chatOpen} audioVisualizerType={audioVisualizerType}
            audioVisualizerColor={audioVisualizerColor} audioVisualizerColorShift={audioVisualizerColorShift}
            audioVisualizerBarCount={audioVisualizerBarCount}
            audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
            audioVisualizerRadialRadius={audioVisualizerRadialRadius}
            audioVisualizerGridRowCount={audioVisualizerGridRowCount}
            audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
            audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth} />

          <AnimatePresence>
            {chatOpen && (
              <motion.div ref={chatScrollRef} {...CHAT_MOTION_PROPS}
                className="absolute inset-0 z-30 overflow-y-auto bg-background/95 backdrop-blur-sm">
                <AgentChatTranscript agentState={agentState} messages={messages}
                  className="mx-auto w-full max-w-2xl px-4 pt-16 pb-4 [&_.is-user>div]:rounded-[22px]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="shrink-0 px-3 pb-3 md:px-12 md:pb-6">
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
          <div className="bg-background relative mx-auto max-w-2xl">
            <Fade bottom className="absolute inset-x-0 top-0 h-4 -translate-y-full" />
            <AgentControlBar variant="livekit" controls={controls} isChatOpen={chatOpen}
              isConnected={session.isConnected} onDisconnect={() => { session.end().catch(() => {}); onDisconnectProp?.(); }} onIsChatOpenChange={setChatOpen} />
          </div>
        </div>
      </div>
    </section>
  );
}
