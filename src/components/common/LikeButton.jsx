import { useState } from 'react';

export default function LikeButton({ liked, count, onToggle, size = 'sm', forceRed = false }) {
  const [animating, setAnimating] = useState(false);

  const handleClick = async (e) => {
    e.stopPropagation();
    setAnimating(true);
    await onToggle();
    setTimeout(() => setAnimating(false), 300);
  };

  const isActive = liked || forceRed;

  return (
    <button
      onClick={handleClick}
      title={liked ? 'Unlike' : 'Like'}
      className={`inline-flex items-center gap-1.5 rounded-[20px] cursor-pointer transition-all duration-200 ${
        size === 'sm' ? 'px-2.5 py-1' : 'px-3.5 py-1.5'
      } ${
        isActive ? 'bg-red-500/12 border-red-500/35' : 'bg-white/5 border-white/10'
      } border ${
        animating ? 'scale-110' : 'scale-100'
      }`}
    >
      <span 
        className={`transition-all duration-200 ${
          size === 'sm' ? 'text-[0.85rem]' : 'text-base'
        } ${
          isActive ? 'grayscale-0' : 'grayscale'
        }`}
      >
        ❤️
      </span>
      <span 
        className={`font-semibold transition-colors duration-200 ${
          size === 'sm' ? 'text-[0.72rem]' : 'text-[0.82rem]'
        } ${
          isActive ? 'text-[#c86e6e]' : 'text-gray-500'
        }`}
      >
        {count || 0}
      </span>
    </button>
  );
}