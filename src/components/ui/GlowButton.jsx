/**
 * GlowButton — reusable pill-shaped button with hover glow effect.
 *
 * Props:
 *   children  – button content (text, icons, anything)
 *   onClick   – click handler
 *   active    – if true, keeps the glow always visible
 *   icon      – optional icon element rendered before children
 *   disabled  – disables the button
 *   className – extra classes to append
 *   ...rest   – passed to the <button>
 *
 * Usage:
 *   <GlowButton onClick={handleClick}>Submit</GlowButton>
 *   <GlowButton icon={<FilterIcon />}>Filter</GlowButton>
 *   <GlowButton active={isOpen} onClick={toggle}>Menu</GlowButton>
 */
export default function GlowButton({
  children,
  onClick,
  active = false,
  icon,
  disabled = false,
  className = '',
  ...rest
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`glow-btn ${active ? 'glow-btn--active' : ''} ${disabled ? 'glow-btn--disabled' : ''} ${className}`}
      {...rest}
    >
      {icon && <span className="glow-btn__icon">{icon}</span>}
      {children && <span>{children}</span>}

      <style>{`
        .glow-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 1.4rem;
          font-size: 0.88rem;
          font-weight: 600;
          color: #1a1a2e;
          background: #fff;
          border: 1.8px solid #2a2a3e;
          border-radius: 999px;
          cursor: pointer;
          transition: box-shadow 0.3s ease, border-color 0.3s ease, transform 0.15s ease;
          box-shadow: none;
          font-family: inherit;
          line-height: 1;
          white-space: nowrap;
          user-select: none;
        }

        .glow-btn:hover,
        .glow-btn--active {
          box-shadow:
            0 0 12px 2px rgba(120, 100, 255, 0.35),
            0 0 24px 4px rgba(140, 120, 255, 0.2),
            0 0 40px 8px rgba(160, 140, 255, 0.1);
          border-color: #6e5ecf;
        }

        .glow-btn:active {
          transform: scale(0.97);
        }

        .glow-btn--disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }

        .glow-btn__icon {
          display: inline-flex;
          align-items: center;
        }

        .glow-btn__icon svg {
          width: 16px;
          height: 16px;
        }
      `}</style>
    </button>
  );
}
