import { useMemo } from 'react';
import { Track } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import { VideoTrack, useLocalParticipant, useTracks, useVoiceAssistant } from '@livekit/components-react';
import { cn } from '../../../../../lib/utils';
import { AudioVisualizer } from './audio-visualizer';

const ANIMATION_TRANSITION = { type: 'spring', stiffness: 675, damping: 75, mass: 1 };

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

  const isAvatar = agentVideoTrack !== undefined;
  const videoWidth = agentVideoTrack?.publication.dimensions?.width ?? 0;
  const videoHeight = agentVideoTrack?.publication.dimensions?.height ?? 0;

  return (
    <div className={cn('flex h-full w-full items-center justify-center p-4 md:p-8',
      chatOpen && 'opacity-30 pointer-events-none')}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            {!isAvatar && (
              <motion.div key="agent" layoutId="agent" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ ...ANIMATION_TRANSITION }}
                className={cn('relative flex items-center justify-center',
                  chatOpen ? 'h-12 w-12' : 'h-[120px] w-[120px] md:h-[180px] md:w-[180px]')}>
                <AudioVisualizer key="audio-visualizer"
                  initial={{ scale: 1 }}
                  animate={{ scale: chatOpen ? 0.4 : 1 }}
                  transition={{ ...ANIMATION_TRANSITION }}
                  audioVisualizerType={audioVisualizerType} audioVisualizerColor={audioVisualizerColor}
                  audioVisualizerColorShift={audioVisualizerColorShift}
                  audioVisualizerBarCount={audioVisualizerBarCount}
                  audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
                  audioVisualizerRadialRadius={audioVisualizerRadialRadius}
                  audioVisualizerGridRowCount={audioVisualizerGridRowCount}
                  audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
                  audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth}
                  isChatOpen={chatOpen}
                  className="bg-background rounded-full border border-border"
                  style={{ color: audioVisualizerColor }} />
              </motion.div>
            )}
            {isAvatar && (
              <motion.div key="avatar" layoutId="avatar" initial={{ scale: 1, opacity: 1,
                maskImage: 'radial-gradient(circle, rgba(0, 0, 0, 1) 0, rgba(0, 0, 0, 1) 20px, transparent 20px)',
                filter: 'blur(20px)' }}
                animate={{ maskImage: 'radial-gradient(circle, rgba(0, 0, 0, 1) 0, rgba(0, 0, 0, 1) 500px, transparent 500px)',
                  filter: 'blur(0px)', borderRadius: chatOpen ? 6 : 12 }}
                transition={{ ...ANIMATION_TRANSITION, maskImage: { duration: 1 }, filter: { duration: 1 } }}
                className={cn('overflow-hidden bg-black drop-shadow-xl/80',
                  chatOpen ? 'h-12 w-12 rounded-md' : 'h-[180px] w-[180px] md:h-[260px] md:w-[260px] rounded-2xl')}>
                <VideoTrack width={videoWidth} height={videoHeight} trackRef={agentVideoTrack}
                  className="h-full w-full object-cover" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {hasSecondTile && !chatOpen && (
          <AnimatePresence>
            {((cameraTrack && isCameraEnabled) || (screenShareTrack && isScreenShareEnabled)) && (
              <motion.div key="camera" layout="position" layoutId="camera"
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ ...ANIMATION_TRANSITION }}
                className="h-20 w-20 overflow-hidden rounded-lg shadow-lg md:h-24 md:w-24">
                <VideoTrack trackRef={cameraTrack || screenShareTrack}
                  width={(cameraTrack || screenShareTrack)?.publication.dimensions?.width ?? 0}
                  height={(cameraTrack || screenShareTrack)?.publication.dimensions?.height ?? 0}
                  className="h-full w-full bg-muted object-cover" />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
