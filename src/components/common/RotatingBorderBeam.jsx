/**
 * Static cyan / purple / rose viewport edge glow.
 * Kept for compatibility if older pages import this component.
 */
export default function RotatingBorderBeam() {
  return (
    <div className="static-edge-beam-root pointer-events-none fixed inset-0 z-[90]" aria-hidden>
      <style>{`
        .static-edge-beam-root::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          padding: 2px;
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          mask-composite: exclude;
          background:
            linear-gradient(135deg,
              rgba(0, 195, 255, 0.58),
              rgba(99, 102, 241, 0.34) 30%,
              rgba(88, 28, 135, 0.72) 58%,
              rgba(255, 48, 108, 0.4));
          box-shadow: 0 0 18px rgba(76, 29, 149, 0.22);
        }
      `}</style>
    </div>
  );
}
