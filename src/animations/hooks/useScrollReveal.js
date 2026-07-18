import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DURATION, EASE, DISTANCE, VIEWPORT } from "../constants";

gsap.registerPlugin(ScrollTrigger);

export function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const {
    direction = "up",
    distance = DISTANCE[direction] || DISTANCE.up,
    duration = DURATION.reveal,
    ease = EASE.smooth,
    delay = 0,
    viewport = VIEWPORT,
    disabled = false,
  } = options;

  useEffect(() => {
    if (disabled || !ref.current) return;
    const el = ref.current;
    el.style.opacity = "0";
    el.style.willChange = "transform, opacity";

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: direction === "up" || direction === "down" ? distance : 0, x: direction === "left" || direction === "right" ? distance : 0, opacity: 0 },
        {
          y: 0,
          x: 0,
          opacity: 1,
          duration,
          ease,
          delay,
          scrollTrigger: {
            trigger: el,
            start: "top bottom-=80",
            ...viewport,
          },
        }
      );
    });

    return () => {
      ctx.revert();
      el.style.willChange = "auto";
    };
  }, [direction, distance, duration, ease, delay, disabled]);

  return ref;
}

export function useStaggerReveal(options = {}) {
  const ref = useRef(null);
  const {
    childSelector = ":scope > *",
    from = "start",
    duration = DURATION.stagger.item,
    stagger = DURATION.stagger.section,
    ease = EASE.smooth,
    distance = DISTANCE.up,
    viewport = VIEWPORT,
    disabled = false,
  } = options;

  useEffect(() => {
    if (disabled || !ref.current) return;
    const children = ref.current.querySelectorAll(childSelector);
    if (!children.length) return;

    children.forEach((child) => {
      child.style.willChange = "transform, opacity";
    });

    const ctx = gsap.context(() => {
      gsap.fromTo(
        children,
        { y: distance, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration,
          ease,
          stagger,
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom-=80",
            ...viewport,
          },
        }
      );
    });

    return () => {
      ctx.revert();
      children.forEach((child) => { child.style.willChange = "auto"; });
    };
  }, [childSelector, distance, duration, stagger, ease, disabled]);

  return ref;
}
