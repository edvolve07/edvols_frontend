import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DURATION, EASE } from "../constants";

gsap.registerPlugin(ScrollTrigger);

export function useAnimatedCounter(end, options = {}) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const {
    start = 0,
    duration = DURATION.counter,
    ease = EASE.spring,
    decimals = 0,
    suffix = "",
    disabled = false,
  } = options;

  useEffect(() => {
    if (disabled) {
      setCount(end);
      return;
    }
    const el = { value: start };

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top bottom-=60",
        once: true,
        onEnter: () => {
          gsap.to(el, {
            value: end,
            duration,
            ease,
            onUpdate: () => setCount(Number(el.value.toFixed(decimals))),
          });
        },
      });
    });

    return () => ctx.revert();
  }, [end, start, duration, ease, decimals, disabled]);

  const display = `${count}${suffix}`;
  return { ref, count, display };
}
