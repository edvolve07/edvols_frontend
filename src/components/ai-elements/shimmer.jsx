import React, { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

const ShimmerComponent = ({ children, as: Component = 'p', className, duration = 2, spread = 2, forwardedRef }) => {
  const MotionComponent = motion.create(Component);

  const dynamicSpread = useMemo(() => (children?.length ?? 0) * spread, [children, spread]);

  return (
    <MotionComponent
      ref={forwardedRef}
      animate={{ backgroundPosition: '0% center' }}
      className={cn(
        'relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent',
        '[background-repeat:no-repeat,padding-box] [--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background),#0000_calc(50%+var(--spread)))]',
        className
      )}
      initial={{ backgroundPosition: '100% center' }}
      style={{
        '--spread': `${dynamicSpread}px`,
        backgroundImage:
          'var(--bg), linear-gradient(var(--color-muted-foreground), var(--color-muted-foreground))',
      }}
      transition={{
        repeat: Number.POSITIVE_INFINITY,
        duration,
        ease: 'linear',
      }}
    >
      {children}
    </MotionComponent>
  );
};

export const Shimmer = memo(
  React.forwardRef((props, ref) => <ShimmerComponent {...props} forwardedRef={ref} />)
);
Shimmer.displayName = 'Shimmer';
