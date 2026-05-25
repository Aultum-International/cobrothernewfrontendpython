import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'framer-motion';
import DomainHeroCard, { HERO_CARD_W } from './DomainHeroCard';
import { DOMAIN_HERO_MOCK } from './mockDomainHeroData';

const GAP = 20;
const STEP = HERO_CARD_W + GAP;
const PAD = 8;
const LOOP_MS = 48000;
const UNIQUE = DOMAIN_HERO_MOCK.length;

function doubleList(list) {
  return [...list, ...list];
}

const doubled = doubleList(DOMAIN_HERO_MOCK);
const SEGMENT = UNIQUE * STEP;

function CarouselSlot({
  index,
  item,
  trackX,
  containerW,
  sealedIds,
  revealSlot,
  onRevealDone,
}) {
  const cw = containerW || 400;
  const dist = useTransform(trackX, (xv) =>
    Math.abs(xv + PAD + index * STEP + HERO_CARD_W / 2 - cw / 2),
  );
  const sealed = sealedIds.has(item.id);
  return (
    <DomainHeroCard
      item={item}
      dist={dist}
      sealed={sealed}
      revealActive={revealSlot === index && !sealed}
      onRevealDone={onRevealDone}
    />
  );
}

export default function RecentlySoldHeroCarousel({ className = '' }) {
  const reduce = useReducedMotion();
  const wrapRef = useRef(null);
  const [cw, setCw] = useState(400);
  const trackX = useMotionValue(0);
  const [sealedIds, setSealedIds] = useState(() => new Set());
  const [revealSlot, setRevealSlot] = useState(null);
  const [activeDot, setActiveDot] = useState(0);
  const stableRef = useRef({ idx: -1, since: 0 });
  const sealedIdsRef = useRef(sealedIds);
  const revealSlotRef = useRef(revealSlot);
  const pausedRef = useRef(false);
  const manualPauseUntil = useRef(0);
  const cwRef = useRef(cw);
  cwRef.current = cw;
  sealedIdsRef.current = sealedIds;
  revealSlotRef.current = revealSlot;

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setCw(Math.max(280, el.offsetWidth)));
    ro.observe(el);
    setCw(Math.max(280, el.offsetWidth));
    return () => ro.disconnect();
  }, []);

  const normalizeTrackX = useCallback((v) => {
    let x = v;
    while (x <= -SEGMENT) x += SEGMENT;
    while (x > 0) x -= SEGMENT;
    return x;
  }, []);

  useEffect(() => {
    if (reduce) return undefined;
    let raf = 0;
    let last = performance.now();
    const pxPerMs = SEGMENT / LOOP_MS;
    const tick = (now) => {
      const raw = now - last;
      last = now;
      const dt = Math.min(28, Math.max(5, raw));
      if (now >= manualPauseUntil.current) pausedRef.current = false;
      if (!pausedRef.current && revealSlotRef.current === null) {
        let v = trackX.get() - pxPerMs * dt;
        while (v <= -SEGMENT) v += SEGMENT;
        trackX.set(v);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, trackX]);

  const pause = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const resume = useCallback(() => {
    if (performance.now() >= manualPauseUntil.current) pausedRef.current = false;
  }, []);

  const onRevealDone = useCallback(
    (id) => {
      setSealedIds((prev) => new Set(prev).add(id));
      setRevealSlot(null);
      resume();
    },
    [resume],
  );

  useMotionValueEvent(trackX, 'change', (xv) => {
    const cw2 = cwRef.current || 400;
    let bestI = -1;
    let bestD = 1e9;
    for (let i = 0; i < doubled.length; i += 1) {
      const cardCenter = xv + PAD + i * STEP + HERO_CARD_W / 2;
      const d = Math.abs(cardCenter - cw2 / 2);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    }
    if (bestI >= 0) setActiveDot(bestI % UNIQUE);

    if (reduce || revealSlotRef.current !== null) return;
    if (bestI < 0 || bestD > 58) {
      stableRef.current = { idx: -1, since: performance.now() };
      return;
    }
    const now = performance.now();
    if (stableRef.current.idx !== bestI) {
      stableRef.current = { idx: bestI, since: now };
      return;
    }
    if (now - stableRef.current.since < 420) return;
    const item = doubled[bestI];
    const canReveal =
      (item.status === 'sold' || item.status === 'available') &&
      !sealedIdsRef.current.has(item.id);
    if (!canReveal) return;
    pause();
    setRevealSlot(bestI);
  });

  const sealedKey = useMemo(() => [...sealedIds].sort().join(','), [sealedIds]);

  const slots = useMemo(
    () =>
      doubled.map((item, index) => (
        <CarouselSlot
          key={`${item.id}-${index}`}
          index={index}
          item={item}
          trackX={trackX}
          containerW={cw}
          sealedIds={sealedIds}
          revealSlot={revealSlot}
          onRevealDone={onRevealDone}
        />
      )),
    [trackX, cw, sealedKey, revealSlot, onRevealDone, sealedIds],
  );

  return (
    <div className={`relative w-full min-w-0 overflow-visible ${className}`}>
      <div className="relative w-full px-2 sm:px-4 lg:pl-8 lg:pr-2">
        <div
          ref={wrapRef}
          className="relative min-h-[260px] w-full overflow-x-clip overflow-y-visible py-3 sm:min-h-[300px] sm:py-5 lg:min-h-[320px] lg:py-6"
          style={{
            WebkitMaskImage:
              'linear-gradient(90deg, transparent 0%, black 14%, black 90%, transparent 100%)',
            maskImage:
              'linear-gradient(90deg, transparent 0%, black 14%, black 90%, transparent 100%)',
          }}
        >
          <motion.div
            className="relative z-0 flex w-max flex-row items-center gap-5 transform-gpu will-change-transform"
            style={{ x: trackX, paddingLeft: PAD, translateZ: 0 }}
          >
            {slots}
          </motion.div>
        </div>
      </div>

      <div className="mt-2 flex justify-center gap-2 px-2 sm:px-4" aria-hidden={reduce}>
        {DOMAIN_HERO_MOCK.map((d, i) => (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              const cw2 = cwRef.current || 400;
              const targetCenter = PAD + i * STEP + HERO_CARD_W / 2;
              const current = trackX.get();
              const ideal = cw2 / 2 - targetCenter;
              trackX.set(normalizeTrackX(ideal));
              setActiveDot(i);
              pausedRef.current = true;
              manualPauseUntil.current = performance.now() + 5000;
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              activeDot === i ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label={`Show ${d.name}.${d.tld}`}
          />
        ))}
      </div>
    </div>
  );
}
