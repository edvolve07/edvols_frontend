import { useScrollReveal, useStaggerReveal } from "../hooks/useScrollReveal";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function Reveal({ children, as: Tag = "div", className = "", ...rest }) {
  const reduced = useReducedMotion();
  const ref = useScrollReveal({ disabled: reduced, ...rest });

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

export function StaggerChildren({ children, as: Tag = "div", className = "", ...rest }) {
  const reduced = useReducedMotion();
  const ref = useStaggerReveal({ disabled: reduced, ...rest });

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
