import React from 'react';
import { HietCollegeLogo } from './HietCollegeLogo';

/**
 * SplashScreen – displayed briefly on app launch before the main UI loads.
 * It provides a clean, branded loading experience for mobile-first users.
 */
export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#f4f6fa] dark:bg-[#0a0a0a] z-50">
      {/* Logo centered */}
      <div className="flex flex-col items-center space-y-4">
        <HietCollegeLogo className="w-24 h-24" />
        <p className="text-sm font-semibold text-[#0f2942] dark:text-[#f5f5f5] animate-pulse">
          Loading HIET Digital Campus...
        </p>
      </div>
    </div>
  );
};
