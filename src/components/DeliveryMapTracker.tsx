import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Truck, Store, Home, Compass, Clock, CheckCircle2, ShieldCheck, Key, Search } from 'lucide-react';

interface DeliveryMapTrackerProps {
  fromAddress?: string;
  toAddress?: string;
  orderId?: string;
  etaMinutes?: number;
  riderName?: string;
  riderPhone?: string;
  onAddressChange?: (newToAddress: string) => void;
}

const STORE_COORDS = { lat: 17.6888, lng: 83.2185 }; // MANIVYA Owner Hub Gajuwaka Bypass Rd
const DEFAULT_USER_COORDS = { lat: 17.6888, lng: 83.2185 }; // Pedagantyada / Gajuwaka, Visakhapatnam

export const DeliveryMapTracker: React.FC<DeliveryMapTrackerProps> = ({
  fromAddress = "25-1-13, Gajuwaka Bypass Rd, Durgavanipalem, Pedagantyada, Visakhapatnam, Gajuwaka, Andhra Pradesh 530026",
  toAddress = "25-1-13, Gajuwaka Bypass Rd, Durgavanipalem, Pedagantyada, Visakhapatnam, Gajuwaka, Andhra Pradesh 530026",
  orderId = "MNE-9482",
  etaMinutes = 7,
  riderName = "Ramu K. (MANIVYA Rider)",
  riderPhone = "7207554777",
  onAddressChange
}) => {
  const [customToAddress, setCustomToAddress] = useState(toAddress);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Live rider position simulation between store and user
  const [progress, setProgress] = useState(0.65); // 65% along route
  const [currentSpeed, setCurrentSpeed] = useState(36); // km/h

  const [hasMapError, setHasMapError] = useState(false);

  const apiKey =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    '';
  const hasValidKey = Boolean(apiKey) && apiKey !== 'YOUR_API_KEY' && apiKey.length > 20;

  useEffect(() => {
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      setHasMapError(true);
      if (typeof prevAuthFailure === 'function') prevAuthFailure();
    };
    return () => {
      (window as any).gm_authFailure = prevAuthFailure;
    };
  }, []);

  // Rider animated location
  const riderLat = STORE_COORDS.lat + (DEFAULT_USER_COORDS.lat - STORE_COORDS.lat) * progress;
  const riderLng = STORE_COORDS.lng + (DEFAULT_USER_COORDS.lng - STORE_COORDS.lng) * progress;

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 0.95) return 0.2;
        return prev + 0.02;
      });
      setCurrentSpeed(32 + Math.floor(Math.random() * 12));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleUpdateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingAddress(false);
    if (onAddressChange) {
      onAddressChange(customToAddress);
    }
  };

  return (
    <div className="bg-zinc-950 rounded-2xl border border-zinc-800/90 overflow-hidden shadow-xl text-white">
      {/* Top Address Banner - From and To */}
      <div className="p-3.5 bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono font-extrabold text-blue-400 flex items-center gap-1.5 uppercase text-[11px]">
            <Navigation className="w-3.5 h-3.5" /> Live Google Maps Tracking
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
            <Truck className="w-3 h-3" /> Live Dispatch
          </span>
        </div>

        {/* Route Details Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-sans text-xs">
          {/* FROM ADDRESS */}
          <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
              <Store className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="font-mono font-bold text-[10px] uppercase text-zinc-400">FROM STORE / HUB</p>
              <p className="font-bold text-zinc-100 truncate">{fromAddress}</p>
            </div>
          </div>

          {/* TO ADDRESS */}
          <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Home className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="font-mono font-bold text-[10px] uppercase text-zinc-400">TO DELIVERY DOORSTEP</p>
                <p className="font-bold text-zinc-100 truncate">{customToAddress}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditingAddress(!isEditingAddress)}
              className="text-[10px] font-mono text-blue-400 hover:underline shrink-0 pt-0.5 font-bold"
            >
              {isEditingAddress ? 'Cancel' : 'Change'}
            </button>
          </div>
        </div>

        {/* Address Change Input Form */}
        {isEditingAddress && (
          <form onSubmit={handleUpdateAddress} className="flex gap-2 pt-1">
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-xl border border-blue-500/50 text-xs">
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <input
                type="text"
                value={customToAddress}
                onChange={(e) => setCustomToAddress(e.target.value)}
                placeholder="Enter new delivery address in Visakhapatnam..."
                className="flex-1 bg-transparent text-white outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
            >
              Update To Address
            </button>
          </form>
        )}
      </div>

      {/* Map View Area */}
      <div className="relative w-full h-64 md:h-72 bg-zinc-900 overflow-hidden">
        {hasValidKey && !hasMapError ? (
          <APIProvider apiKey={apiKey} version="weekly">
            <Map
              defaultCenter={STORE_COORDS}
              defaultZoom={12}
              mapId="MANIVYA_DELIVERY_MAP"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Store Origin Marker */}
              <AdvancedMarker position={STORE_COORDS} title="MANIVYA Owner Hub Gajuwaka">
                <Pin background="#8B5CF6" glyphColor="#FFFFFF" borderColor="#6D28D9" />
              </AdvancedMarker>

              {/* Rider Moving Marker */}
              <AdvancedMarker position={{ lat: riderLat, lng: riderLng }} title={riderName}>
                <div className="p-2 bg-blue-600 text-white rounded-full shadow-lg border-2 border-white animate-bounce">
                  <Truck className="w-4 h-4" />
                </div>
              </AdvancedMarker>

              {/* Destination User Marker */}
              <AdvancedMarker position={DEFAULT_USER_COORDS} title="Delivery Address">
                <Pin background="#10B981" glyphColor="#FFFFFF" borderColor="#059669" />
              </AdvancedMarker>
            </Map>
          </APIProvider>
        ) : (
          /* Interactive Vector Map Simulator when Google Maps API key is not yet added in Secrets */
          <div className="relative w-full h-full bg-[#1e2330] p-4 flex flex-col justify-between overflow-hidden">
            {/* Grid Pattern Background */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#3b82f6 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
              }}
            />

            {/* SVG Simulated Route Line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path
                d="M 60 180 Q 180 80 320 140"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="4"
                strokeDasharray="6 6"
                className="animate-pulse"
              />
              <path
                d="M 60 180 Q 180 80 320 140"
                fill="none"
                stroke="#60A5FA"
                strokeWidth="2"
              />
            </svg>

            {/* From Pin (Store) */}
            <div className="absolute left-[12%] top-[60%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="px-2 py-0.5 rounded bg-purple-900/90 text-purple-200 border border-purple-500/40 text-[10px] font-mono font-bold mb-1 shadow-md whitespace-nowrap">
                FROM: MANIVYA Gajuwaka Owner Hub
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                <Store className="w-4 h-4" />
              </div>
            </div>

            {/* Animated Rider Marker */}
            <div 
              className="absolute transition-all duration-1000 ease-linear flex flex-col items-center z-10"
              style={{
                left: `${15 + progress * 65}%`,
                top: `${55 - Math.sin(progress * Math.PI) * 25}%`
              }}
            >
              <div className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-mono font-extrabold mb-1 shadow-lg border border-blue-400 flex items-center gap-1">
                <Truck className="w-3 h-3" /> {riderName} ({currentSpeed} km/h)
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-blue-500/30">
                <Navigation className="w-5 h-5 rotate-45" />
              </div>
            </div>

            {/* To Pin (User Doorstep) */}
            <div className="absolute right-[12%] top-[45%] translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="px-2 py-0.5 rounded bg-emerald-900/90 text-emerald-200 border border-emerald-500/40 text-[10px] font-mono font-bold mb-1 shadow-md whitespace-nowrap">
                TO: {customToAddress.split(',')[0]}
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                <Home className="w-4 h-4" />
              </div>
            </div>

            {/* Google Maps API Key Setup Prompt Bar if missing */}
            <div className="relative z-20 mt-auto bg-zinc-900/90 backdrop-blur-md p-2.5 rounded-xl border border-zinc-700/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-zinc-300 text-[11px]">
                  <strong>Google Maps API Key Setup:</strong> Add <code>GOOGLE_MAPS_PLATFORM_KEY</code> in Settings → Secrets for full interactive satellite tiles.
                </span>
              </div>
              <a
                href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold font-mono text-[10px] border border-amber-500/30 whitespace-nowrap"
              >
                Get Key
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Rider Control & Contact Footer */}
      <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-white leading-tight">{riderName}</p>
            <p className="text-[10px] text-zinc-400 font-mono">Cold-Chain Express Rider</p>
          </div>
        </div>

        <a
          href={`tel:${riderPhone}`}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors font-mono"
        >
          Call Rider (+91 {riderPhone})
        </a>
      </div>
    </div>
  );
};
