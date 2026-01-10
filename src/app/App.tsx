import { projectId, publicAnonKey } from "../../utils/supabase/info";
import React, { useEffect, useState } from "react";
import { AnimatePresence } from 'motion/react';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HomeView } from './components/HomeView';
import { DetailView } from './components/DetailView';
import { AddMemoryView } from './components/AddMemoryView';
import { Logo } from './components/Logo';
import { Memory } from './types';



const VIDEO_URL = "https://wujuzaohyxqclyiptnjw.supabase.co/storage/v1/object/public/assets/komorebi.mp4";
const POSTER_URL = "https://wujuzaohyxqclyiptnjw.supabase.co/storage/v1/object/public/assets/komorebi-poster.jpg";

const BackgroundVideo = () => {
  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#1e2b1e]">
       {/* Explicit Poster Image Layer - Loads immediately to cover background */}
       <img 
          src={POSTER_URL}
          className="absolute inset-0 w-full h-full object-cover z-0"
          alt=""
          decoding="sync"
          loading="eager"
       />
       
       {/* Video Layer */}
       <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={POSTER_URL}
          className="absolute inset-0 w-full h-full object-cover z-10"
       >
          <source src={VIDEO_URL} type="video/mp4" />
       </video>
    </div>
  );
};

const supabaseUrlFrom = (projectId: string) => `https://${projectId}.supabase.co`;

async function supabaseSignIn(email: string, password: string, projectId: string, publicAnonKey: string) {
  const supabaseUrl = supabaseUrlFrom(projectId);

  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: publicAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json(); // has access_token + user
  localStorage.setItem("sb_access_token", data.access_token);
  localStorage.setItem("sb_user_id", data.user?.id || "");
  return data;
}

function getAccessToken() {
  return localStorage.getItem("sb_access_token");
}

function getUserId() {
  return localStorage.getItem("sb_user_id");
}

function signOutLocal() {
  localStorage.removeItem("sb_access_token");
  localStorage.removeItem("sb_user_id");
}

