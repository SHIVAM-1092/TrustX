import React from 'react';

export type BadgeVariant = 'cyan' | 'green' | 'amber' | 'red' | 'purple' | 'slate' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
  dot = false
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dotColor: string }> = {
    cyan: {
      bg: 'bg-cyan-950/60',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      dotColor: 'bg-cyan-400'
    },
    green: {
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dotColor: 'bg-emerald-400'
    },
    amber: {
      bg: 'bg-amber-950/60',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dotColor: 'bg-amber-400'
    },
    red: {
      bg: 'bg-rose-950/60',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      dotColor: 'bg-rose-400'
    },
    purple: {
      bg: 'bg-purple-950/60',
      text: 'text-purple-300',
      border: 'border-purple-500/30',
      dotColor: 'bg-purple-400'
    },
    slate: {
      bg: 'bg-slate-800/80',
      text: 'text-slate-300',
      border: 'border-slate-700/60',
      dotColor: 'bg-slate-400'
    },
    outline: {
      bg: 'bg-transparent',
      text: 'text-slate-400',
      border: 'border-slate-700',
      dotColor: 'bg-slate-500'
    }
  };

  const style = variantStyles[variant];
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs tracking-wider';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase font-semibold rounded-md border ${style.bg} ${style.text} ${style.border} ${sizeStyles} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor} animate-pulse`} />}
      {children}
    </span>
  );
};
