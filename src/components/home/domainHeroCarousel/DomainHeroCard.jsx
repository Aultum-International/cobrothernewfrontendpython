import { memo, useEffect, useState } from 'react';
import { Gauge, Users } from 'lucide-react';
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useTransform,
} from 'framer-motion';
import RoundInkStamp from './RoundInkStamp';
import SoldStampSlam from './SoldStampSlam';

export const HERO_CARD_W = 240;
export const HERO_CARD_H = 308;

function formatInr(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

const DomainHeroCard = memo(function DomainHeroCard({
  item,
  dist,
  sealed,
  revealActive,
  onRevealDone,
}) {
  const reduce = useReducedMotion();
  const [ry, setRy] = useState(0);
  const [showSlam, setShowSlam] = useState(false);
  const [postReveal, setPostReveal] = useState(false);

  const scale = useTransform(
    dist,
    [0, 28, 56, 90, 130, 170, 220, 280, 340],
    reduce
      ? [1, 1, 1, 1, 1, 1, 1, 1, 1]
      : [1.04, 1.035, 1.02, 1.008, 0.99, 0.975, 0.96, 0.95, 0.94],
  );
  const opacity = useTransform(
    dist,
    [0, 50, 100, 160, 220],
    reduce ? [1, 1, 1, 1, 1] : [1, 0.92, 0.78, 0.62, 0.5],
  );
  const cardShadow = useTransform(
    dist,
    [0, 80, 160],
    [
      '0 24px 48px -14px rgba(15, 23, 42, 0.14)',
      '0 14px 28px -12px rgba(15, 23, 42, 0.09)',
      '0 8px 20px -10px rgba(15, 23, 42, 0.06)',
    ],
  );
  const blurPx = useTransform(
    dist,
    [0, 70, 120, 200, 280],
    reduce ? [0, 0, 0, 0, 0] : [0, 0, 0.4, 2, 3.5],
  );
  const cardFilter = useMotionTemplate`blur(${blurPx}px)`;

  useEffect(() => {
    if (sealed) setPostReveal(false);
  }, [sealed]);

  const isSold = item.status === 'sold';
  const isLive = item.status === 'available';
  const canAnimate = isSold || isLive;
  const stampVariant = isSold ? 'sold' : 'unsold';
  const locked = sealed || postReveal;
  const lockedSold = locked && isSold;
  const lockedUnsold = locked && isLive;
  const showListing = !locked && (isSold || isLive);

  useEffect(() => {
    if (!revealActive || sealed || reduce || !canAnimate) return undefined;
    let cancelled = false;
    const run = async () => {
      setRy(180);
      await new Promise((r) => setTimeout(r, 580));
      if (cancelled) return;
      setRy(0);
      await new Promise((r) => setTimeout(r, 120));
      if (cancelled) return;
      setShowSlam(true);
      await new Promise((r) => setTimeout(r, 3100));
      if (cancelled) return;
      setShowSlam(false);
      onRevealDone?.(item.id);
      setPostReveal(true);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [revealActive, sealed, reduce, canAnimate, item.id, onRevealDone]);

  const iconClass = lockedSold
    ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white'
    : lockedUnsold
      ? 'bg-gradient-to-br from-red-500 to-red-700 text-white'
      : isSold && !locked
        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
        : 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white';

  const footer = (
    <div className="mt-auto grid w-full grid-cols-2 gap-3 border-t border-slate-100 pt-4">
      <div className="flex flex-col items-center justify-center gap-1 text-center">
        <Users className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
        <span className="text-[11px] font-medium leading-tight text-slate-700">
          {item.bidders || '10,000+'}
          <br />
          <span className="text-slate-500">Bidders</span>
        </span>
      </div>
      <div className="flex flex-col items-center justify-center gap-1 text-center">
        <Gauge className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
        <span className="text-[11px] font-medium leading-tight text-slate-700">
          {item.successRate || '98%'}
          <br />
          <span className="text-slate-500">Success Rate</span>
        </span>
      </div>
    </div>
  );

  const body = lockedSold ? (
    <>
      <div
        className={`mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black shadow-sm ${iconClass}`}
        aria-hidden
      >
        ✓
      </div>
      <p className="w-full text-left font-sans text-[17px] font-bold leading-tight text-[#1e293b]">
        {item.name}
        <span className="text-[#1e293b]">.{item.tld}</span>
      </p>
      <p className="mt-2 w-full text-left text-[13px] text-slate-500">
        <span className="text-slate-600">{item.owner}</span>
        <span className="mx-1 text-slate-400">·</span>
        <span className="font-medium text-slate-700">{formatInr(item.price)}</span>
      </p>
      <div className="mt-4 flex w-full flex-wrap items-center justify-start gap-3">
        <RoundInkStamp variant="sold" size="sm" />
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
          Verified
        </span>
      </div>
      {footer}
    </>
  ) : lockedUnsold ? (
    <>
      <div
        className={`mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-bold shadow-sm ${iconClass}`}
        aria-hidden
      >
        {(item.name || '?').slice(0, 1).toUpperCase()}
      </div>
      <p className="w-full text-left font-sans text-[17px] font-bold leading-tight text-[#1e293b]">
        {item.name}
        <span className="text-[#1e293b]">.{item.tld}</span>
      </p>
      <p className="mt-2 w-full text-left text-[13px] text-slate-500">
        <span className="font-medium text-slate-700">{formatInr(item.price)}</span>
      </p>
      <div className="mt-4 flex w-full flex-wrap items-center justify-start gap-3">
        <RoundInkStamp variant="unsold" size="sm" />
      </div>
      {footer}
    </>
  ) : showListing ? (
    <>
      <div
        className={`mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-bold shadow-sm ${iconClass}`}
        aria-hidden
      >
        {(item.name || '?').slice(0, 1).toUpperCase()}
      </div>
      <p className="w-full text-left font-sans text-[17px] font-bold leading-tight text-[#1e293b]">
        {item.name}
        <span className="text-[#1e293b]">.{item.tld}</span>
      </p>
      <p className="mt-2 w-full text-left text-[13px] text-slate-500">
        {isSold && item.owner ? (
          <>
            <span className="text-slate-600">{item.owner}</span>
            <span className="mx-1 text-slate-400">·</span>
          </>
        ) : null}
        <span className="font-medium text-slate-700">{formatInr(item.price)}</span>
      </p>
      <div className="mt-4 flex w-full flex-wrap items-center justify-start gap-3">
        {isLive ? (
          <RoundInkStamp variant="unsold" size="sm" />
        ) : (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-100">
            Marketplace
          </span>
        )}
      </div>
      {footer}
    </>
  ) : (
    <p className="mt-auto text-sm font-medium text-slate-400">Processing…</p>
  );

  return (
    <div
      className="relative shrink-0 overflow-visible"
      style={{ width: HERO_CARD_W, height: HERO_CARD_H }}
    >
      <motion.div
        className="h-full w-full origin-center transform-gpu will-change-transform"
        style={{ scale, opacity, translateZ: 0 }}
      >
        <div className="h-full w-full [perspective:1100px]" style={{ perspective: '1100px' }}>
          <motion.div
            className="relative h-full w-full transform-gpu"
            style={{ transformStyle: 'preserve-3d', translateZ: 0 }}
            animate={{ rotateY: reduce ? 0 : ry }}
            transition={{ duration: 0.62, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <motion.div
                className="absolute inset-0 flex flex-col items-stretch overflow-hidden rounded-[22px] bg-white px-5 py-5"
                style={{
                  boxShadow: cardShadow,
                  filter: cardFilter,
                  translateZ: 0,
                  willChange: 'filter, box-shadow',
                }}
              >
                {body}
              </motion.div>
              <SoldStampSlam visible={showSlam} variant={stampVariant} />
            </div>

            <div
              className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[22px] border border-slate-100 bg-gradient-to-b from-slate-50 to-white px-5 py-5 text-center shadow-inner"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                translateZ: 0,
              }}
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <span className="text-lg">⟳</span>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Authenticating</p>
              <p className="mt-1 text-xs text-slate-600">Secure transfer</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
});

export default DomainHeroCard;
