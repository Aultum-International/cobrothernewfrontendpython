import { motion, useReducedMotion } from 'framer-motion';
import RoundInkStamp from './RoundInkStamp';

/** Asset stamp — cinematic scale, rotate, and soft impact on card reveal. */
export default function SoldStampSlam({ visible, variant = 'sold' }) {
  const reduce = useReducedMotion();

  if (!visible) return null;

  if (reduce) {
    return (
      <div className="pointer-events-none absolute inset-0 z-[35] flex items-center justify-center">
        <RoundInkStamp variant={variant} size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[35] flex items-center justify-center"
      initial={{ opacity: 1 }}
    >
      <motion.div
        initial={{ y: -72, rotate: -24, scale: 1.42, opacity: 0 }}
        animate={{
          y: [-72, 14, -4, 0],
          rotate: [-24, -15, -10, -12],
          scale: [1.42, 1.1, 0.97, 1],
          opacity: [0, 1, 1],
        }}
        transition={{ duration: 0.78, times: [0, 0.66, 0.86, 1], ease: [0.16, 0.92, 0.2, 1] }}
        style={{
          filter: 'drop-shadow(0 14px 18px rgba(15, 23, 42, 0.2))',
          transformOrigin: '50% 54%',
        }}
      >
        <motion.div
          animate={{ x: [0, -3, 3, -2, 2, 0], y: [0, 1, -1, 0] }}
          transition={{ delay: 0.68, duration: 0.38, ease: 'easeOut' }}
        >
          <RoundInkStamp variant={variant} size="lg" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
