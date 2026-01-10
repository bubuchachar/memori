import React from 'react';
import { motion } from 'motion/react';
import { Plus, PenLine, UtensilsCrossed, Plane, Image as ImageIcon } from 'lucide-react';

interface NavBarProps {
  onAdd?: () => void;
  showAdd?: boolean;
  onSectionClick?: (section: 'journal' | 'transport' | 'photos' | 'food') => void;
  activeSection?: string | null;
  noShadow?: boolean;
  disabled?: boolean;
  plusDisabled?: boolean;
  variant?: 'light' | 'dark';
  mode?: 'full' | 'plusOnly';
}

export function NavBar({ 
  onAdd, 
  showAdd = true, 
  onSectionClick, 
  activeSection, 
  noShadow = false, 
  disabled = false, 
  plusDisabled = false,
  variant = 'light',
  mode = 'full'
}: NavBarProps) {
  const isDark = variant === 'dark';
  const isPlusOnly = mode === 'plusOnly';
  
  // Styles based on variant
  const lensBgClass = disabled 
    ? (isDark ? 'bg-white/5 opacity-50' : 'bg-black/5 opacity-50')
    : (isDark ? 'bg-[#F2F2F2]/20 backdrop-blur-xl border border-white/10' : 'bg-black/5 backdrop-blur-sm');
    
  const iconColor = isDark ? 'white' : 'black';

  // Determine container width based on mode
  const containerWidth = isPlusOnly ? 'w-[60px]' : 'w-[370px]';

  // Plus button styling
  const getPlusButtonClasses = () => {
    // Added overflow-hidden to clip the internal sheen layers
    const baseClasses = "w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all pointer-events-auto overflow-hidden";
    const positioning = isPlusOnly ? "relative" : "absolute right-0 top-0";
    
    if (disabled || plusDisabled) {
      return `${baseClasses} ${positioning} bg-black/20 cursor-default opacity-50`;
    }

    if (isPlusOnly) {
      // Glass styling for plusOnly mode with complex shadow (drop shadow + inner glow)
      return `${baseClasses} ${positioning} bg-white/18 backdrop-blur-2xl border border-white/25 shadow-[0_10px_30px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-white/22 hover:border-white/35`;
    }
    
    // Default solid styling
    return `${baseClasses} ${positioning} bg-black hover:bg-black/90 ${noShadow ? '' : 'shadow-lg'}`;
  };

  const IconWrapper = ({ 
    active, 
    disabled, 
    onClick, 
    children 
  }: { 
    active: boolean; 
    disabled: boolean; 
    onClick: () => void; 
    children: React.ReactNode 
  }) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`relative w-9 h-9 flex items-center justify-center transition-all ${disabled ? 'cursor-default' : (active ? 'opacity-100 scale-110' : 'opacity-80 hover:opacity-100')}`}
    >
      {children}
    </button>
  );

  return (
    <div className={`absolute bottom-[20px] md:bottom-[40px] left-1/2 -translate-x-1/2 ${containerWidth} h-[60px] pointer-events-none z-50 flex items-center justify-center`}>
      {/* The background pill for icons - ONLY render in full mode */}
      {!isPlusOnly && (
        <div className={`absolute inset-y-0 left-0 right-[20.27%] rounded-[50px] pointer-events-auto flex items-center justify-around px-4 transition-colors ${lensBgClass}`}>
          
          <IconWrapper 
            active={activeSection === 'journal'} 
            disabled={disabled}
            onClick={() => !disabled && onSectionClick?.('journal')}
          >
            <PenLine className="w-6 h-6" color={iconColor} strokeWidth={1.5} />
          </IconWrapper>

          <IconWrapper 
            active={activeSection === 'transport'} 
            disabled={disabled}
            onClick={() => !disabled && onSectionClick?.('transport')}
          >
            <Plane className="w-6 h-6" color={iconColor} strokeWidth={1.5} />
          </IconWrapper>

          <IconWrapper 
            active={activeSection === 'photos'} 
            disabled={disabled}
            onClick={() => !disabled && onSectionClick?.('photos')}
          >
            <ImageIcon className="w-6 h-6" color={iconColor} strokeWidth={1.5} />
          </IconWrapper>

          <IconWrapper 
            active={activeSection === 'food'} 
            disabled={disabled}
            onClick={() => !disabled && onSectionClick?.('food')}
          >
            <UtensilsCrossed className="w-6 h-6" color={iconColor} strokeWidth={1.5} />
          </IconWrapper>
        </div>
      )}

      {/* The Plus Button */}
      {showAdd && (
        <motion.button 
          whileTap={(disabled || plusDisabled) ? undefined : { scale: 0.95 }}
          onClick={() => !(disabled || plusDisabled) && onAdd?.()}
          disabled={disabled || plusDisabled}
          className={getPlusButtonClasses()}
        >
          {/* iOS-style Sheen & Glow Layers - only for plusOnly mode */}
          {isPlusOnly && !(disabled || plusDisabled) && (
            <>
              {/* Highlight Sheen: top-left gradient blob */}
              <div className="absolute -top-2 -left-2 w-[70%] h-[70%] rounded-full bg-white/25 blur-md opacity-70 pointer-events-none" />
              
              {/* Specular Ring: subtle inner edge light */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none" 
                style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10)' }} 
              />
            </>
          )}

          <Plus className="text-white w-8 h-8 relative z-10" strokeWidth={2.5} />
        </motion.button>
      )}
    </div>
  );
}
