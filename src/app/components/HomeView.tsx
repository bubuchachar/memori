import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Memory } from '../types';
import { Logo } from './Logo';
import { MemoryCard } from './MemoryCard';
import { NavBar } from './NavBar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface HomeViewProps {
  memories: Memory[];
  onSelectMemory: (id: string) => void;
  onCreateMemory: () => void;
  onDeleteMemory?: (id: string) => void;
  enteringFromId?: string | null;
  selectedId?: string | null;
}

export function HomeView({ memories, onSelectMemory, onCreateMemory, onDeleteMemory, enteringFromId, selectedId }: HomeViewProps) {
  const [memoryToDelete, setMemoryToDelete] = React.useState<string | null>(null);
  
  // Sort memories by date (Oldest First)
  // We use useMemo to avoid re-sorting on every render unless memories change
  const sortedMemories = React.useMemo(() => {
    return [...memories].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB; // Ascending order (Oldest first)
    });
  }, [memories]);

  const isEmpty = sortedMemories.length === 0;
  
  // Mobile Grid Logic (Preserved): < 3 items = List, >= 3 items = Grid
  const isMobileGrid = sortedMemories.length >= 3;

  const handleCardClick = (id: string) => {
    onSelectMemory(id);
  };

  const handleDeleteClick = (id: string) => {
    setMemoryToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (memoryToDelete && onDeleteMemory) {
      onDeleteMemory(memoryToDelete);
    }
    setMemoryToDelete(null);
  };

  // Scroll only if we have more than 6 memories (as requested)
  const shouldDesktopScroll = sortedMemories.length > 6;

  // Function to generate organic rotation/offsets for desktop
  // More random, natural scatter pattern
  const getOrganicStyles = (index: number) => {
      // Use index to create pseudo-random but consistent values
      const seed1 = (index * 37) % 100;
      const seed2 = (index * 73) % 100;
      const seed3 = (index * 101) % 100;
      
      // Rotation: -12 to +12 degrees
      const rotation = ((seed1 / 100) * 24) - 12;
      
      // Vertical offset: -80 to +50 (more variety, generally higher)
      const offsetY = ((seed2 / 100) * 130) - 80;
      
      // Slight horizontal nudge for overlap variation: -20 to +20
      const offsetX = ((seed3 / 100) * 40) - 20;

      return { rotation, offsetY, offsetX };
  };

  // Calculate exit variants for cards (preserved for mobile)
  const getCardExitVariant = (memoryId: string, index: number) => {
    if (!selectedId) return { opacity: 0, scale: 0.95, transition: { duration: 0.25 } };

    if (memoryId === selectedId) {
        return { 
            opacity: 1, 
            zIndex: 50,
            transition: { duration: 0.3 }
        };
    }

    const isLeft = index % 2 === 0;
    const xOffset = isLeft ? -120 : 120;
    const yOffset = index * 10;
    
    return {
        x: xOffset,
        y: yOffset,
        opacity: 0,
        transition: { duration: 0.25, ease: "easeInOut" }
    };
  };

  return (
    <motion.div 
      className="absolute inset-0 w-full h-full z-10"
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Logo wrapper with added top padding for desktop only */}
        <motion.div 
            className="md:pt-10"
            variants={{ exit: { opacity: 0, transition: { duration: 0.2 } } }}
        >
            <Logo />
        </motion.div>

        <div className="flex-1 w-full h-full relative">
          <AnimatePresence mode="wait">
            {isEmpty ? (
              <motion.div 
                key="empty-state"
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-32"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center px-10 flex flex-col items-center gap-6 max-w-md">
                    <h2 className="text-xl md:text-2xl text-white font-[var(--font-family-roboto)] font-light leading-relaxed italic opacity-90">
                        "A photo is what the eye sees,<br/>a journal is where the <br/>memory grows."
                    </h2>
                    <p className="text-xs text-white/60 font-[var(--font-family-roboto)] uppercase tracking-[0.2em] font-medium">
                        Add your memories
                    </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="content-state"
                className="absolute inset-0 w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* --- MOBILE LAYOUT (STRICTLY PRESERVED) --- */}
                {/* 
                    This block is hidden on Desktop (md:hidden).
                    It contains ONLY the mobile layout logic (Vertical Scroll, Grid/List).
                    No desktop classes are mixed here to ensure safety.
                */}
                <div className="block md:hidden w-full h-full overflow-y-auto overflow-x-hidden pt-8 px-6 pb-32 sm:px-8">
                    <div className={`
                        w-full
                        ${isMobileGrid 
                            ? 'grid grid-cols-2 gap-x-4 gap-y-8' 
                            : 'flex flex-col items-center gap-8'}
                    `}>
                        {sortedMemories.map((memory, index) => {
                            const isEntering = enteringFromId && memory.id === enteringFromId;
                            return (
                                <motion.div 
                                    key={`mobile-${memory.id}`}
                                    layoutId={`card-container-${memory.id}`}
                                    className={`${isMobileGrid ? "w-full" : "w-[48%] max-w-[220px]"}`}
                                    initial={isEntering ? { opacity: 0 } : { opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0, x: 0 }}
                                    exit={getCardExitVariant(memory.id, index)}
                                    transition={{ 
                                        duration: 0.3, 
                                        delay: (enteringFromId ? 0 : index * 0.05),
                                        ease: "easeInOut" 
                                    }}
                                    style={{ zIndex: memory.id === selectedId ? 50 : 1 }}
                                >
                                    <MemoryCard 
                                        memory={memory} 
                                        index={index} 
                                        onClick={handleCardClick}
                                        onDelete={handleDeleteClick}
                                    />
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* --- DESKTOP LAYOUT (NEW ORGANIC SCATTER ROW) --- */}
                {/* 
                    This block is hidden on Mobile (hidden md:flex).
                    Features:
                    1. Single Row (flex-row)
                    2. Horizontal Scroll ONLY if > 4 items.
                    3. Centered if <= 4 items.
                    4. Organic scatter via negative margins and transforms.
                */}
                <div className={`
                    hidden md:flex h-full w-full
                    overflow-y-hidden 
                    items-center 
                    px-20 py-8
                    ${shouldDesktopScroll ? 'overflow-x-auto justify-start' : 'overflow-x-hidden justify-center'}
                `}>
                    {sortedMemories.map((memory, index) => {
                        const isEntering = enteringFromId && memory.id === enteringFromId;
                        const { rotation, offsetY, offsetX } = getOrganicStyles(index);
                        
                        // Calculate base z-index
                        const baseZIndex = memory.id === selectedId ? 50 : 10 + index;
                        
                        // Overlap amount: negative margin for all except first
                        const marginLeft = index === 0 ? 0 : -60; 

                        return (
                            <motion.div
                                key={`desktop-${memory.id}`}
                                layoutId={`card-container-${memory.id}`}
                                className="w-[240px] lg:w-[280px] shrink-0"
                                initial={isEntering ? { opacity: 0 } : { opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ 
                                    scale: 1.05, 
                                    zIndex: 100,
                                    transition: { duration: 0.2 }
                                }}
                                transition={{ 
                                    duration: 0.3, 
                                    delay: (enteringFromId ? 0 : index * 0.05),
                                    ease: "easeInOut" 
                                }}
                                style={{ 
                                    zIndex: baseZIndex,
                                    marginLeft: index === 0 ? 0 : marginLeft + offsetX, // Add horizontal variation
                                    marginTop: offsetY, // Apply vertical scatter
                                    rotate: `${rotation}deg` // Apply rotation
                                }}
                            >
                                <MemoryCard 
                                    memory={memory} 
                                    index={index} 
                                    onClick={handleCardClick}
                                    onDelete={handleDeleteClick}
                                    rotation={rotation}
                                />
                            </motion.div>
                        );
                    })}
                    {/* Add spacer at end for scrolling padding if scrolling */}
                    {shouldDesktopScroll && <div className="w-16 shrink-0" />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <NavBar 
          mode="plusOnly" 
          showAdd={true} 
          onAdd={onCreateMemory} 
          variant="dark" 
      />

      <AlertDialog open={!!memoryToDelete} onOpenChange={(open) => !open && setMemoryToDelete(null)}>
        <AlertDialogContent className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[24px] max-w-[320px] sm:max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black font-bold text-xl font-['Roboto',sans-serif]">Delete Memory?</AlertDialogTitle>
            <AlertDialogDescription className="text-black/60 font-medium font-['Roboto',sans-serif]">
              This action cannot be undone. Are you sure you want to delete this memory?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-full border-black/10 text-black hover:bg-black/5 hover:text-black font-['Roboto',sans-serif]">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="rounded-full bg-red-500 hover:bg-red-600 text-white border-none shadow-lg shadow-red-500/20 font-['Roboto',sans-serif]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
