import React from 'react';

export const Skeleton = ({
  className = '',
  variant = 'rect',
  ...props
}) => {
  const base = 'animate-pulse bg-slate-200/80 rounded-lg';
  const variants = {
    text: 'h-4 w-full rounded',
    circle: 'rounded-full shrink-0',
    rect: 'rounded-xl w-full'
  };

  return (
    <div
      aria-hidden="true"
      className={`${base} ${variants[variant] || variants.rect} ${className}`}
      {...props}
    />
  );
};

export const CardSkeleton = () => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton variant="circle" className="w-8 h-8" />
    </div>
    <Skeleton className="h-8 w-20" />
    <Skeleton className="h-3 w-48" />
  </div>
);

export default Skeleton;
