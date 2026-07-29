import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Search, Check, Building, Compass, Sparkles, AlertCircle, Route, ArrowRight, Truck, Store, Home } from 'lucide-react';

interface GoogleMapsAddressPickerProps {
  initialCity?: string;
  initialFullAddress?: string;
  onAddressSelect: (addressData: {
    city: string;
    fullAddress: string;
    doorNo: string;
    street: string;
    landmark: string;
    area: string;
    pincode: string;
    lat: number;
    lng: number;
  }) => void;
}

const VISAKHA_AREA_MAP: Record<string, { pincode: string; lat: number; lng: number }> = {
  'gajuwaka': { pincode: '530026', lat: 17.6888, lng: 83.2185 },
  'siripuram': { pincode: '530003', lat: 17.7231, lng: 83.3012 },
  'vip road': { pincode: '530003', lat: 17.7235, lng: 83.3040 },
  'maharani peta': { pincode: '530002', lat: 17.7100, lng: 83.3050 },
  'steel plant': { pincode: '530031', lat: 17.6350, lng: 83.1800 },
  'pedagantyada': { pincode: '530044', lat: 17.6620, lng: 83.2310 },
  'maddilapalem': { pincode: '530013', lat: 17.7340, lng: 83.3160 },
  'mvp colony': { pincode: '530017', lat: 17.7400, lng: 83.3300 },
  'dwaraka nagar': { pincode: '530016', lat: 17.7260, lng: 83.3000 },
  'seethammadhara': { pincode: '530013', lat: 17.7450, lng: 83.3100 },
  'pendurthi': { pincode: '530051', lat: 17.7800, lng: 83.2000 },
  'anakapalle': { pincode: '531001', lat: 17.6900, lng: 83.0000 },
  'kurmannapalem': { pincode: '530046', lat: 17.6500, lng: 83.1700 },
  'sheela nagar': { pincode: '530012', lat: 17.7050, lng: 83.2450 }
};

const DEFAULT_COORDS = { lat: 17.6888, lng: 83.2185 }; // Visakhapatnam / Gajuwaka default

