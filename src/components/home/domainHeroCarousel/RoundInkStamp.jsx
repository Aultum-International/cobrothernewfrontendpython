import soldStampImage from '../../../assets/sold.png';
import unsoldStampImage from '../../../assets/unsold.png';

const STAMP_IMAGES = {
  sold: soldStampImage,
  unsold: unsoldStampImage,
};

const SIZES = {
  sm: 'h-[56px] w-[56px]',
  md: 'h-[74px] w-[74px]',
  lg: 'h-[112px] w-[112px] sm:h-[124px] sm:w-[124px]',
};

export default function RoundInkStamp({
  variant = 'sold',
  size = 'sm',
  className = '',
}) {
  const src = STAMP_IMAGES[variant] ?? STAMP_IMAGES.sold;
  const dim = SIZES[size] ?? SIZES.sm;
  const label = variant === 'unsold' ? 'UNSOLD stamp' : 'SOLD stamp';

  return (
    <img
      src={src}
      alt={label}
      draggable="false"
      decoding="async"
      className={`inline-block shrink-0 select-none object-contain ${dim} ${className}`.trim()}
      style={{
        filter: 'drop-shadow(0 8px 14px rgba(15, 23, 42, 0.16))',
        transform: 'translateZ(0)',
      }}
    />
  );
}
