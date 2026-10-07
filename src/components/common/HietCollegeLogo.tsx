import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon-only' | 'badge' | 'full';
  className?: string;
  glow?: boolean;
}

export const HietCollegeLogo: React.FC<Props> = ({
  size = 'md',
  variant = 'full',
  className = '',
  glow = true
}) => {
  const [imageError, setImageError] = useState(false);

  // Dimensions based on size
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl'
  };

  // Official emblem of HIET Shahpur (Authentic gear crest + Dhauladhar peaks + Motto)
  const renderEmblem = () => (
    <div 
      className={`relative group/emblem ${iconSizes[size]} rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center p-1 shrink-0 shadow-lg ${
        glow ? 'shadow-blue-600/30 ring-2 ring-blue-500/30 dark:ring-cyan-400/40' : ''
      } border border-slate-200/90 dark:border-blue-500/40 transform hover:scale-105 transition-all duration-300`}
    >
      {/* Background soft glow */}
      <div className="absolute inset-0 bg-radial-glow from-blue-500/10 dark:from-cyan-400/15 to-transparent rounded-2xl pointer-events-none" />

      {/* Official Real HIET College Logo */}
      {!imageError ? (
        <img
          src="/images/hiet_crest.png"
          alt="HIET College Official Logo"
          onError={() => setImageError(true)}
          className="w-full h-full object-contain filter drop-shadow-xs group-hover/emblem:scale-105 group-hover/emblem:rotate-2 transition-transform duration-300"
        />
      ) : (
        <GraduationCap className="w-4/5 h-4/5 text-blue-600 dark:text-cyan-300" />
      )}

      {/* Glowing live beacon dot */}
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-slate-900" />
      </span>
    </div>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex ${className}`}>{renderEmblem()}</div>;
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs max-w-full ${className}`}>
        {renderEmblem()}
        <div className="text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xs sm:text-sm text-[#0f2942] tracking-tight">HIET GROUP OF INSTITUTIONS</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium truncate">Vidyanagar, Shahpur (H.P.)</p>
        </div>
      </div>
    );
  }

  // Full Brand Lockup
  return (
    <div className={`flex items-center gap-2 sm:gap-3 select-none min-w-0 ${className}`}>
      {renderEmblem()}
      <div className="text-left min-w-0">
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#0f2942] shrink-0">
            HIET GROUP OF INSTITUTIONS
          </span>
        </div>
        <p className="hidden md:block text-[11px] text-slate-500 font-medium tracking-tight truncate max-w-xs lg:max-w-md">
          Vidyanagar, Shahpur, Distt. Kangra (H.P.)
        </p>
      </div>
    </div>
  );
};
