import React from 'react';
import { motion } from 'motion/react';
import { Memory } from '../types';
import { format } from 'date-fns';
import { X } from 'lucide-react';

interface MemoryCardProps {
  memory: Memory;
  index: number;
  onClick: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function MemoryCard({ memory, index, onClick, onDelete }: MemoryCardProps) {
  // Calculate rotation to create an organic, alternating pattern
  const row = Math.floor(index / 2);
  const isEvenRow = row % 2 === 0;
  const baseRotation = index % 2 === 0 ? -3 : 3;
  const rotation = isEvenRow ? baseRotation : -baseRotation;

  const yOffset = index % 2 === 0 ? 0 : 20; // Slight vertical offset for organic feel

  return (
    <div
      className="relative w-full aspect-[3/4] cursor-pointer group"
      onClick={() => onClick(memory.id)}
    >
      <motion.div
        className="w-full h-full relative"
        initial={{ rotate: rotation, y: yOffset }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <motion.div
          layoutId={`card-frame-${memory.id}`}
          className="absolute inset-0 bg-white rounded-[12px] p-1 shadow-xl"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="relative w-full h-full overflow-hidden rounded-[8px]">
            <motion.img
              layoutId={`memory-image-${memory.id}`}
              src={memory.image}
              alt={memory.place}
              className="w-full h-full object-cover"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

            {/* Delete Button - Glass Orb Style */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(memory.id);
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center 
                           bg-white/20 backdrop-blur-md border border-white/30 
                           shadow-[0_4px_12px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.35)] 
                           hover:bg-white/30 hover:border-white/40 hover:scale-105 transition-all
                           opacity-0 group-hover:opacity-100
                           z-20 cursor-pointer"
                aria-label="Delete memory"
              >
                 {/* Sheen layers */}
                 <div className="absolute -top-1 -left-1 w-[70%] h-[70%] rounded-full bg-white/25 blur-[2px] opacity-70 pointer-events-none" />
                 <div 
                   className="absolute inset-0 rounded-full pointer-events-none" 
                   style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10)' }} 
                 />
                 <X className="text-white w-4 h-4 relative z-10" strokeWidth={2.5} />
              </button>
            )}

            <motion.div className="absolute bottom-0 left-0 right-0 p-4 sm:p-3 text-white">
              <h3 className="font-bold text-base sm:text-sm leading-tight drop-shadow-md line-clamp-2">
                {memory.place}
              </h3>
              <p className="text-sm sm:text-xs opacity-90 drop-shadow-md">
                {format(new Date(memory.date), 'dd.MM.yyyy')}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
