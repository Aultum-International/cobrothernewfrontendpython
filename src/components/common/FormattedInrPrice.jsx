import useCurrency from '../../context/CurrencyContext';

/**
 * Display an INR-stored amount in the navbar-selected currency.
 */
export default function FormattedInrPrice({ amount, className, as: Tag = 'span', ...rest }) {
  const { formatPrice } = useCurrency();
  return (
    <Tag className={className} {...rest}>
      {formatPrice(amount)}
    </Tag>
  );
}