export default function App() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [view, setView] = useState<'HOME' | 'ADD' | 'DETAIL' | 'EDIT'>('HOME');
  const [isAuthed, setIsAuthed] = useState(!!getAccessToken());
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [busy, setBusy] = useState(false);


  useEffect(() => {
  const checkAuth = async () => {
    const token = getAccessToken();
    if (!token) return;

    const supabaseUrl = `https://${projectId}.supabase.co`;

    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: publicAnonKey,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      signOutLocal();
      setIsAuthed(false);
    }
  };

  checkAuth();
}, []);

  // State for DetailView section editing
  const [activeSection, setActiveSection] = useState<'journal' | 'photos' | 'food' | 'transport' | null>(null);
  useEffect(() => {
  const load = async () => {
    try {
      const supabaseUrl = `https://${projectId}.supabase.co`;

      const res = await fetch(
        `${supabaseUrl}/rest/v1/memories?select=*&order=memory_date.desc,created_at.desc`,
        {
          headers: {
            apikey: publicAnonKey,
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!res.ok) return;

      const rows = await res.json();

      // Map Supabase rows -> your Memory type
      const mapped: Memory[] = rows.map((r: any) => ({
        id: r.id,
        place: r.location_text ?? "",
        mood: r.feeling ?? "",
        time: r.time_of_day ?? "",
        date: (r.memory_date ?? new Date().toISOString()),
        // NOTE: we didn't save images to Supabase yet, so keep image empty for now
        image: r.image ?? null,
        originalImage: r.original_image ?? null,
        photos: r.photos ?? [],
        journal: "",
        transport: "",
      }));

      setMemories(mapped);
    } catch (e) {
      // ignore for now
    }
  };

  load();
}, []);

  // State to track if a fullscreen view (like Photos) is active to hide NavBar
  const [isFullscreen, setIsFullscreen] = useState(false);

  const selectedMemory = memories.find(m => m.id === selectedMemoryId);

  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const handleSelectMemory = (id: string) => {
    setLastSelectedId(null); // Reset when navigating forward
    setSelectedMemoryId(id);
    setActiveSection(null); // Reset section editing
    // We defer the view change to ensure HomeView receives the selectedId prop 
    // before it unmounts. This allows it to render the correct exit animation 
    // (dispersing non-selected cards).
    setTimeout(() => {
        setView('DETAIL');
    }, 10);
  };

  const handleStartCreate = () => {
    setLastSelectedId(null);
    setView('ADD');
  };

  const handleStartEdit = () => {
    setView('EDIT');
  };

  const handleSaveMemory = (memory: Memory) => {
    if (memories.find(m => m.id === memory.id)) {
        // Update existing
        setMemories(memories.map(m => m.id === memory.id ? memory : m));
    } else {
        // Create new
        setMemories(prev => [memory, ...prev]);
    }
    setSelectedMemoryId(memory.id);
    setActiveSection(null);
    setView('DETAIL');
  };

  const handleBackToHome = () => {
    // When going back, we keep the selectedMemoryId valid just long enough 
    // for the HomeView to mount and see "selectedId" to trigger the return animation.
    // However, App renders ONE view at a time. 
    // So we just set view to HOME, but we pass the ID we just left as 'enteringFromId'.
    // Wait, 'enteringFromId' is 'lastSelectedId'. 
    
    setLastSelectedId(selectedMemoryId); 
    setView('HOME');
    // We clear selectedMemoryId immediately? 
    // The DetailView unmounts. HomeView mounts. 
    // HomeView receives enteringFromId={selectedMemoryId}.
    // HomeView renders the grid. 
    // The "selected" card in HomeView should be in "hero" position initially? 
    // No, layoutId handles the transition from DetailView(Hero) -> HomeView(Card).
    
    // BUT layoutId only works if both exist or one replaces the other. 
    // Since AnimatePresence handles the switch:
    // 1. DetailView exists.
    // 2. view changes to HOME.
    // 3. DetailView exits. HomeView enters. 
    // Both exist simultaneously for the duration of the transition?
    // AnimatePresence mode="wait" means one exits THEN other enters. 
    // This breaks layoutId shared transition.
    
    // CHANGE REQUIRED: AnimatePresence mode="popLayout" or no mode (sync).
    // If we want simultaneous animation (morph), we remove mode="wait".
    // AND we must ensure they overlap.
    
    setSelectedMemoryId(null);
    setActiveSection(null);
  };

  const handleBackFromEdit = () => {
    setView('DETAIL');
    setActiveSection(null);
  };

const handleUpdateMemory = async (updatedMemory: Memory) => {
  // 1) update UI immediately
  setMemories(prev => prev.map(m => m.id === updatedMemory.id ? updatedMemory : m));

  // 2) save to Supabase so refresh keeps it
  try {
    const supabaseUrl = `https://${projectId}.supabase.co`;

    await fetch(`${supabaseUrl}/rest/v1/memories?id=eq.${updatedMemory.id}`, {
      method: "PATCH",
      headers: {
        apikey: publicAnonKey,
        Authorization: `Bearer ${publicAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // ✅ include photos once you add the column
        photos: updatedMemory.photos ?? [],
      }),
    });
  } catch (e) {
    // ignore for now
  }
};


  const handleDeleteMemory = async (id: string) => {
    // Optimistic update
    setMemories(prev => prev.filter(m => m.id !== id));
    
    // Reset view if we deleted the currently selected one
    if (selectedMemoryId === id) {
      setSelectedMemoryId(null);
      setView('HOME');
    }

    try {
      const supabaseUrl = `https://${projectId}.supabase.co`;
      await fetch(`${supabaseUrl}/rest/v1/memories?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          apikey: publicAnonKey,
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });
    } catch (e) {
      console.error("Failed to delete memory:", e);
      // In a real app, we might revert the optimistic update here
    }
  };

  const handleSectionSelect = (section: 'journal' | 'photos' | 'food' | 'transport' | null) => {
    // If clicking the already active section via navbar, maybe we want to toggle?
    // But NavBar usually sets it. DetailView uses it to open/close.
    // Logic: If section is passed, set it.
    setActiveSection(section);
  };
  
  const handleNavBarSectionClick = (section: 'journal' | 'photos' | 'food' | 'transport') => {
      if (activeSection === section) {
          setActiveSection(null); // Toggle off
      } else {
          // If the section is empty (newly added), move it to the bottom
          if (selectedMemory) {
              const hasData = (() => {
                  switch(section) {
                      case 'journal': return !!selectedMemory.journal;
                      case 'photos': return !!(selectedMemory.photos && selectedMemory.photos.length > 0);
                      case 'food': return !!selectedMemory.food?.text;
                      case 'transport': 
                          if (Array.isArray(selectedMemory.transport)) return selectedMemory.transport.length > 0;
                          return !!selectedMemory.transport;
                      default: return false;
                  }
              })();

              if (!hasData) {
                  const currentOrder = selectedMemory.sectionOrder || ['journal', 'photos', 'food', 'transport'];
                  const newOrder = currentOrder.filter(s => s !== section);
                  newOrder.push(section);
                  
                  handleUpdateMemory({ ...selectedMemory, sectionOrder: newOrder });
              }
          }
          setActiveSection(section);
      }
  };
  return (
    <div className="fixed inset-0 w-full h-full bg-[#1e2b1e] overflow-hidden font-['Roboto',sans-serif] text-black">
      {/* Persistent Background Video */}
      <BackgroundVideo />

      {!isAuthed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-50">
          <div className="absolute top-12 md:top-24 scale-90 opacity-90">
             <Logo variant="white" />
          </div>
          <div className="w-full max-w-[340px] rounded-[32px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-[28px] font-semibold text-white mb-6 text-center tracking-tight">Sign in</div>

            <div className="space-y-4">
              <input
                className="w-full h-12 rounded-xl bg-white/10 border border-white/10 px-4 text-white placeholder:text-white/40 outline-none focus:bg-white/20 focus:border-white/30 transition-all text-base"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none"
              />

              <input
                className="w-full h-12 rounded-xl bg-white/10 border border-white/10 px-4 text-white placeholder:text-white/40 outline-none focus:bg-white/20 focus:border-white/30 transition-all text-base"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              onClick={async () => {
                try {
                  setBusy(true);
                  const auth = await supabaseSignIn(email, password, projectId, publicAnonKey);
localStorage.setItem("sb_access_token", auth.access_token); // ✅ store token
setIsAuthed(true);
                } catch (e: any) {
                  alert(e?.message ?? String(e));
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy || !email || !password}
              className={`w-full h-12 rounded-full font-medium text-[16px] mt-8 shadow-lg ${
                busy || !email || !password ? "bg-white/20 text-white/40 cursor-not-allowed" : "bg-white text-black hover:bg-white/90 active:scale-95"
              } transition-all duration-200`}
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </div>
      ) : (
        <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>
          {/* Remove mode="wait" to allow simultaneous presence for layoutId transitions */}
          <AnimatePresence>
            {view === 'HOME' && (
              <HomeView 
                key="home"
                memories={memories}
                onSelectMemory={handleSelectMemory}
                onCreateMemory={handleStartCreate}
                onDeleteMemory={handleDeleteMemory}
                enteringFromId={lastSelectedId}
                // Pass the ID that is currently "active" if we are transitioning OUT of home
                selectedId={selectedMemoryId}
              />
            )}
            
            {view === 'ADD' && (
              <AddMemoryView 
                key="add"
                onSave={handleSaveMemory}
                onCancel={handleBackToHome}
              />
            )}

            {view === 'EDIT' && selectedMemory && (
              <AddMemoryView 
                key="edit"
                initialMemory={selectedMemory}
                onSave={handleSaveMemory}
                onCancel={handleBackFromEdit}
              />
            )}

            {view === 'DETAIL' && selectedMemory && (
              <DetailView 
                key="detail"
                memory={selectedMemory}
                onBack={handleBackToHome}
                onUpdate={handleUpdateMemory}
                onEdit={handleStartEdit}
                activeSection={activeSection}
                onSectionSelect={handleSectionSelect}
                onFullscreenChange={setIsFullscreen}
              />
            )}
          </AnimatePresence>
        </DndProvider>
      )}
    </div>
  );
}
