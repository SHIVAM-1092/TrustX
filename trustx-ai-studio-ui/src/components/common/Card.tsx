import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  borderCyan?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glow = false,
  borderCyan = false,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-lg bg-[#0B0F19] border ${
        borderCyan ? 'border-cyan-500/40' : 'border-slate-800/80'
      } ${
        glow ? 'shadow-lg shadow-cyan-950/20' : ''
      } transition-all duration-150 ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`p-4 border-b border-slate-800/80 flex items-center justify-between ${className}`}>
    {children}
  </div>
);

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => <div className={`p-4 ${className}`}>{children}</div>;

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`p-4 border-t border-slate-800/80 bg-slate-900/40 rounded-b-lg ${className}`}>
    {children}
  </div>
);
