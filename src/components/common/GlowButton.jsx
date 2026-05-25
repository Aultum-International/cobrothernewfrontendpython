export default function GlowButton({ 
  children, 
  onClick, 
  type = 'button',
  disabled = false,
  className = '',
  icon: Icon,
  size = 'md',
  fullWidth = false
}) {
  const sizeClasses = {
    sm: 'btn-glow-sm',
    md: '',
    lg: 'btn-glow-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        btn-glow
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {Icon && <Icon size={18} className="flex-shrink-0" />}
      <span>{children}</span>
    </button>
  );
}
