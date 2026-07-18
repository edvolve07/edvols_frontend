import { useMemo } from 'react';
import { Track } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import { VideoTrack, useLocalParticipant, useTracks, useVoiceAssistant } from '@livekit/components-react';
import { cn } from '../../../../../lib/utils';
import { AudioVisualizer } from './audio-visualizer';

const ANIMATION_TRANSITION = { type: 'spring', stiffness: 675, damping: 75, mass: 1 };

const tileViewClassNames = {
  grid: ['h-full w-full', 'grid gap-x-2 place-content-center', 'grid-cols-[1fr_1fr] grid-rows-[90px_1fr_90px]'],
  agentChatOpenWithSecondTile: ['col-start-1 row-start-1', 'self-center justify-self-end'],
  agentChatOpenWithoutSecondTile: ['col-start-1 row-start-1', 'col-span-2', 'place-content-center'],
  agentChatClosed: ['col-start-1 row-start-1', 'col-span-2 row-span-3', 'place-content-center'],
  secondTileChatOpen: ['col-start-2 row-start-1', 'self-center justify-self-start'],
  secondTileChatClosed: ['col-start-2 row-start-3', 'place-content-end'],
};

function useLocalTrackRef(source) {
  const { localParticipant } = useLocalParticipant();
  const publication = localParticipant.getTrackPublication(source);
  return useMemo(() => (publication ? { source, participant: localParticipant, publication } : undefined), [source, publication, localParticipant]);
}

export function TileLayout({ chatOpen, audioVisualizerType, audioVisualizerColor, audioVisualizerColorShift,
  audioVisualizerBarCount, audioVisualizerRadialBarCount, audioVisualizerRadialRadius,
  audioVisualizerGridRowCount, audioVisualizerGridColumnCount, audioVisualizerWaveLineWidth }) {
  const { videoTrack: agentVideoTrack } = useVoiceAssistant();
  const [screenShareTrack] = useTracks([Track.Source.ScreenShare]);
  const cameraTrack = useLocalTrackRef(Track.Source.Camera);

  const isCameraEnabled = cameraTrack && !cameraTrack.publication.isMuted;
  const isScreenShareEnabled = screenShareTrack && !screenShareTrack.publication.isMuted;
  const hasSecondTile = isCameraEnabled || isScreenShareEnabled;

  const animationDelay = chatOpen ? 0 : 0.15;
  const isAvatar = agentVideoTrack !== undefined;
  const videoWidth = agentVideoTrack?.publication.dimensions?.width ?? 0;
  const videoHeight = agentVideoTrack?.publication.dimensions?.height ?? 0;

  return (
    <div className="absolute inset-x-0 top-8 bottom-32 z-50 md:top-12 md:bottom-40">
      <div className="relative mx-auto h-full max-w-2xl px-4 md:px-0">
        <div className={cn(tileViewClassNames.grid)}>
          <div className={cn(['grid',
            !chatOpen && tileViewClassNames.agentChatClosed,
            chatOpen && hasSecondTile && tileViewClassNames.agentChatOpenWithSecondTile,
            chatOpen && !hasSecondTile && tileViewClassNames.agentChatOpenWithoutSecondTile])}>
            <AnimatePresence mode="popLayout">
              {!isAvatar && (
                <motion.div key="agent" layoutId="agent" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ ...ANIMATION_TRANSITION, delay: animationDelay }}
                  className={cn('relative flex items-center justify-center', chatOpen ? 'h-[90px]' : 'h-full')}>
                  <AudioVisualizer key="audio-visualizer" initial={{ scale: 1 }}
                    animate={{ scale: chatOpen ? 0.2 : 1 }}
                    transition={{ ...ANIMATION_TRANSITION, delay: animationDelay }}
                    audioVisualizerType={audioVisualizerType} audioVisualizerColor={audioVisualizerColor}
                    audioVisualizerColorShift={audioVisualizerColorShift}
                    audioVisualizerBarCount={audioVisualizerBarCount}
                    audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
                    audioVisualizerRadialRadius={audioVisualizerRadialRadius}
                    audioVisualizerGridRowCount={audioVisualizerGridRowCount}
                    audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
                    audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth}
                    isChatOpen={chatOpen}
                    className={cn('bg-background rounded-[50px] border border-transparent transition-[border,drop-shadow]',
                      chatOpen && 'border-input shadow-2xl/10 delay-200')}
                    style={{ color: audioVisualizerColor }}
                  />
                </motion.div>
              )}
              {isAvatar && (
                <motion.div key="avatar" layoutId="avatar" initial={{ scale: 1, opacity: 1,
                  maskImage: 'radial-gradient(circle, rgba(0, 0, 0, 1) 0, rgba(0, 0, 0, 1) 20px, transparent 20px)',
                  filter: 'blur(20px)' }}
                  animate={{ maskImage: 'radial-gradient(circle, rgba(0, 0, 0, 1) 0, rgba(0, 0, 0, 1) 500px, transparent 500px)',
                    filter: 'blur(0px)', borderRadius: chatOpen ? 6 : 12 }}
                  transition={{ ...ANIMATION_TRANSITION, delay: animationDelay,
                    maskImage: { duration: 1 }, filter: { duration: 1 } }}
                  className={cn('overflow-hidden bg-black drop-shadow-xl/80', chatOpen ? 'h-[90px]' : 'h-auto w-full')}>
                  <VideoTrack width={videoWidth} height={videoHeight} trackRef={agentVideoTrack}
                    className={cn(chatOpen && 'size-[90px] object-cover')} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={cn(['grid', chatOpen && tileViewClassNames.secondTileChatOpen,
            !chatOpen && tileViewClassNames.secondTileChatClosed])}>
            <AnimatePresence>
              {((cameraTrack && isCameraEnabled) || (screenShareTrack && isScreenShareEnabled)) && (
                <motion.div key="camera" layout="position" layoutId="camera"
                  initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ ...ANIMATION_TRANSITION, delay: animationDelay }}
                  className="aspect-square size-[90px] drop-shadow-lg/20">
                  <VideoTrack trackRef={cameraTrack || screenShareTrack}
                    width={(cameraTrack || screenShareTrack)?.publication.dimensions?.width ?? 0}
                    height={(cameraTrack || screenShareTrack)?.publication.dimensions?.height ?? 0}
                    className="bg-muted aspect-square size-[90px] rounded-md object-cover" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
