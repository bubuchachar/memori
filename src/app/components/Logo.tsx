import React from 'react';

interface LogoProps {
  variant?: 'black' | 'white';
}

export function Logo({ variant = 'white' }: LogoProps) {
  return (
    <div className="w-full flex justify-center py-8">
      <div className={`text-[24px] font-bold tracking-[0.2em] uppercase ${variant === 'white' ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'var(--font-family-roboto)' }}>
        KOMOREBI
      </div>
    </div>
  );
}
