import React from 'react';

interface IconContainerProps {
  children: React.ReactNode;
  active?: boolean;
  size?: 'sm' | 'md';
}

export const IconContainer: React.FC<IconContainerProps> = ({ children, active, size = 'md' }) => {
  const padding = size === 'sm' ? 'p-1' : 'p-2';
  const rounded = size === 'sm' ? 'rounded-lg' : 'rounded-xl';
  return (
    <div className={`${padding} ${rounded} transition-all duration-300 ${active ? 'bg-white/20 shadow-inner' : 'bg-white shadow-sm border border-slate-100'}`}>
      {React.cloneElement(children as React.ReactElement, {
        className: `${(children as React.ReactElement).props.className} ${active ? 'text-white' : 'text-indigo-500'}`
      })}
    </div>
  );
};
