export default function SkeletonCard() {
    return (
      <div className="p-6 bg-[#adadad] border border-[#22222e] rounded-[14px] pointer-events-none shadow-sm">
        <div className="flex gap-3 mb-4 items-center">
          <Bone className="w-11 h-11 rounded-[10px] flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Bone className="h-3 w-3/5 rounded-md" />
            <Bone className="h-2.5 w-2/5 rounded-md" />
          </div>
        </div>
        <Bone className="h-3.5 w-4/5 rounded-md mb-2" />
        <Bone className="h-2.5 w-full rounded-md mb-1.5" />
        <Bone className="h-2.5 w-[90%] rounded-md mb-4" />
        <Bone className="h-2.5 w-[35%] rounded-md mb-5" />
        <div className="flex justify-between items-center">
          <Bone className="h-2.5 w-1/4 rounded-md" />
          <Bone className="h-[30px] w-[30%] rounded-lg" />
        </div>
      </div>
    );
  }
  
  function Bone({ className }) {
    return (
      <div 
        className={`animate-shimmer ${className}`}
        style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
          backgroundSize: '200% 100%',
        }}
      />
    );
  }
  
  // Add to your global CSS:
  // @keyframes skeleton-shimmer {
  //   0%   { background-position: 200% 0; }
  //   100% { background-position: -200% 0; }
  // }