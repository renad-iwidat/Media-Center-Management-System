import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';
import './Select.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-[#7BA5C1] text-white hover:bg-[#6B95B1] shadow-lg shadow-[#7BA5C1]/30',
      secondary: 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/20',
      ghost: 'bg-transparent text-gray-400 hover:bg-white/5',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none outline-none focus:ring-2 focus:ring-[#7BA5C1]/50',
          variants[variant],
          className
        )}
        disabled={props.disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-sm font-medium text-slate-700 px-1">{label}</label>}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
            error && 'border-red-500/50 focus:border-red-500/50',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-500 px-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-sm font-medium text-slate-700 px-1">{label}</label>}
        <select
          ref={ref}
          className={cn(
            'custom-select w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none transition-all focus:border-blue-500/50 appearance-none cursor-pointer shadow-sm',
            error && 'border-red-500/50 focus:border-red-500/50',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option 
              key={opt.value} 
              value={opt.value}
              className="bg-white text-slate-900"
            >
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-red-500 px-1">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-sm font-medium text-slate-700 px-1">{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500/50 focus:bg-white min-h-[120px] resize-none',
            error && 'border-red-500/50 focus:border-red-500/50',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-500 px-1">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
