// DetailView.tsx
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDrag, useDrop } from "react-dnd";
import { Memory } from "../types";
import { format } from "date-fns";
import exifr from "exifr";
import {
  Calendar,
  Smile,
  Moon,
  Sun,
  ChevronLeft,
  X,
  Link as LinkIcon,
  MapPin,
  Meh,
  Frown,
  Laugh,
  Edit3,
  Save,
  GripVertical,
  Footprints,
  Train,
  Bus,
  Car,
  Plane,
  Ship,
  ArrowRight,
  CloudSun,
  Trash2,
  Plus,
} from "lucide-react";
import { TransportData } from "../types";
import { PhotosFullscreenView } from "./PhotosFullscreenView";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

/**
 * ✅ Key idea:
 * - We STORE photos as objects like { url: "memori/uuid.jpg", location:"", caption:"" }
 *   OR legacy { url: "https://.../storage/v1/object/public/photos/memori/uuid.jpg" }
 * - We DISPLAY using SIGNED URLs (because your bucket is private)
 */

type PhotoItem =
  | string
  | {
      url: string; // can be a path like "memori/xxx.jpg" OR a full URL
      location?: string;
      caption?: string;
    };

const supabaseUrl = `https://${projectId}.supabase.co`;

const safeUUID = () => {
  // iOS/Safari sometimes hates randomUUID on older versions
  // so we fall back safely
  // @ts-ignore
  if (globalThis?.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getAccessToken = () => localStorage.getItem("sb_access_token") || "";

/** Extract a storage PATH from a Supabase storage URL if possible */
function extractPathFromSupabaseUrl(maybeUrl: string): string | null {
  if (!maybeUrl) return null;

  // If it already looks like a path (no http), treat as path
  if (!maybeUrl.startsWith("http")) return maybeUrl;

  // Only try to parse Supabase storage URLs
  if (!maybeUrl.includes(".supabase.co/storage/v1/object")) return null;

  // Examples we might see:
  // https://xxx.supabase.co/storage/v1/object/public/photos/memori/abc.jpg
  // https://xxx.supabase.co/storage/v1/object/photos/memori/abc.jpg
  // https://xxx.supabase.co/storage/v1/object/sign/photos/memori/abc.jpg?token=...
  const idx = maybeUrl.indexOf("/photos/");
  if (idx === -1) return null;

  const after = maybeUrl.slice(idx + "/photos/".length);
  const pathOnly = after.split("?")[0]; // strip query
  return pathOnly || null;
}

/** Normalize whatever we stored into either:
 *  - a SUPABASE path (best for signing)
 *  - or an external URL (use directly)
 */
function normalizeStoredPhotoToPathOrUrl(photo: PhotoItem): { kind: "path" | "url"; value: string } {
  if (typeof photo === "string") {
    // legacy: could be objectURL, full url, or path
    const maybePath = extractPathFromSupabaseUrl(photo);
    if (maybePath) return { kind: "path", value: maybePath };
    if (photo.startsWith("http")) return { kind: "url", value: photo };
    return { kind: "path", value: photo };
  }

  const raw = photo.url || "";
  const maybePath = extractPathFromSupabaseUrl(raw);
  if (maybePath) return { kind: "path", value: maybePath };
  if (raw.startsWith("http")) return { kind: "url", value: raw };
  return { kind: "path", value: raw };
}

async function signPhotoPath(path: string): Promise<string> {
  const token = getAccessToken();
  if (!token) throw new Error("No token found. Sign in again.");

  const res = await fetch(`${supabaseUrl}/storage/v1/object/sign/photos/${path}`, {
    method: "POST",
    headers: {
      apikey: publicAnonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: 60 * 60 }), // 1 hour
  });

if (!res.ok) throw new Error(await res.text());

const data = await res.json();

const signed = data.signedURL || data.signedUrl || data.signed_url;

if (!signed) {
  throw new Error("Sign endpoint returned no signed URL: " + JSON.stringify(data));
}

// ✅ normalize to a REAL, loadable URL
let signedFullUrl = "";

if (typeof signed === "string" && signed.startsWith("http")) {
  signedFullUrl = signed;
} else if (typeof signed === "string" && signed.startsWith("/storage/")) {
  // already includes /storage/v1...
  signedFullUrl = `${supabaseUrl}${signed}`;
} else if (typeof signed === "string" && signed.startsWith("/object/")) {
  // missing /storage/v1...
  signedFullUrl = `${supabaseUrl}/storage/v1${signed}`;
} else {
  // fallback (rare)
  signedFullUrl = `${supabaseUrl}${signed}`;
}

return signedFullUrl;
}

async function uploadPhotoToStorage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${safeUUID()}.${ext}`;
  const path = `memori/${fileName}`;

  const token = getAccessToken();
  if (!token) throw new Error("No token found. Sign-in didn't store it.");

  const res = await fetch(`${supabaseUrl}/storage/v1/object/photos/${path}`, {
    method: "POST",
    headers: {
      apikey: publicAnonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!res.ok) throw new Error(await res.text());

  // ✅ return PATH ONLY (so it survives refresh + works across devices)
  return path;
}

// DisappointingIcon Component
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

const getMoodIcon = (mood: string) => {
  switch (mood) {
    case "Amazing":
      return <Laugh className="w-5 h-5 text-black" />;
    case "Not Bad":
      return <Smile className="w-5 h-5 text-black" />;
    case "Ok":
      return <Meh className="w-5 h-5 text-black" />;
    case "Bad":
      return <Frown className="w-5 h-5 text-black" />;
    case "Disappointing":
      return (
        <div className="w-5 h-5 text-black">
          <DisappointingIcon />
        </div>
      );
    default:
      return <Smile className="w-5 h-5 text-black" />;
  }
};

// Helper for Plus Icon
function PlusIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-400"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

const SortableSection = React.forwardRef<
  HTMLDivElement,
  {
    id: string;
    index: number;
    moveSection: (dragIndex: number, hoverIndex: number) => void;
    children: (dragRef: any) => React.ReactNode;
  }
>(({ id, index, moveSection, children }, externalRef) => {
  const internalRef = useRef<HTMLDivElement>(null);

  React.useImperativeHandle(externalRef, () => internalRef.current as HTMLDivElement);

  const [{ handlerId }, drop] = useDrop({
    accept: "SECTION",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor) {
      if (!internalRef.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = internalRef.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as any).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveSection(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: "SECTION",
    item: () => ({ id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  preview(drop(internalRef));

  return (
    <motion.div
      ref={internalRef}
      layout
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className={`will-change-transform transition-opacity ${
        isDragging ? "opacity-50" : ""
      } border-b border-gray-100 pb-8 mb-8 last:border-0 last:pb-0 last:mb-0`}
      data-handler-id={handlerId}
    >
      {children(drag)}
    </motion.div>
  );
});

const SortableTransportCard = ({
  item,
  index,
  moveItem,
  updateItem,
  deleteItem,
}: {
  item: TransportData;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  updateItem: (updates: Partial<TransportData>) => void;
  deleteItem: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // Location autocomplete state
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);
  const [fromSuggestOpen, setFromSuggestOpen] = useState(false);
  const [toSuggestOpen, setToSuggestOpen] = useState(false);
  const lastQueryTimeRef = useRef(0);

  // Location search function
  const searchPlaces = async (query: string, setResults: (results: any[]) => void) => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }

    // Rate limit: max 1 req/sec for Nominatim
    const now = Date.now();
    const wait = Math.max(0, 1000 - (now - lastQueryTimeRef.current));
    if (wait) await new Promise(r => setTimeout(r, wait));
    lastQueryTimeRef.current = Date.now();

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&addressdetails=1&limit=5&accept-language=en`;

    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Location search failed", error);
    }
  };

  const [{ handlerId }, drop] = useDrop({
    accept: "transport-card",
    collect(monitor) {
      return { handlerId: monitor.getHandlerId() };
    },
    hover(dragItem: any, monitor) {
      if (!ref.current) return;
      const dragIndex = dragItem.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as any).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveItem(dragIndex, hoverIndex);
      dragItem.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "transport-card",
    item: () => ({ id: item.id, index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={`relative bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 transition-opacity ${
        isDragging ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="cursor-grab active:cursor-grabbing p-1 -ml-2 text-gray-300 hover:text-gray-500 rounded">
            <GripVertical className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Segment {index + 1}
          </span>
        </div>
        <button
          onClick={deleteItem}
          className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Type Selector */}
      <div className="grid grid-cols-6 gap-1 mb-4">
        {(["Walk", "Train", "Bus", "Taxi", "Plane", "Ferry"] as const).map((type) => {
          const TypeIcon =
            {
              Walk: Footprints,
              Train: Train,
              Bus: Bus,
              Taxi: Car,
              Plane: Plane,
              Ferry: Ship,
            }[type] || MapPin;

          const isSelected = (item as any).type === type;

          return (
            <button
              key={type}
              onClick={() => updateItem({ type } as any)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                isSelected ? "bg-black text-white shadow-sm" : "hover:bg-gray-100 text-gray-400"
              }`}
              title={type}
            >
              <TypeIcon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* From / To Inputs with Autocomplete */}
      <div className="flex items-center gap-2 mb-3">
        {/* FROM field */}
        <div className="flex-1 min-w-0 relative">
          <input
            className="w-full bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 text-[length:var(--text-base)] outline-none focus:border-gray-300 focus:bg-white transition-colors placeholder:text-gray-400"
            placeholder="From"
            value={(item as any).from || ""}
            onChange={(e) => {
              const v = e.target.value;
              updateItem({ from: v } as any);
              
              window.clearTimeout((window as any).__fromTimer);
              (window as any).__fromTimer = window.setTimeout(() => {
                searchPlaces(v, setFromSuggestions);
                if (v.length >= 3) setFromSuggestOpen(true);
              }, 400);
            }}
            onFocus={() => {
              if (fromSuggestions.length) setFromSuggestOpen(true);
            }}
            onBlur={() => {
              // Delay to allow click on suggestion
              setTimeout(() => setFromSuggestOpen(false), 200);
            }}
          />
          
          {/* FROM Suggestions Dropdown */}
          {fromSuggestOpen && fromSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 max-h-[200px] overflow-y-auto">
              {fromSuggestions.map((s) => (
                <button
                  key={s.place_id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-[13px] text-gray-800 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    updateItem({ from: s.display_name } as any);
                    setFromSuggestOpen(false);
                    setFromSuggestions([]);
                  }}
                >
                  {s.display_name}
                </button>
              ))}
              <div className="px-3 py-2 text-[10px] text-gray-400 border-t border-gray-100">
                © OpenStreetMap contributors
              </div>
            </div>
          )}
        </div>
        
        <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
        
        {/* TO field */}
        <div className="flex-1 min-w-0 relative">
          <input
            className="w-full bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 text-[length:var(--text-base)] outline-none focus:border-gray-300 focus:bg-white transition-colors placeholder:text-gray-400"
            placeholder="To"
            value={(item as any).to || ""}
            onChange={(e) => {
              const v = e.target.value;
              updateItem({ to: v } as any);
              
              window.clearTimeout((window as any).__toTimer);
              (window as any).__toTimer = window.setTimeout(() => {
                searchPlaces(v, setToSuggestions);
                if (v.length >= 3) setToSuggestOpen(true);
              }, 400);
            }}
            onFocus={() => {
              if (toSuggestions.length) setToSuggestOpen(true);
            }}
            onBlur={() => {
              // Delay to allow click on suggestion
              setTimeout(() => setToSuggestOpen(false), 200);
            }}
          />
          
          {/* TO Suggestions Dropdown */}
          {toSuggestOpen && toSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 max-h-[200px] overflow-y-auto">
              {toSuggestions.map((s) => (
                <button
                  key={s.place_id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-[13px] text-gray-800 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    updateItem({ to: s.display_name } as any);
                    setToSuggestOpen(false);
                    setToSuggestions([]);
                  }}
                >
                  {s.display_name}
                </button>
              ))}
              <div className="px-3 py-2 text-[10px] text-gray-400 border-t border-gray-100">
                © OpenStreetMap contributors
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Open in Google Maps Button */}
      {((item as any).from || (item as any).to) && (
        <button
          type="button"
          onClick={() => {
            const from = ((item as any).from || '').trim();
            const to = ((item as any).to || '').trim();
            
            if (!from && !to) return;
            
            // Map MeMori transport types to Google Maps travel modes
            const travelModeMap: Record<string, string> = {
              'Walk': 'walking',
              'Train': 'transit',
              'Bus': 'transit',
              'Taxi': 'driving',
              'Plane': 'flying',
              'Ferry': 'transit',
              'Other': 'transit'
            };
            
            const travelMode = travelModeMap[(item as any).type] || 'transit';
            const origin = from || to; // If only one is filled, use it as both
            const destination = to || from;
            
            const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${travelMode}`;
            window.open(url, '_blank');
          }}
          className="w-full flex items-center justify-center gap-2 py-2 mb-3 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <MapPin className="w-4 h-4" />
          Open in Google Maps
        </button>
      )}

      {/* Notes */}
      <textarea
        className="w-full bg-transparent border-b border-gray-100 py-2 outline-none text-[length:var(--text-base)] min-h-[40px] placeholder:text-gray-400 resize-none mb-2 focus:border-gray-300 transition-colors"
        placeholder="Notes (optional)..."
        value={(item as any).notes || ""}
        onChange={(e) => updateItem({ notes: e.target.value } as any)}
      />

      {/* Link */}
      <div className="flex items-center gap-2">
        <LinkIcon className="w-4 h-4 text-gray-400" />
        <input
          className="flex-1 bg-transparent outline-none text-[length:var(--text-base)] placeholder:text-gray-400"
          placeholder="Optional Link"
          value={(item as any).link || ""}
          onChange={(e) => updateItem({ link: e.target.value } as any)}
        />
      </div>
    </div>
  );
};

interface DetailViewProps {
  memory: Memory;
  onBack: () => void;
  onUpdate: (memory: Memory) => void;
  onEdit?: () => void;
  activeSection: string | null;
  onSectionSelect: (section: "journal" | "photos" | "food" | "transport" | null) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export function DetailView({
  memory,
  onBack,
  onUpdate,
  onEdit,
  activeSection,
  onSectionSelect,
  onFullscreenChange,
}: DetailViewProps) {
  const [fullscreenPhotoIndex, setFullscreenPhotoIndex] = useState<number | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ✅ Signed URL cache: { "memori/xxx.jpg": "https://...signed..." }
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Initialize order from memory or default
  const defaultOrder = ["journal", "food", "photos", "transport"];
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    const order = (memory as any).sectionOrder || defaultOrder;
    const currentSet = new Set(order);
    const missing = defaultOrder.filter((s) => !currentSet.has(s));
    return [...order, ...missing];
  });

  useEffect(() => {
    if ((memory as any).sectionOrder) {
      const order = (memory as any).sectionOrder;
      const currentSet = new Set(order);
      const missing = defaultOrder.filter((s) => !currentSet.has(s));
      setSectionOrder([...order, ...missing]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(memory as any).sectionOrder]);

  useEffect(() => {
    if (activeSection) {
      setTimeout(() => {
        const section = document.getElementById(`section-${activeSection}`);
        const input = section?.querySelector("textarea, input") as HTMLElement;

        if (input) {
          input.focus({ preventScroll: true } as any);
          input.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 600);
    }
  }, [activeSection]);

  const updateMemory = (updates: Partial<Memory>) => {
    onUpdate({ ...memory, ...updates });
  };

  const moveSection = (dragIndex: number, hoverIndex: number) => {
    const newOrder = [...sectionOrder];
    const [draggedItem] = newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, draggedItem);
    setSectionOrder(newOrder);
    updateMemory({ sectionOrder: newOrder } as any);
  };

  // --- Photo helpers (stored vs display) ---
  const getPhotoMeta = (photo: PhotoItem) => {
    if (typeof photo === "string") return { location: "", caption: "" };
    return { location: photo.location || "", caption: photo.caption || "" };
  };

  const getPhotoStoredUrl = (photo: PhotoItem): string => {
    if (typeof photo === "string") return photo;
    return photo.url || "";
  };

  // ✅ This returns a REAL URL that <img> can display (signed if needed)
  const getPhotoDisplayUrl = (photo: PhotoItem): string => {
    const normalized = normalizeStoredPhotoToPathOrUrl(photo);

    if (normalized.kind === "url") {
      // external URL (or non-supabase) — just use it
      return normalized.value;
    }

    // path — use signed cache
    return signedUrls[normalized.value] || "";
  };

  // Whenever photos change, ensure we have signed URLs for any supabase paths
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const photos = ((memory as any).photos || []) as PhotoItem[];
      const paths = photos
        .map((p) => normalizeStoredPhotoToPathOrUrl(p))
        .filter((x) => x.kind === "path")
        .map((x) => x.value);

      for (const path of paths) {
        if (!path) continue;
        if (signedUrls[path]) continue;

        try {
          const signed = await signPhotoPath(path);
          if (!cancelled) {
            setSignedUrls((prev) => ({ ...prev, [path]: signed }));
          }
        } catch {
          // ignore per-photo sign failures
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(memory as any).photos]);

  // ✅ Clean upload handler (NO duplicates!)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async (file) => {
          console.log("📸 Processing photo:", file.name, "Size:", file.size, "Type:", file.type);
          
          // ⭐ EXTRACT EXIF FIRST (before upload, in case upload strips it)
          let location = "";
          let lat: number | undefined;
          let lng: number | undefined;

          try {
            console.log("🔍 Attempting EXIF extraction for:", file.name);
            
            // Try comprehensive EXIF parsing - extract BEFORE uploading
            const exifData = await exifr.parse(file);
            console.log("📊 Full EXIF data:", exifData);

            // Check multiple possible GPS field names
            if (exifData) {
              // Try standard GPS fields
              lat = exifData.latitude || exifData.GPSLatitude;
              lng = exifData.longitude || exifData.GPSLongitude;

              console.log("🗺️ Extracted coordinates:", { lat, lng });
            }

            if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
              console.log("✅ Valid GPS coordinates found:", { lat, lng });

              // Reverse geocode to get location name
              const reverseUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
              console.log("🌐 Calling reverse geocode API...");
              
              const response = await fetch(reverseUrl);
              
              if (response.ok) {
                const data = await response.json();
                console.log("🌍 Reverse geocode response:", data);
                
                // Try multiple fallback options for location name
                const nice = [data.locality || data.city, data.principalSubdivision]
                  .filter(Boolean)
                  .join(", ");
                location = nice || data.locality || data.city || data.principalSubdivision || data.countryName || "";
                
                console.log("📍 Final location name:", location);
              } else {
                console.log("❌ Reverse geocode failed:", response.status);
              }
            } else {
              console.log("⚠️ No valid GPS coordinates found in EXIF");
            }
          } catch (exifError) {
            console.log("❌ EXIF extraction error:", exifError);
          }

          // NOW upload the photo
          console.log("☁️ Uploading to storage...");
          const path = await uploadPhotoToStorage(file);
          console.log("✅ Upload complete:", path);

          // Store url as PATH with extracted location data
          const photoObj = { url: path, location, caption: "", lat, lng };
          console.log("💾 Saving photo object:", photoObj);
          return photoObj;
        })
      );

      const currentPhotos = (((memory as any).photos || []) as PhotoItem[]) ?? [];
      updateMemory({ photos: [...currentPhotos, ...uploaded] } as any);

      e.target.value = "";
    } catch (err: any) {
      console.error("❌ Photo upload error:", err);
      alert("Photo upload failed:\n" + (err?.message ?? String(err)));
    }
  };

  const handlePhotoUpdate = (index: number, location: string, caption: string, lat?: number, lng?: number) => {
    const photos = (((memory as any).photos || []) as PhotoItem[]) ?? [];
    if (!photos.length) return;

    const newPhotos = [...photos];
    const current = newPhotos[index];

    if (typeof current === "string") {
      newPhotos[index] = { url: current, location, caption, lat, lng };
    } else {
      newPhotos[index] = {
        ...current,
        location,
        caption,
        lat,
        lng,
      };
    }

    updateMemory({ photos: newPhotos } as any);
  };

  const SectionHeader = ({
    title,
    onEditClick,
    isActive,
    dragRef,
  }: {
    title: string;
    onEditClick: () => void;
    isActive: boolean;
    dragRef: any;
  }) => (
    <div className="flex items-center justify-between mb-6 cursor-pointer group select-none" onClick={onEditClick}>
      <div className="flex items-center gap-2">
        <div
          ref={dragRef}
          className="cursor-grab active:cursor-grabbing p-1 -ml-2 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded touch-none"
          title="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <h3 className="text-[length:var(--text-h3)] font-bold text-black">{title}</h3>
      </div>
      <button className={`p-1 rounded-full transition-colors ${isActive ? "bg-black text-white" : "text-gray-400 group-hover:text-black group-hover:bg-gray-100"}`}>
        <Edit3 className="w-4 h-4" />
      </button>
    </div>
  );

  const SaveButton = ({ onClick }: { onClick: () => void }) => (
    <div className="flex justify-end mt-4">
      <button
        onClick={onClick}
        className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:scale-105 transition-transform active:scale-95"
      >
        <Save className="w-4 h-4" />
        Save
      </button>
    </div>
  );

  const isSectionVisible = (_sectionId: string) => true;

  const renderSection = (sectionId: string, dragRef: any) => {
    const containerProps = {
      layout: true,
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: 0.3, ease: "easeInOut" },
    };

    const renderContent = (_id: string, isEditing: boolean, content: React.ReactNode) => (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isEditing ? "edit" : "view"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );

    switch (sectionId) {
      case "journal":
        return (
          <motion.div id="section-journal" {...containerProps} className="overflow-hidden">
            <SectionHeader
              title="Journal"
              isActive={activeSection === "journal"}
              onEditClick={() => onSectionSelect(activeSection === "journal" ? null : "journal")}
              dragRef={dragRef}
            />
            {renderContent(
              "journal",
              activeSection === "journal",
              activeSection === "journal" ? (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <textarea
                    className="w-full bg-transparent resize-none outline-none text-base min-h-[120px] placeholder:text-gray-400"
                    placeholder="Write your thoughts..."
                    value={(memory as any).journal || ""}
                    onChange={(e) => updateMemory({ journal: e.target.value } as any)}
                    autoFocus
                  />
                  <SaveButton onClick={() => onSectionSelect(null)} />
                </div>
              ) : (
                <p className="text-[length:var(--text-base)] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {(memory as any).journal}
                </p>
              )
            )}
          </motion.div>
        );

      case "photos": {
        const photos = (((memory as any).photos || []) as PhotoItem[]) ?? [];

        return (
          <motion.div id="section-photos" {...containerProps} className="overflow-hidden">
            <SectionHeader
              title="Photos"
              isActive={activeSection === "photos"}
              onEditClick={() => onSectionSelect(activeSection === "photos" ? null : "photos")}
              dragRef={dragRef}
            />
            {renderContent(
              "photos",
              activeSection === "photos",
              activeSection === "photos" ? (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="aspect-square bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
                    >
                      <PlusIcon />
                    </button>

                    {photos.map((photo, idx) => {
                      const src = getPhotoDisplayUrl(photo);
                      const photoObj = typeof photo === 'string' ? null : photo;
                      const hasLocation = photoObj?.location && photoObj.location.trim().length > 0;

                      return (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden relative group bg-white">
                          {src ? (
                            <img
  src={src}
  alt=""
  className="w-full h-full object-cover"
  onError={() => {
    console.log("IMG_LOAD_ERROR", {
      src,
      photo,
      signedUrlExists: !!src,
    });
  }}
/>

                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 bg-gray-100">
                              Loading…
                            </div>
                          )}

                          {/* Location Badge - Subtle gradient overlay */}
                          {hasLocation && (
                            <>
                              {/* Subtle gradient overlay at bottom */}
                              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                              
                              {/* Location text and icon */}
                              <div className="absolute bottom-1 left-1 flex items-center gap-1 max-w-[calc(100%-8px)]">
                                <MapPin className="w-2.5 h-2.5 text-white drop-shadow-md shrink-0" />
                                <span className="text-[9px] text-white truncate drop-shadow-md">{photoObj.location}</span>
                              </div>
                            </>
                          )}

                          <button
                            className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const newPhotos = photos.filter((_, i) => i !== idx);
                              updateMemory({ photos: newPhotos } as any);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <input
                    type="file"
                    multiple
                    ref={photoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                  <SaveButton onClick={() => onSectionSelect(null)} />
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
                  {photos.map((photo, idx) => {
                    const src = getPhotoDisplayUrl(photo);
                    const photoObj = typeof photo === 'string' ? null : photo;
                    const hasLocation = photoObj?.location && photoObj.location.trim().length > 0;

                    return (
                      <div
                        key={idx}
                        className="w-[140px] aspect-[3/4] shrink-0 rounded-lg overflow-hidden shadow-sm cursor-pointer bg-white relative"
                        onClick={() => {
                          setFullscreenPhotoIndex(idx);
                          onFullscreenChange?.(true);
                        }}
                      >
                        {src ? (
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 bg-gray-100">
                            Loading…
                          </div>
                        )}

                        {/* Location Badge - Subtle gradient overlay */}
                        {hasLocation && (
                          <>
                            {/* Subtle gradient overlay at bottom */}
                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                            
                            {/* Location text and icon */}
                            <div className="absolute bottom-2 left-2 flex items-center gap-1 max-w-[calc(100%-16px)]">
                              <MapPin className="w-3 h-3 text-white drop-shadow-md shrink-0" />
                              <span className="text-[10px] text-white truncate font-medium drop-shadow-md">{photoObj.location}</span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </motion.div>
        );
      }

      case "food":
        return (
          <motion.div id="section-food" {...containerProps} className="overflow-hidden">
            <SectionHeader
              title="Food"
              isActive={activeSection === "food"}
              onEditClick={() => onSectionSelect(activeSection === "food" ? null : "food")}
              dragRef={dragRef}
            />
            {renderContent(
              "food",
              activeSection === "food",
              activeSection === "food" ? (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <input
                    className="w-full bg-transparent border-b border-gray-300 py-2 mb-4 outline-none text-base"
                    placeholder="What did you eat?"
                    value={(memory as any).food?.text || ""}
                    onChange={(e) => updateMemory({ food: { ...(memory as any).food, text: e.target.value } } as any)}
                    autoFocus
                  />
                  <SaveButton onClick={() => onSectionSelect(null)} />
                </div>
              ) : (
                <p className="text-[length:var(--text-base)] text-muted-foreground leading-relaxed">
                  {(memory as any).food?.text}
                </p>
              )
            )}
          </motion.div>
        );

      case "transport": {
        const rawTransport = (memory as any).transport;
        let transportItems: any[] = [];

        if (Array.isArray(rawTransport)) transportItems = rawTransport;
        else if (typeof rawTransport === "object" && rawTransport !== null) transportItems = [rawTransport];
        else if (typeof rawTransport === "string" && rawTransport.trim() !== "") transportItems = [{ id: "legacy", type: "Other", link: rawTransport }];

        transportItems = transportItems.map((t, i) => ({ ...t, id: t.id || `transport-${i}-${(memory as any).id}` }));

        const updateTransportList = (newList: any[]) => updateMemory({ transport: newList } as any);

        const moveTransportItem = (dragIndex: number, hoverIndex: number) => {
          const newItems = [...transportItems];
          const [draggedItem] = newItems.splice(dragIndex, 1);
          newItems.splice(hoverIndex, 0, draggedItem);
          updateTransportList(newItems);
        };

        const updateTransportItem = (index: number, updates: any) => {
          const newItems = [...transportItems];
          newItems[index] = { ...newItems[index], ...updates };
          updateTransportList(newItems);
        };

        const deleteTransportItem = (index: number) => {
          const newItems = transportItems.filter((_, i) => i !== index);
          updateTransportList(newItems);
        };

        const addTransportItem = () => {
          const newItem: any = {
            id: `transport-${Date.now()}`,
            type: "Walk",
            from: "",
            to: "",
            notes: "",
          };
          updateTransportList([...transportItems, newItem]);
        };

        return (
          <motion.div id="section-transport" {...containerProps} className="overflow-hidden">
            <SectionHeader
              title="Transport"
              isActive={activeSection === "transport"}
              onEditClick={() => onSectionSelect(activeSection === "transport" ? null : "transport")}
              dragRef={dragRef}
            />
            {renderContent(
              "transport",
              activeSection === "transport",
              activeSection === "transport" ? (
                <div className="bg-gray-50 p-4 rounded-xl">
                  {transportItems.map((item, index) => (
                    <SortableTransportCard
                      key={item.id}
                      item={item as any}
                      index={index}
                      moveItem={moveTransportItem}
                      updateItem={(updates) => updateTransportItem(index, updates)}
                      deleteItem={() => deleteTransportItem(index)}
                    />
                  ))}
                  <button
                    onClick={addTransportItem}
                    className="w-full py-4 flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-gray-300 hover:text-gray-600 hover:bg-white transition-all group"
                  >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Add Segment</span>
                  </button>
                  <div className="mt-4">
                    <SaveButton onClick={() => onSectionSelect(null)} />
                  </div>
                </div>
              ) : transportItems.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded-xl flex flex-col gap-0">
                  {transportItems.map((item, index) => {
                    const Icon =
                      {
                        Walk: Footprints,
                        Train: Train,
                        Bus: Bus,
                        Taxi: Car,
                        Plane: Plane,
                        Ferry: Ship,
                        Other: MapPin,
                      }[item.type] || MapPin;

                    return (
                      <div key={item.id} className="relative pb-6 last:pb-0 group">
                        {index < transportItems.length - 1 && <div className="absolute left-[19px] top-8 bottom-0 w-[2px] bg-gray-200" />}

                        <div className="flex items-start gap-3 relative z-10">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm text-black border border-gray-100">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-center gap-2 text-[length:var(--text-base)] font-normal text-muted-foreground">
                              <span className="truncate">{item.from || "?"}</span>
                              <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate">{item.to || "?"}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1 mb-1">
                              {item.type}
                            </div>

                            {item.notes && (
                              <p className="text-[length:var(--text-base)] text-muted-foreground leading-relaxed whitespace-pre-wrap break-words mb-1">
                                {item.notes}
                              </p>
                            )}

                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-2 py-1 rounded-md"
                              >
                                <LinkIcon className="w-3 h-3" />
                                View route
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null
            )}
          </motion.div>
        );
      }

      default:
        return null;
    }
  };

  // ---- Fullscreen: pass photos through unchanged (PhotosFullscreenView can keep using url/meta) ----
  const fullscreenPhotos = (((memory as any).photos || []) as PhotoItem[]) ?? [];

  return (
    <motion.div
      className="fixed inset-0 w-full h-[100dvh] bg-white flex flex-col font-['Roboto'] z-50"
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: { duration: 0.3, ease: "easeInOut" },
      }}
      exit={{
        opacity: 0,
        transition: { duration: 0.25, ease: "easeInOut" },
      }}
    >
      {/* Back Button */}
      <motion.button
        onClick={onBack}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.2 } }}
        className="absolute top-4 left-4 z-50 p-2 bg-gray-100 hover:bg-gray-200 rounded-full shadow-sm transition-colors"
      >
        <ChevronLeft className="w-6 h-6 text-black" />
      </motion.button>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pt-16 pb-24 md:pt-24 md:pb-8">
        <div className="w-full max-w-md md:max-w-6xl mx-auto px-6 md:px-16 md:py-12 md:flex md:gap-12 md:items-start">
          {/* Left Column: Cover Photo */}
          <div className="flex flex-col items-center mb-10 md:mb-0 md:w-[420px] md:shrink-0 md:sticky md:top-8">
            <motion.div
              layoutId={`card-container-${(memory as any).id}`}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative w-[180px] md:w-[260px] aspect-[3/4] mb-6 shrink-0 shadow-xl rounded-2xl group cursor-pointer"
              onClick={onEdit}
              style={{ zIndex: 50 }}
            >
              <motion.div
                layoutId={`card-frame-${(memory as any).id}`}
                className="absolute inset-0 bg-white rounded-2xl overflow-hidden border-[4px] border-white"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <motion.img
                  layoutId={`memory-image-${(memory as any).id}`}
                  src={(memory as any).image}
                  alt={(memory as any).place}
                  className="w-full h-full object-cover rounded-lg"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                    <Edit3 className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-medium tracking-wider">EDIT</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
              className="w-full flex flex-col items-center"
            >
              <textarea
                value={(memory as any).place}
                onChange={(e) => updateMemory({ place: e.target.value } as any)}
                onInput={(e) => {
                  e.currentTarget.style.height = "auto";
                  e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                }}
                rows={1}
                className="text-[28px] font-bold text-center text-black border-none focus:ring-0 p-0 bg-transparent w-full mb-4 outline-none placeholder:text-gray-300 resize-none overflow-hidden"
                placeholder="Location"
              />

              <div className="flex items-center justify-center gap-4 w-full text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" strokeWidth={2} />
                  <span className="text-sm font-medium">{format(new Date((memory as any).date), "dd.MM.yyyy")}</span>
                </div>
                <div className="w-[1px] h-4 bg-gray-300" />
                <div className="flex items-center gap-1.5">
                  {React.cloneElement(getMoodIcon((memory as any).mood) as React.ReactElement, { className: "w-4 h-4", strokeWidth: 2 })}
                  <span className="text-sm font-medium">{(memory as any).mood}</span>
                </div>
                <div className="w-[1px] h-4 bg-gray-300" />
                <div className="flex items-center gap-1.5">
                  {(memory as any).time === "Night" ? (
                    <Moon className="w-4 h-4" strokeWidth={2} />
                  ) : (memory as any).time === "Noon" ? (
                    <Sun className="w-4 h-4" strokeWidth={2} />
                  ) : (
                    <CloudSun className="w-4 h-4" strokeWidth={2} />
                  )}
                  <span className="text-sm font-medium">{(memory as any).time}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sections */}
          <motion.div
            className="flex flex-col md:flex-1 md:min-w-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3, ease: "easeInOut" }}
          >
            <AnimatePresence mode="popLayout">
              {sectionOrder.map((sectionId, index) => {
                if (!isSectionVisible(sectionId)) return null;
                return (
                  <SortableSection key={sectionId} id={sectionId} index={index} moveSection={moveSection}>
                    {(dragRefInner) => renderSection(sectionId, dragRefInner)}
                  </SortableSection>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {fullscreenPhotoIndex !== null && fullscreenPhotos.length > 0 && (
          <PhotosFullscreenView
            photos={fullscreenPhotos as any}
            initialIndex={fullscreenPhotoIndex}
            memoryLocation={(memory as any).place || ""}
            onClose={() => {
              setFullscreenPhotoIndex(null);
              onFullscreenChange?.(false);
            }}
            onUpdate={(index: number, loc: string, cap: string, lat?: number, lng?: number) => handlePhotoUpdate(index, loc, cap, lat, lng)}
            getDisplayUrl={getPhotoDisplayUrl}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
