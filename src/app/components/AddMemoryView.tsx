import exifr from "exifr";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Memory } from '../types';
import { ChevronLeft, Sun, Moon, Smile, Meh, Frown, Laugh, Calendar as CalendarIcon, MapPin, ZoomIn, ZoomOut, Camera, CloudSun, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const DisappointingIcon = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={`w-full h-full ${className}`}
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
        <path d="M7.5 8 10 9" />
        <path d="m14 9 2.5-1" />
    </svg>
);

// Helper to resize and convert File to Base64 string
const resizeFile = (file: File, maxWidth = 1920, quality = 0.8) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxWidth) {
                    width *= maxWidth / height;
                    height = maxWidth;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
});

interface AddMemoryViewProps {
  initialMemory?: Memory;
  onSave: (memory: Memory) => void;
  onCancel: () => void;
}

export function AddMemoryView({ initialMemory, onSave, onCancel }: AddMemoryViewProps) {
  // Use Date | undefined to match react-day-picker (Calendar component) type
  // Priority for image: originalImage (if available to allow re-edit) > image (cropped fallback) > null
  const [date, setDate] = useState<Date | undefined>(initialMemory ? new Date(initialMemory.date) : undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [place, setPlace] = useState(initialMemory?.place || '');
  const [mood, setMood] = useState(initialMemory?.mood || '');
  const [time, setTime] = useState<'Day' | 'Noon' | 'Night' | ''>(initialMemory?.time || '');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);

  const lastQueryAtRef = useRef(0);

  const searchPlaces = async (q: string) => {
    const query = q.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setIsSuggestOpen(false);
      return;
    }

    // respect Nominatim: max 1 req/sec
    const now = Date.now();
    const wait = Math.max(0, 1000 - (now - lastQueryAtRef.current));
    if (wait) await new Promise(r => setTimeout(r, wait));
    lastQueryAtRef.current = Date.now();

    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(query)}` +
      `&format=jsonv2&addressdetails=1&limit=6&accept-language=en`;

    const res = await fetch(url);
    if (!res.ok) return;

    const data = await res.json();
    setSuggestions(Array.isArray(data) ? data : []);
    setIsSuggestOpen(true);
  };

  // Initialize with originalImage if available, so user can edit the full photo.
  const [image, setImage] = useState<string | null>(initialMemory?.originalImage || initialMemory?.image || null);
  
  // Image Adjustment State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isWide, setIsWide] = useState(false); // To track if image is "landscape" relative to container
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const newImageFileRef = useRef<File | null>(null);

  const getDeviceLocation = () =>
  new Promise<{ lat: number; lng: number } | null>((resolve) => {
    if (!navigator.geolocation) return resolve(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });

  // Effect to handle reverse geocoding when coords change
  useEffect(() => {
    if (!coords || (place && !place.startsWith("📍"))) return;

    const reverseGeocode = async (lat: number, lng: number) => {
      try {
        const url =
          `https://api.bigdatacloud.net/data/reverse-geocode-client` +
          `?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    
        const res = await fetch(url);
        if (!res.ok) return;
    
        const data: any = await res.json();
    
        // Try best fields first
        const locality =
          data.locality || data.city || data.principalSubdivision || data.countryName;
    
        // Make it nicer: "Locality, State"
        const nice = [data.locality || data.city, data.principalSubdivision]
          .filter(Boolean)
          .join(", ");
    
        const name = nice || locality || null;
        if (name) setPlace(name);
      } catch (error) {
        console.error("Reverse geocoding failed", error);
      }
    };

    reverseGeocode(coords.lat, coords.lng);
  }, [coords, place]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsImageLoaded(false);
      newImageFileRef.current = file;
      
      // ✅ NEW: read GPS from photo (if it exists)
      try {
        const gps = await exifr.gps(file).catch(() => null);

        if (gps?.latitude && gps?.longitude) {
          setCoords({ lat: gps.latitude, lng: gps.longitude });

          // Optional: if you haven't typed location yet, put a placeholder
          if (!place) setPlace("📍 Location detected");
        } else {
          // ✅ Fallback: use the phone's current location (more reliable than EXIF on iOS web)
          const live = await getDeviceLocation();
          if (live) {
            setCoords(live);
            if (!place) setPlace("📍 Current location");
          } else {
            setCoords(null);
          }
        }
      } catch (error) {
        console.error("Error reading GPS or location:", error);
      }
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const container = containerRef.current;
    if (!container) return;

    const imgAspect = img.naturalWidth / img.naturalHeight;
    const containerAspect = container.offsetWidth / container.offsetHeight;

    setIsWide(imgAspect > containerAspect);
    setIsImageLoaded(true);
  };

  const getCroppedImage = async (): Promise<string | null> => {
    if (!imageRef.current || !containerRef.current || !image) return image;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const container = containerRef.current.getBoundingClientRect();
    const img = imageRef.current;
    
    // High resolution for retina displays
    const pixelRatio = 2; 
    canvas.width = container.width * pixelRatio;
    canvas.height = container.height * pixelRatio;

    if (!ctx) return image;

    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate 'cover' fit manually to replicate CSS object-cover
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const containerAspect = container.width / container.height;
    
    let drawWidth, drawHeight;
    
    if (imgAspect > containerAspect) {
      // Image is wider than container: Height dominates
      drawHeight = canvas.height;
      drawWidth = drawHeight * imgAspect;
    } else {
      // Image is taller than container: Width dominates
      drawWidth = canvas.width;
      drawHeight = drawWidth / imgAspect;
    }

    // Center offsets for 'cover'
    const dx = (canvas.width - drawWidth) / 2;
    const dy = (canvas.height - drawHeight) / 2;

    // User transforms
    // Translate to center for scaling
    ctx.translate(canvas.width / 2, canvas.height / 2);
    // Apply user drag offset (scaled to canvas pixels)
    ctx.translate(position.x * pixelRatio, position.y * pixelRatio);
    // Apply user scale
    ctx.scale(scale, scale);
    // Translate back
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    // Draw the image
    ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

    // Reduced quality slightly to 0.8 to save bandwidth
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleSave = async () => {
  if (isSaving) return;
  setIsSaving(true);

  try {
    if (!date || !place || !mood || !time || !image) {
      alert("Please fill in all fields and upload a photo");
      return;
    }

    const finalImage = await getCroppedImage();

    let finalOriginalImage = initialMemory?.originalImage;
    if (newImageFileRef.current) {
        // Resize original image to max 2048px to improve upload speed
        try {
            finalOriginalImage = await resizeFile(newImageFileRef.current, 2048, 0.8);
        } catch (e) {
            console.error("Image resize failed, falling back to original");
            // Fallback would require the old fileToDataUri logic, but resizeFile handles most cases.
            // If resize fails, we might just skip the original or try to send it raw?
            // For now, let's just log it.
        }
    }

    const newMemory: Memory = {
      ...(initialMemory || {}),
      id: initialMemory?.id || Date.now().toString(),
      place: place,
      date: date.toISOString(),
      mood,
      time: time as "Day" | "Noon" | "Night",
      image: finalImage || image,
      originalImage: finalOriginalImage,
      journal: initialMemory?.journal || "",
      transport: initialMemory?.transport || "",
    };

    const supabaseUrl = `https://${projectId}.supabase.co`;

    const payload = {
      title: null,
      memory_date: new Date(newMemory.date).toISOString().slice(0, 10),
      location_text: newMemory.place,
      feeling: newMemory.mood,
      time_of_day: newMemory.time,
      image: newMemory.image,
      original_image: newMemory.originalImage,
      location_lat: coords?.lat ?? null,
      location_lng: coords?.lng ?? null,
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/memories`, {
      method: "POST",
      headers: {
        apikey: publicAnonKey,
        Authorization: `Bearer ${publicAnonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const msg = await res.text();
      alert("Supabase save failed:\n" + msg);
      return;
    }

    const rows = await res.json();
    const savedRow = rows?.[0];

    onSave({
      ...newMemory,
      id: savedRow?.id ?? newMemory.id,
    });

  } catch (e: any) {
    console.error(e);
    alert("Save crashed:\n" + (e?.message ?? String(e)));
  } finally {
    setIsSaving(false);
  }
};

  const getMoodIcon = () => {
    switch (mood) {
      case 'Amazing': return <Laugh className="w-full h-full text-black" strokeWidth={1.5} />;
      case 'Not Bad': return <Smile className="w-full h-full text-black" strokeWidth={1.5} />;
      case 'Ok': return <Meh className="w-full h-full text-black" strokeWidth={1.5} />;
      case 'Bad': return <Frown className="w-full h-full text-black" strokeWidth={1.5} />;
      case 'Disappointing': return <DisappointingIcon className="text-black" />;
      default: return (
        <Smile className="w-full h-full text-black" strokeWidth={1.5} />
      );
    }
  };

  const getTimeIcon = () => {
    if (time === 'Day') return <CloudSun className="w-full h-full text-black" strokeWidth={1.5} />;
    if (time === 'Noon') return <Sun className="w-full h-full text-black" strokeWidth={1.5} />;
    if (time === 'Night') return <Moon className="w-full h-full text-black" strokeWidth={1.5} />;
    return <CloudSun className="w-full h-full text-black" strokeWidth={1.5} />;
  };

  return (
    <motion.div 
      className="absolute inset-0 w-full h-full bg-white flex flex-col font-['Roboto']"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Back Button */}
      <button 
        onClick={onCancel} 
        disabled={isSaving}
        className="absolute top-4 left-4 z-50 p-2 bg-white/50 backdrop-blur rounded-full shadow-sm disabled:opacity-50"
      >
        <ChevronLeft className="w-6 h-6 text-black" />
      </button>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row px-6 md:px-16 pt-20 md:pt-8 overflow-y-auto pb-32 md:pb-8 md:gap-12 md:items-center md:max-w-5xl md:mx-auto md:justify-center">
        
        {/* Left Column: Cover Photo (Desktop) / Top (Mobile) */}
        <div className="md:w-[400px] md:shrink-0 md:sticky md:top-8 flex flex-col items-center">
          {/* Cover Photo Container */}
          <div 
            ref={containerRef}
            className="w-full aspect-[314/501] bg-black/10 rounded-[12px] overflow-hidden relative mb-8 shadow-sm group touch-none flex items-center justify-center"
            style={{ maxWidth: '340px' }} 
        >
          {/* Inner Border */}
          <div aria-hidden="true" className="absolute border-4 border-solid border-white inset-[-4px] pointer-events-none rounded-[16px] z-20" />
          
          {image ? (
            <>
              <motion.img 
                ref={imageRef}
                src={image} 
                onLoad={handleImageLoad}
                alt="Cover" 
                className={`max-w-none cursor-grab active:cursor-grabbing ${
                    !isImageLoaded ? 'opacity-0' : 'opacity-100'
                }`}
                style={{
                    // Logic: If image is "wide" (landscape relative to container), fill height, let width overflow.
                    // If image is "tall" (portrait relative to container), fill width, let height overflow.
                    height: isWide ? '100%' : 'auto',
                    width: isWide ? 'auto' : '100%',
                }}
                drag
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  setPosition(p => ({
                    x: p.x + info.offset.x,
                    y: p.y + info.offset.y
                  }));
                }}
                animate={{ 
                  scale: scale,
                  x: position.x,
                  y: position.y
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              
              {/* Change Photo Button */}
               <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                  }}
                  className="absolute top-3 right-3 bg-black/30 backdrop-blur-md p-2 rounded-full text-white/90 hover:bg-black/50 transition-colors z-30 opacity-0 group-hover:opacity-100 duration-300"
                  title="Change Photo"
               >
                  <Camera className="w-5 h-5" />
               </button>

              {/* Zoom Controls Overlay */}
              <div 
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/4 flex items-center justify-center gap-3 bg-black/30 backdrop-blur-md rounded-full px-4 py-2 z-30 opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()} // Prevent click from triggering input
              >
                  <ZoomOut className="w-4 h-4 text-white/90" />
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.1" 
                    value={scale} 
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <ZoomIn className="w-4 h-4 text-white/90" />
              </div>
            </>
          ) : (
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
            >
                <div className="w-full text-center pointer-events-none z-20 mix-blend-difference px-4">
                    <p className="text-[24px] text-white font-normal tracking-[2.4px] leading-tight">Upload<br/>cover photo</p>
                </div>
            </div>
          )}
        </div>

        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
        />
        </div>
        {/* End Left Column */}

        {/* Right Column: Form Fields (Desktop) / Below Photo (Mobile) */}
        <div className="flex-1 md:min-w-0">
          {/* Input Fields Container with consistent gap */}
          <div className="w-full max-w-[340px] md:max-w-none mx-auto md:mx-0 flex flex-col gap-6">
            
            {/* Place/Name Input */}
            <div className="flex gap-4 items-center relative w-full border-b border-gray-100 pb-2">
                <div className="w-[24px] h-[24px] shrink-0">
                    <MapPin className="w-full h-full text-black" strokeWidth={1.5} />
                </div>
                <div className="relative flex-1">
                    <input 
                       type="text"
                       value={place}
                       onChange={(e) => {
                          const v = e.target.value;
                          setPlace(v);

                          window.clearTimeout((window as any).__placeTimer);
                          (window as any).__placeTimer = window.setTimeout(() => {
                            searchPlaces(v);
                          }, 400);
                       }}
                       onFocus={() => {
                          if (suggestions.length) setIsSuggestOpen(true);
                       }}
                       placeholder="Location Name"
                       className="w-full bg-transparent text-[16px] text-gray-600 outline-none font-['Roboto'] placeholder:text-gray-400"
                    />

                    {isSuggestOpen && suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-[38px] bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-black/5 overflow-hidden z-50">
                        {suggestions.map((s) => (
                            <button
                            key={s.place_id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-[14px] text-gray-800 hover:bg-black/5"
                            onClick={() => {
                                const lat = parseFloat(s.lat);
                                const lng = parseFloat(s.lon);

                                setPlace(s.display_name);
                                setCoords({ lat, lng });
                                setIsSuggestOpen(false);
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

            {/* Date Input */}
            <div className="flex gap-4 items-center relative w-full border-b border-gray-100 pb-2">
                <div className="w-[24px] h-[24px] shrink-0">
                    <CalendarIcon className="w-full h-full text-black" strokeWidth={1.5} />
                </div>
                <div className="relative flex-1">
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <button
                                className={`w-full text-left bg-transparent text-[16px] outline-none font-['Roboto'] cursor-pointer ${date ? 'text-gray-600' : 'text-gray-400'}`}
                            >
                                {date ? format(date, "dd/MM/yyyy") : "Select Date"}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent 
                            className="w-auto p-0 bg-white/70 backdrop-blur-2xl rounded-2xl border-none shadow-[0_0_30px_rgba(0,0,0,0.15)]" 
                            align="start"
                            side="bottom"
                            sideOffset={-40}
                            avoidCollisions={false}
                        >
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => {
                                    setDate(d);
                                    setIsCalendarOpen(false);
                                }}
                                initialFocus
                                className="bg-transparent text-black [&_th]:text-black [&_th]:font-bold p-3"
                                classNames={{
                                    day_today: "font-bold text-black"
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Mood Input */}
            <div className="flex gap-4 items-center relative w-full border-b border-gray-100 pb-2">
                 <div className="w-[24px] h-[24px] shrink-0">
                    {getMoodIcon()}
                 </div>
                 <div className="relative flex-1">
                     <Select value={mood} onValueChange={setMood}>
                        <SelectTrigger className="w-full bg-transparent border-none shadow-none focus:ring-0 p-0 h-auto text-[16px] text-gray-600 data-[placeholder]:text-gray-400 font-['Roboto'] [&>span]:line-clamp-1 [&_svg]:hidden">
                           <SelectValue placeholder="Select Feeling" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-xl border-none shadow-lg rounded-xl font-['Roboto'] text-black">
                           <SelectItem value="Amazing" className="focus:bg-gray-100 focus:text-black">Amazing</SelectItem>
                           <SelectItem value="Not Bad" className="focus:bg-gray-100 focus:text-black">Not Bad</SelectItem>
                           <SelectItem value="Ok" className="focus:bg-gray-100 focus:text-black">Ok</SelectItem>
                           <SelectItem value="Bad" className="focus:bg-gray-100 focus:text-black">Bad</SelectItem>
                           <SelectItem value="Disappointing" className="focus:bg-gray-100 focus:text-black">Disappointing</SelectItem>
                        </SelectContent>
                     </Select>
                 </div>
            </div>

            {/* Time Input */}
            <div className="flex gap-4 items-center relative w-full border-b border-gray-100 pb-2">
                <div className="w-[24px] h-[24px] shrink-0">
                    {getTimeIcon()}
                </div>
                 <div className="relative flex-1">
                     <Select value={time} onValueChange={(val) => setTime(val as any)}>
                        <SelectTrigger className="w-full bg-transparent border-none shadow-none focus:ring-0 p-0 h-auto text-[16px] text-gray-600 data-[placeholder]:text-gray-400 font-['Roboto'] [&>span]:line-clamp-1 [&_svg]:hidden">
                           <SelectValue placeholder="Select Time" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-xl border-none shadow-lg rounded-xl font-['Roboto'] text-black">
                           <SelectItem value="Day" className="focus:bg-gray-100 focus:text-black">Day</SelectItem>
                           <SelectItem value="Noon" className="focus:bg-gray-100 focus:text-black">Noon</SelectItem>
                           <SelectItem value="Night" className="focus:bg-gray-100 focus:text-black">Night</SelectItem>
                        </SelectContent>
                     </Select>
                 </div>
            </div>

            {/* Save Button */}
            <div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving || !date || !place || !mood || !time || !image}
                    className={`h-[40px] px-8 rounded-full flex items-center justify-center transition-transform ${(!date || !place || !mood || !time || !image || isSaving) ? 'bg-gray-300 cursor-not-allowed' : 'bg-black active:scale-95'}`}
                >
                    {isSaving ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span className="text-white text-[16px] font-bold tracking-[1.6px] font-['Roboto']">Saving...</span>
                        </span>
                    ) : (
                        <span className="text-white text-[16px] font-bold tracking-[1.6px] font-['Roboto']">
                            {initialMemory ? 'Update' : 'Save'}
                        </span>
                    )}
                </button>
            </div>

          </div>
        </div>
        {/* End Right Column */}

      </div>

      {/* NavBar removed from here */}
    </motion.div>
  );
}