export const GoogleMapsAddressPicker: React.FC<GoogleMapsAddressPickerProps> = ({
  initialCity = 'Visakhapatnam',
  initialFullAddress = '',
  onAddressSelect
}) => {
  const [city, setCity] = useState(initialCity);
  const [doorNo, setDoorNo] = useState(() => {
    if (initialFullAddress && initialFullAddress.includes('Door No.')) {
      const match = initialFullAddress.match(/Door No\.\s*([^,]+)/i);
      if (match) return match[1];
    }
    return '';
  });
  const [streetAddress, setStreetAddress] = useState(() => {
    if (initialFullAddress) {
      const cleaned = initialFullAddress
        .replace(/Door No\.[^,]+,\s*/i, '')
        .replace(/\s*-\s*\d{6}/, '')
        .replace(/,\s*Visakhapatnam/i, '')
        .trim();
      if (cleaned) return cleaned;
    }
    return initialCity || 'Visakhapatnam';
  });
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState(() => {
    if (initialFullAddress) {
      const pinMatch = initialFullAddress.match(/\b\d{6}\b/);
      if (pinMatch) return pinMatch[0];
    }
    return '530026';
  });
  const [mapCenter, setMapCenter] = useState(DEFAULT_COORDS);
  const [markerPos, setMarkerPos] = useState(DEFAULT_COORDS);
  const [isLocating, setIsLocating] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

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

  // Auto Geocoding & Pincode / Coords detection when address input changes
  useEffect(() => {
    const combinedText = `${streetAddress} ${landmark} ${city}`.toLowerCase();
    
    // Auto detect pincode and lat/lng if matching known Visakhapatnam areas
    for (const [key, info] of Object.entries(VISAKHA_AREA_MAP)) {
      if (combinedText.includes(key)) {
        if (!pincode || pincode === '530026') {
          setPincode(info.pincode);
        }
        setMarkerPos({ lat: info.lat, lng: info.lng });
        setMapCenter({ lat: info.lat, lng: info.lng });
        break;
      }
    }
  }, [streetAddress, landmark, city]);

  // Calculate Auto Distance & ETA from Owner Hub
  const ownerLat = 17.6888;
  const ownerLng = 83.2185;
  const ownerAddressStr = "25-1-13, Gajuwaka Bypass Rd, Durgavanipalem, Pedagantyada, Visakhapatnam, Gajuwaka, Andhra Pradesh 530026";

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.max(0.8, Math.round(R * c * 10) / 10);
  };

  const autoDistanceKm = calculateDistance(ownerLat, ownerLng, markerPos.lat, markerPos.lng);
  const autoEtaMins = Math.max(8, Math.round(autoDistanceKm * 2.5 + 5));

  // Whenever user updates fields, notify parent component
  useEffect(() => {
    const fullAddr = `${doorNo ? `Door No. ${doorNo}, ` : ''}${streetAddress}${landmark ? `, Near ${landmark}` : ''}, ${city} - ${pincode}`;
    onAddressSelect({
      city,
      doorNo,
      street: streetAddress,
      landmark,
      fullAddress: fullAddr,
      area: city,
      pincode,
      lat: markerPos.lat,
      lng: markerPos.lng
    });
  }, [city, doorNo, streetAddress, landmark, pincode, markerPos]);

  // GPS Geolocation handler
  const handleUseCurrentGPS = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLat = pos.coords.latitude;
          const newLng = pos.coords.longitude;
          const coords = { lat: newLat, lng: newLng };
          setMapCenter(coords);
          setMarkerPos(coords);
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
          setMapCenter(DEFAULT_COORDS);
          setMarkerPos(DEFAULT_COORDS);
        },
        { timeout: 8000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleMapClick = (e: any) => {
    if (e.detail?.latLng) {
      const newPos = {
        lat: e.detail.latLng.lat,
        lng: e.detail.latLng.lng
      };
      setMarkerPos(newPos);
    }
  };

  return (
    <div className="space-y-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">
              Home Delivery Address & Google Maps
            </h4>
            <p className="text-[11px] text-zinc-400">
              Enter your personal details & pin exact location
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleUseCurrentGPS}
          disabled={isLocating}
          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all shrink-0"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'Use GPS'}</span>
        </button>
      </div>

      {/* Inputs: Door Number & Street / Area */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase mb-1">
            Door No. / House / Flat *
          </label>
          <input
            type="text"
            value={doorNo}
            onChange={(e) => setDoorNo(e.target.value)}
            placeholder="e.g. 25-1-13 / Flat 302"
            className="w-full px-3 py-2 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-bold text-white outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase mb-1">
            Street Address / Colony / Building Name *
          </label>
          <input
            type="text"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            placeholder="e.g. Gajuwaka Bypass Road, Sai Heights"
            className="w-full px-3 py-2 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-semibold text-white outline-none focus:border-blue-500"
            required
          />
        </div>
      </div>

      {/* Landmark (Entered by user - no random defaults) & City & Pincode */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase mb-1">
            User Landmark (Entered by you)
          </label>
          <input
            type="text"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="e.g. Near Water Tank / Opposite School"
            className="w-full px-3 py-2 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-zinc-200 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase mb-1">
            City / Town / Area *
          </label>
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 rounded-xl border border-zinc-800 focus-within:border-blue-500">
            <Building className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Visakhapatnam"
              className="w-full bg-transparent text-xs font-bold text-white outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase mb-1">
            Pincode *
          </label>
          <input
            type="text"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="e.g. 530026"
            className="w-full px-3 py-2 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-mono font-bold text-white outline-none focus:border-blue-500"
            maxLength={6}
            required
          />
        </div>
      </div>

      {/* Interactive Google Maps Container */}
      <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono font-bold text-zinc-300 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-emerald-400" /> Google Maps Pin Location
          </span>
          <button
            type="button"
            onClick={() => setShowMapModal(!showMapModal)}
            className="text-[11px] font-mono font-bold text-blue-400 hover:underline"
          >
            {showMapModal ? 'Hide Map' : '🗺️ Open Map Picker'}
          </button>
        </div>

        {/* Embedded Interactive Google Map */}
        <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 h-44 relative">
          {hasValidKey && !hasMapError ? (
            <APIProvider apiKey={apiKey} version="weekly">
              <Map
                center={mapCenter}
                zoom={14}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
                onClick={handleMapClick}
                gestureHandling="cooperative"
              >
                <AdvancedMarker position={markerPos} title="Delivery Pin Location">
                  <Pin background="#10B981" glyphColor="#FFFFFF" borderColor="#047857" />
                </AdvancedMarker>
              </Map>
            </APIProvider>
          ) : (
            <iframe
              title="Interactive Delivery Map"
              src={`https://maps.google.com/maps?q=${markerPos.lat},${markerPos.lng}&z=15&output=embed`}
              className="w-full h-full border-0 rounded-xl"
              loading="lazy"
            />
          )}

          {/* Map Overlay Instruction Banner */}
          <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-lg bg-black/80 backdrop-blur-xs border border-zinc-800 text-[11px] font-mono text-zinc-200 flex justify-between items-center">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Click map to pin delivery spot
            </span>
            <span className="text-emerald-400 font-bold">
              {markerPos.lat.toFixed(3)}, {markerPos.lng.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Confirmed Location Summary & Auto Directions from Owner Address */}
        <div className="space-y-2">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs flex items-start gap-2 text-emerald-300 font-medium">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold text-white">Confirmed Home Delivery Destination:</p>
              <p className="text-emerald-200 font-mono text-[11px] truncate mt-0.5">
                {doorNo ? `Door No. ${doorNo}, ` : ''}{streetAddress}, {city} - {pincode}{landmark ? ` (Landmark: ${landmark})` : ''}
              </p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-emerald-400 font-mono">
                <span>📍 Auto Lat: {markerPos.lat.toFixed(4)}</span>
                <span>📍 Auto Lng: {markerPos.lng.toFixed(4)}</span>
                <span>📮 Auto Pincode: {pincode}</span>
              </div>
            </div>
          </div>

          {/* Auto Directions Card from Store Owner Hub to Delivery Address */}
          <div className="p-3 bg-gradient-to-r from-blue-950/80 via-zinc-900 to-indigo-950/80 rounded-xl border border-blue-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase flex items-center gap-1">
                <Route className="w-3.5 h-3.5 text-blue-400" /> Auto Route & Direction Tracker
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-mono font-bold">
                {autoDistanceKm} km • ~{autoEtaMins} Mins Express
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-zinc-900/90 rounded-lg border border-zinc-800 flex items-start gap-1.5">
                <Store className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[9px] font-mono font-bold text-zinc-400 uppercase">Owner Hub Address</p>
                  <p className="font-bold text-white truncate">{ownerAddressStr}</p>
                </div>
              </div>

              <div className="p-2 bg-zinc-900/90 rounded-lg border border-zinc-800 flex items-start gap-1.5">
                <Home className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[9px] font-mono font-bold text-zinc-400 uppercase">User Delivery Doorstep</p>
                  <p className="font-bold text-white truncate">
                    {doorNo ? `Door No. ${doorNo}, ` : ''}{streetAddress}, {city}
                  </p>
                </div>
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ownerAddressStr)}&destination=${encodeURIComponent(`${doorNo ? `Door No. ${doorNo}, ` : ''}${streetAddress}, ${city} - ${pincode}`)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] font-mono flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Auto Directions in Google Maps</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
