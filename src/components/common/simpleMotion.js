import React, { forwardRef, useEffect, useState } from 'react';

const motionProps = new Set([
  'animate',
  'exit',
  'initial',
  'transition',
  'variants',
  'viewport',
  'whileHover',
  'whileInView',
  'whileTap',
]);

const createMotionComponent = (tag) =>
  forwardRef(function MotionComponent({ children, ...props }, ref) {
    const cleanProps = { ...props };
    motionProps.forEach((key) => {
      delete cleanProps[key];
    });

    return React.createElement(tag, { ...cleanProps, ref }, children);
  });

export const motion = new Proxy(
  {},
  {
    get: (_target, tag) => createMotionComponent(tag),
  }
);

export function useInView(ref, options = {}) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (options.once) observer.disconnect();
      } else if (!options.once) {
        setIsInView(false);
      }
    }, { rootMargin: options.margin });

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, options.margin, options.once]);

  return isInView;
}