/*
 * CRITICAL: GALLERY VIEW LOCKED
 * This component's visual design and behavior are LOCKED as per user request.
 * 
 * LOCKED BEHAVIORS:
 * 1. Vertical images: Full screen (object-cover), no background blur necessary.
 * 2. Horizontal images: Contained (object-contain), with a blurred background copy of the image.
 * 3. Bottom Gradient: h-32, from-black/40 via-black/10 to-transparent.
 * 4. Interactions: Swipe gestures, edit mode, solid white base layer.
 * 
 * DO NOT MODIFY VISUAL LAYOUT OR STYLING UNLESS EXPLICITLY OVERRIDDEN.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Edit3, Save, MapPin } from 'lucide-react';

interface PhotoItem {
  url: string;
  location?: string;
  caption?: string;
  lat?: number;
  lng?: number;
}

// Helper to normalize photo data since it can be string or object
const normalizePhoto = (
  photo: string | { url: string; location?: string; caption?: string; lat?: number; lng?: number }
): PhotoItem => {
  if (typeof photo === 'string') {
    return { url: photo, location: '', caption: '' };
  }
  return { 
    url: photo.url, 
    location: photo.location || '', 
    caption: photo.caption || '',
    lat: photo.lat,
    lng: photo.lng
  };
};

interface PhotosFullscreenViewProps {
  photos: (string | { url: string; location?: string; caption?: string; lat?: number; lng?: number })[];
  initialIndex: number;
  memoryLocation?: string;
  onClose: () => void;
  onUpdate: (index: number, location: string, caption: string, lat?: number, lng?: number) => void;
  getDisplayUrl?: (photo: string | { url: string; location?: string; caption?: string; lat?: number; lng?: number }) => string;
}


export function PhotosFullscreenView({ photos, initialIndex, memoryLocation = "", onClose, onUpdate, getDisplayUrl }: PhotosFullscreenViewProps) {
  <div className="absolute top-3 left-3 z-[999] px-2 py-1 rounded bg-black/60 text-white text-[12px] max-w-[80vw] truncate">
  MEM: {memoryLocation || "EMPTY"}
</div>

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isVertical, setIsVertical] = useState(false);

  // Location search state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const lastQueryAtRef = useRef(0);

  // Normalized current photo data
  const currentPhoto = normalizePhoto(photos[currentIndex]);

  const resolveDisplayUrl = (p: PhotoItem) => {
    if (getDisplayUrl) return getDisplayUrl(p);
    return p.url;
  };

  // Local state for editing fields
  const [editLocation, setEditLocation] = useState(currentPhoto.location || memoryLocation || "");
  const [editCaption, setEditCaption] = useState(currentPhoto.caption || '');
  const [editLat, setEditLat] = useState<number | undefined>(currentPhoto.lat);
  const [editLng, setEditLng] = useState<number | undefined>(currentPhoto.lng);

  // Location search function
  const searchPlaces = async (q: string) => {
    const query = q.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setIsSuggestOpen(false);
      return;
    }

    // Respect Nominatim: max 1 req/sec
    const now = Date.now();
    const wait = Math.max(0, 1000 - (now - lastQueryAtRef.current));
    if (wait) await new Promise(r => setTimeout(r, wait));
    lastQueryAtRef.current = Date.now();

    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(query)}` +
      `&format=jsonv2&addressdetails=1&limit=6&accept-language=en`;

    try {
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
      setIsSuggestOpen(true);
    } catch (error) {
      console.error("Place search failed", error);
    }
  };

  useEffect(() => {
    const p = normalizePhoto(photos[currentIndex]);
    setEditLocation(p.location || memoryLocation || "");
    setEditCaption(p.caption || "");
    setEditLat(p.lat);
    setEditLng(p.lng);
  }, [currentIndex, photos, memoryLocation]);

  // Reset local edit state when index changes
  useEffect(() => {
    const p = normalizePhoto(photos[currentIndex]);
    setEditLocation(p.location || '');
    setEditCaption(p.caption || '');
    setEditLat(p.lat);
    setEditLng(p.lng);
    setIsEditing(false);
    setSuggestions([]);
    setIsSuggestOpen(false);

    // Check orientation
    const img = new Image();
    img.src = resolveDisplayUrl(p);
    img.onload = () => {
      setIsVertical(img.height > img.width);
    };
  }, [currentIndex, photos]);

  const handleSave = () => {
    setIsEditing(false);
    setSuggestions([]);
    setIsSuggestOpen(false);
    onUpdate(currentIndex, editLocation || '', editCaption || '', editLat, editLng);
  };

  const paginate = (newDirection: number) => {
    const nextIndex = currentIndex + newDirection;
    if (nextIndex >= 0 && nextIndex < photos.length) {
      setDirection(newDirection);
      setCurrentIndex(nextIndex);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-white"  // ✅ OPAQUE WHITE MODAL (NO BLEED-THROUGH)
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <style>{`
        .apple-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .apple-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .apple-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        .apple-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>

      <div className="relative w-full h-full flex flex-col">
        {/* Back Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-50 p-2 bg-black/20 backdrop-blur-md rounded-full shadow-sm border border-white/10 hover:bg-black/40 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        {/* Image Slider */}
        <div className="flex-1 relative w-full h-full overflow-hidden flex items-center justify-center bg-white">
          {/* ✅ SOLID WHITE BASE LAYER ��� blocks underlying page completely */}
          <div className="absolute inset-0 bg-white z-0" />

          {/* Background Blur Logic */}
          {/* Mobile: Blur for horizontal images */}
          {/* Desktop: Blur for vertical images */}
          {((isVertical && window.innerWidth >= 768) || (!isVertical && window.innerWidth < 768)) && (
            <div className="absolute inset-0 z-0 overflow-hidden">
              <AnimatePresence custom={direction} mode="popLayout">
                <motion.div
                  key={currentPhoto.url + "-bg"}
                  className="absolute inset-0 will-change-opacity"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: "linear" }}
                >
                  {/* Layer 1: Blurred */}
                  <div
                    className="absolute inset-0 bg-cover bg-center will-change-transform"
                    style={{
                      backgroundImage: `url(${resolveDisplayUrl(currentPhoto)})`,
                      filter: 'blur(20px)',
                      transform: 'scale(1.1)',
                      opacity: 0.4
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);

                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1);
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1);
                }
              }}
              className="absolute z-10 w-full h-full flex items-center justify-center will-change-transform"
            >
              <img
                src={resolveDisplayUrl(currentPhoto)}
                alt={`Photo ${currentIndex + 1}`}
                className={`relative z-10 ${
                  // Mobile: vertical=cover, horizontal=contain
                  // Desktop: horizontal=cover, vertical=contain
                  (isVertical && window.innerWidth < 768) || (!isVertical && window.innerWidth >= 768)
                    ? "w-full h-full object-cover"
                    : "max-w-full max-h-full object-contain"
                }`}
                draggable={false}
                onError={() => {
                  const src = resolveDisplayUrl(currentPhoto);
                  console.log("FULLSCREEN_IMG_LOAD_ERROR", {
                    index: currentIndex,
                    currentPhoto,
                    src,
                    signedUrlExists: !!src,
                  });
                }}
              />

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dark Gradient Overlay for Text Readability */}
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-black/40 via-black/10 to-transparent z-20 pointer-events-none" />

        {/* Bottom Metadata & Controls */}
        <div className="absolute bottom-0 w-full pb-12 px-6 z-40 flex justify-center">
          <div className="w-full max-w-2xl">
          {isEditing ? (
            // EDIT MODE
            <div className="flex flex-col gap-4 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-200 shadow-lg">
              <div className="flex flex-col gap-3">
{!isEditing && memoryLocation && (
  <div className="flex items-center gap-2 text-white/90 mb-3">
    <MapPin className="w-4 h-4 text-white shrink-0 mt-0.5 drop-shadow" />
    <div className="text-[14px] font-medium truncate max-w-[75vw]">
      {memoryLocation}
    </div>
  </div>
)}

                {/* Location Input with Auto-suggest */}
                <div className="flex items-start gap-2 text-white relative">
                  <MapPin className="w-4 h-4 text-white shrink-0 mt-0.5 drop-shadow" />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditLocation(v);

                        window.clearTimeout((window as any).__photoPlaceTimer);
                        (window as any).__photoPlaceTimer = window.setTimeout(() => {
                          searchPlaces(v);
                        }, 400);
                      }}
                      onFocus={() => {
                        if (suggestions.length) setIsSuggestOpen(true);
                      }}
                      className="bg-transparent border-b border-white/30 focus:border-white outline-none text-[length:var(--text-h4)] font-bold text-white w-full placeholder-white/50 py-1"
                      placeholder="Add location"
                      autoFocus
                    />

                    {/* Suggestions Dropdown */}
                    {isSuggestOpen && suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-[38px] bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-black/5 overflow-hidden z-50 max-h-[200px] overflow-y-auto">
                        {suggestions.map((s) => (
                          <button
                            key={s.place_id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-[14px] text-gray-800 hover:bg-black/5"
                            onClick={() => {
                              const lat = parseFloat(s.lat);
                              const lng = parseFloat(s.lon);

                              setEditLocation(s.display_name);
                              setEditLat(lat);
                              setEditLng(lng);
                              setIsSuggestOpen(false);
                              setSuggestions([]);
                            }}
                          >
                            {s.display_name}
                          </button>
                        ))}

                        <div className="px-3 py-2 text-[11px] text-gray-400">
                          © OpenStreetMap contributors
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Caption Input */}
                <div className="pl-[24px]">
                  <textarea
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    className="bg-transparent border-b border-white/30 focus:border-white outline-none text-[length:var(--text-base)] text-white/90 w-full placeholder-white/50 resize-none min-h-[60px] py-1 apple-scrollbar"
                    placeholder="Write a caption..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:scale-105 transition-transform active:scale-95 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          ) : (
            // VIEW MODE - Cleaner, more elegant
            <div className="flex flex-col gap-3 group max-w-2xl mx-auto">
              {/* Location & Caption Container */}
              {(currentPhoto.location || currentPhoto.caption) && (
                <div className="bg-black/40 backdrop-blur-lg rounded-2xl px-5 py-4 border border-white/10 max-w-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      {/* Location */}
                      {currentPhoto.location && (
                        <div className="flex items-start gap-2.5 text-white">
                          <MapPin className="w-4 h-4 text-white shrink-0 mt-0.5 drop-shadow" />
                          <span className="text-base font-semibold text-white drop-shadow leading-snug">
                            {currentPhoto.location}
                          </span>
                        </div>
                      )}

                      {/* Caption */}
                      {currentPhoto.caption && (
                        <p className={`text-sm text-white/90 drop-shadow leading-relaxed whitespace-pre-wrap break-words ${currentPhoto.location ? 'pl-[26px]' : ''}`}>
                          {currentPhoto.caption}
                        </p>
                      )}
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Empty state with edit button */}
              {!currentPhoto.location && !currentPhoto.caption && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 bg-black/40 hover:bg-black/50 backdrop-blur-lg text-white px-5 py-3 rounded-full text-sm font-medium transition-all border border-white/10"
                  >
                    <Edit3 className="w-4 h-4" />
                    Add location & caption
                  </button>
                </div>
              )}

              {/* Pagination Dots */}
              {photos.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-1">
                  {photos.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-white shadow-lg' : 'w-1.5 bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
