import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs ${
        hoverEffect ? 'hover:shadow-md hover:border-slate-300 transition-all duration-200' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, className = '' }) => (
  <div className={`p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 ${className}`}>
    <div>
      {title && <h3 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">{title}</h3>}
      {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-5 sm:p-6 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 rounded-b-2xl ${className}`}>
    {children}
  </div>
);

export default Card;
