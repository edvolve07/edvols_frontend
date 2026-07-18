import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useLocation } from "react-router-dom";
import { DURATION, EASE, DISTANCE } from "../constants";
import { useReducedMotion } from "./useReducedMotion";

export function usePageTransition() {
  const ref = useRef(null);
  const location = useLocation();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!ref.current || reduced) return;

    const el = ref.current;
    el.style.willChange = "transform, opacity";

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: DISTANCE.up },
        { opacity: 1, y: 0, duration: DURATION.pageEnter, ease: EASE.smooth, clearProps: "transform,willChange" }
      );
    });

    return () => ctx.revert();
  }, [location.pathname, reduced]);

  return ref;
}
