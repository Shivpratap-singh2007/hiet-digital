import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'statCard';
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  count = 1
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'text':
        return 'h-3.5 rounded-md';
      case 'card':
        return 'h-32 rounded-2xl';
      case 'statCard':
        return 'h-24 rounded-2xl';
      case 'rectangular':
      default:
        return 'rounded-xl';
    }
  };

  const elements = Array.from({ length: count });

  if (count === 1) {
    return (
      <div 
        className={`animate-pulse bg-slate-200/80 ${getVariantClasses()} ${className}`} 
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="space-y-2">
      {elements.map((_, i) => (
        <div 
          key={i} 
          className={`animate-pulse bg-slate-200/80 ${getVariantClasses()} ${className}`} 
          aria-hidden="true"
        />
      ))}
    </div>
  );
};
