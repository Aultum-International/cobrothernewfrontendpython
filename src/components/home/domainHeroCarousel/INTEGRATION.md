# Recently Sold Hero Carousel

## What it does

- Renders in **`HeroGlow.jsx`** (homepage hero): **right column** next to the headline, with negative top margin so it sits higher in the hero whitespace. On small screens it stacks under the subtitle.
- **`DomainSearchBar.jsx`**: search and promotional offer only (no carousel there on desktop).
- Infinite horizontal drift with **testimonial-style** cards (~**268×228** px): **center** = solid white, lift + shadow; **sides** = light blur on the **card face only** (stamp never blurred). **No mask** on the track — soft **edge gradient overlays** + horizontal clip only, **vertical overflow visible** and generous padding so scaled cards are not cropped. Auto-scroll only.
- **Available** domains: glide through unchanged.
- **Sold** domains: when a card is **stable in the center**, the strip pauses; that **same** card **3D flips**, a red **DOMAIN SOLD** stamp **slams** on, then the card **locks** into a permanent sold layout (stamp + domain + owner). The strip then resumes.

## Files

| File | Role |
|------|------|
| `RecentlySoldHeroCarousel.jsx` | Track motion (rAF), pause/resume, center detection, sealed IDs. |
| `DomainHeroCard.jsx` | Glass card, distance styling, flip + stamp + sold UI. |
| `SoldStampSlam.jsx` | Red ink stamp slam overlay. |
| `mockDomainHeroData.js` | Mock rows (`status: 'available' \| 'sold'`, price, owner). |

## Tweaking

- **Speed:** `LOOP_MS` in `RecentlySoldHeroCarousel.jsx` (default **46s** per full catalog loop).
- **Center vs sides:** subtle **blur on the card face**; **scale** on an inner **`transform-gpu`** layer with fixed **268×228** slot + **`overflow-visible`**. Edge softening uses **gradient overlays**, not `mask-image` on the track (avoids harsh cutoff lines). Hero section: **`overflow-x-hidden overflow-y-visible`** so scaled cards are not vertically clipped.
- **Center tolerance:** `bestD > 62` and stability window `420` ms (tuned for ~268px-wide cards).
- **Catalog:** edit `DOMAIN_HERO_MOCK` (keep `id` unique per logical domain).

## Requirements

- `framer-motion` (already in project).
- Plain React + Vite (no Next.js).
