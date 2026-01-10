export interface TransportData {
  id: string;
  type: 'Walk' | 'Train' | 'Bus' | 'Taxi' | 'Plane' | 'Ferry' | 'Other';
  from?: string;
  to?: string;
  notes?: string;
  link?: string;
}

export interface Memory {
  id: string;
  image: string;
  place: string;
  date: string;
  mood: string;
  time: 'Day' | 'Noon' | 'Night';
  journal?: string;
  photos?: (string | { url: string; location?: string; caption?: string; lat?: number; lng?: number })[];
  food?: { text: string; images?: string[] };
  transport?: string | TransportData | TransportData[];
  sectionOrder?: string[];
  originalImage?: string;
}
