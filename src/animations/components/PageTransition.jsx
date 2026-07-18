import { usePageTransition } from "../hooks/usePageTransition";

export function PageTransition({ children, className = "" }) {
  const ref = usePageTransition();
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
