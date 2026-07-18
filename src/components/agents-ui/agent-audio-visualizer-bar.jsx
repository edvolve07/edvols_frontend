import React, { Children, cloneElement, isValidElement, useMemo } from 'react';
import { cva } from 'class-variance-authority';
import { useMultibandTrackVolume } from '@livekit/components-react';
import { useAgentAudioVisualizerBarAnimator } from '../../hooks/agents-ui/use-agent-audio-visualizer-bar';
import { cn } from '../../lib/utils';

function cloneSingleChild(children, props, key) {
  return Children.map(children, (child) => {
    if (isValidElement(child) && Children.only(children)) {
      const childProps = child.props;
      if (childProps.className) {
        props ??= {};
        props.className = cn(childProps.className, props.className);
        props.style = { ...(childProps.style), ...(props.style) };
      }
      return cloneElement(child, { ...props, key: key ? String(key) : undefined });
    }
    return child;
  });
}

export const AgentAudioVisualizerBarElementVariants = cva(
  ['rounded-full transition-colors duration-250 ease-linear', 'bg-current/10 data-[lk-highlighted=true]:bg-current'],
  {
    variants: {
      size: {
        icon: 'w-[4px] min-h-[4px]', sm: 'w-[8px] min-h-[8px]', md: 'w-[16px] min-h-[16px]',
        lg: 'w-[32px] min-h-[32px]', xl: 'w-[64px] min-h-[64px]',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

export const AgentAudioVisualizerBarVariants = cva('relative flex items-center justify-center', {
  variants: {
    size: {
      icon: 'h-[24px] gap-[2px]', sm: 'h-[56px] gap-[4px]', md: 'h-[112px] gap-[8px]',
      lg: 'h-[224px] gap-[16px]', xl: 'h-[448px] gap-[32px]',
    },
  },
  defaultVariants: { size: 'md' },
});

export const AgentAudioVisualizerBar = React.forwardRef(function AgentAudioVisualizerBar({
  size = 'md', state = 'connecting', color, barCount, audioTrack, className, children, style, ...props
}, ref) {
  const _barCount = useMemo(() => {
    if (barCount) return barCount;
    return size === 'icon' || size === 'sm' ? 3 : 5;
  }, [barCount, size]);

  const volumeBands = useMultibandTrackVolume(audioTrack, { bands: _barCount, loPass: 100, hiPass: 200 });

  const sequencerInterval = useMemo(() => {
    switch (state) {
      case 'connecting': return 2000 / _barCount;
      case 'initializing': return 2000;
      case 'listening': return 500;
      case 'thinking': return 150;
      default: return 1000;
    }
  }, [state, _barCount]);

  const highlightedIndices = useAgentAudioVisualizerBarAnimator(state, _barCount, sequencerInterval);

  const bands = useMemo(() => (state === 'speaking' ? volumeBands : new Array(_barCount).fill(0)), [state, volumeBands, _barCount]);

  if (children && Array.isArray(children)) {
    throw new Error('AgentAudioVisualizerBar children must be a single element.');
  }

  return (
    <div
      ref={ref}
      data-lk-state={state}
      style={{ ...style, color }}
      className={cn(AgentAudioVisualizerBarVariants({ size }), className)}
      {...props}
    >
      {bands.map((band, idx) =>
        children ? (
          <React.Fragment key={idx}>
            {cloneSingleChild(children, {
              'data-lk-index': idx,
              'data-lk-highlighted': highlightedIndices.includes(idx),
              style: { height: `${band * 100}%` },
            })}
          </React.Fragment>
        ) : (
          <div
            key={idx}
            data-lk-index={idx}
            data-lk-highlighted={highlightedIndices.includes(idx)}
            style={{ height: `${band * 100}%` }}
            className={cn(AgentAudioVisualizerBarElementVariants({ size }))}
          />
        )
      )}
    </div>
  );
});
