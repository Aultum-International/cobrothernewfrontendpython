# Compact Domain Ticker

## Files

- `CompactDomainTicker.jsx`: Framer Motion ticker with left-to-right rAF motion, mask fading, per-card edge opacity, center pause detection, and seamless wrapping.
- `SmallDomainTickerCard.jsx`: compact reusable floating glass card with SOLD/UNSOLD labels and a spring-driven stamp that stays visible during the center pause.
- `mockDomainTickerData.js`: local mock domain feed data.

## Integration

`DomainSearchBar.jsx` renders the ticker beside the desktop search form and below the search form on tablet and mobile. The old promotional offer block has been removed.

The ticker container is intentionally transparent and uses horizontal clipping with visible vertical overflow, so shadows and stamps do not create clipped horizontal strips. Fade is handled with `mask-image` plus per-card opacity, so only floating cards are visible. The oversized right-side hero carousel was removed from `HeroGlow.jsx`, keeping the hero cleaner while preserving the homepage section order.

The center pause is controlled by `PAUSE_MS` in `CompactDomainTicker.jsx`. It is long enough for the slower stamp impact plus a clear 2-3 second hold before the card resumes drifting.
