import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  error?: string;
  helperText?: string;
  showRules?: boolean;
  containerClassName?: string;
}

export function PasswordRules({ className }: { className?: string }) {
  return (
    <div className={`text-[11px] text-slate-500 space-y-0.5 mt-1.5 ${className ?? ''}`}>
      <p className="font-semibold text-slate-600 dark:text-slate-400">Password must contain:</p>
      <ul className="list-disc list-inside space-y-0.5 pl-1 text-[10px] text-slate-500 dark:text-slate-400">
        <li>At least 8 characters</li>
        <li>One uppercase letter</li>
        <li>One lowercase letter</li>
        <li>One number</li>
        <li>One special character</li>
      </ul>
    </div>
  );
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  labelClassName,
  error,
  helperText,
  showRules = false,
  containerClassName = '',
  className = '',
  id,
  disabled,
  autoComplete,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Default institutional styling matching HIET Digital Campus design
  const defaultClass = "w-full pl-3.5 pr-12 py-2.5 rounded-xl border border-slate-300 dark:border-[#3a3a3a] bg-white dark:bg-[#181818] text-slate-900 dark:text-[#f5f5f5] text-xs focus:border-[#0f2942] dark:focus:border-[#d4d4d4] focus:ring-1 focus:ring-[#0f2942] dark:focus:ring-[#d4d4d4] focus:outline-hidden placeholder:text-slate-400 dark:placeholder:text-[#858585] transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:disabled:bg-[#151515]";

  // Ensure right padding of pr-12 is preserved so text never overlaps eye toggle button
  const finalInputClass = className
    ? `${className} pr-12`
    : defaultClass;

  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className={labelClassName || "block text-xs font-bold text-slate-700 dark:text-[#d4d4d4] mb-1.5"}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete ?? 'current-password'}
          disabled={disabled}
          className={finalInputClass}
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword(prev => !prev)}
          disabled={disabled}
          tabIndex={0}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-[#858585] dark:hover:text-[#f5f5f5] hover:bg-slate-100 dark:hover:bg-[#282828] transition-colors focus:outline-hidden focus:ring-1 focus:ring-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label={showPassword ? "Hide password" : "Show password"}
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{helperText}</p>
      )}

      {showRules && <PasswordRules />}
    </div>
  );
};

export default PasswordInput;
