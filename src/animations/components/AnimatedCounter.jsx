import { useAnimatedCounter } from "../hooks/useAnimatedCounter";

export function AnimatedCounter({ end, ...rest }) {
  const { ref, display } = useAnimatedCounter(end, rest);
  return <span ref={ref}>{display}</span>;
}
