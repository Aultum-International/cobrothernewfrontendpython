/**
 * Exchange icon (Noun Project #3550204, Gregor Cresnar).
 * https://thenounproject.com/icon/exchange-3550204/
 */
import exchangeIcon from '../../assets/icons/exchange-3550204.png';

export default function CurrencyConversionIcon({ size = 14, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        flexShrink: 0,
        backgroundColor: 'currentColor',
        maskImage: `url(${exchangeIcon})`,
        WebkitMaskImage: `url(${exchangeIcon})`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  );
}
