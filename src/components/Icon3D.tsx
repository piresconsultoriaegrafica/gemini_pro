import React from 'react';

export const Icon3D = ({ name, size = 24, active = false, className = "" }: { name: string; size?: number; active?: boolean; className?: string }) => (
  <img 
    src={`https://img.icons8.com/fluency/${size}/000000/${name}.png`} 
    alt={name}
    className={`transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'} ${className}`}
    style={{ width: size, height: size }}
    referrerPolicy="no-referrer"
  />
);
