import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { INITIAL_LOCATIONS } from '../data/initialData';
import { LocationArea } from '../types';
import { MapPin, Navigation, Check, X, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { performReverseGeocode } from './GoogleMapsAddressPicker';

export const LocationModal: React.FC = () => {
  const { 
    isLocationModalOpen, 
    setIsLocationModalOpen, 
    selectedLocation, 
    setSelectedLocation, 
    deliveryLocations, 
    addToast 
  } = useStore();
  const [isDetecting, setIsDetecting] = useState(false);

  if (!isLocationModalOpen) return null;

  const handleDetectLocation = () => {
    setIsDetecting(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const newLat = pos.coords.latitude;
          const newLng = pos.coords.longitude;
          setIsDetecting(false);

          const geo = await performReverseGeocode(newLat, newLng);
          const detectedArea = geo.street || geo.city || 'Visakhapatnam';
          const detectedPincode = geo.pincode || '530026';

          const gpsLoc: LocationArea = {
            id: `gps-${Date.now()}`,
            name: detectedArea,
            area: detectedArea,
            pincode: detectedPincode,
            deliveryEta: '10-15 mins',
            isServiceable: true,
            lat: newLat,
            lng: newLng
          };

          setSelectedLocation(gpsLoc);
          addToast(`GPS Detected Location: ${detectedArea} (${detectedPincode})`, 'success');
          setIsLocationModalOpen(false);
        },
        () => {
          setIsDetecting(false);
          const activeLoc = deliveryLocations[0] || INITIAL_LOCATIONS[0];
          addToast(`GPS permission denied. Selected default ${activeLoc.name}.`, 'info');
          setSelectedLocation(activeLoc);
          setIsLocationModalOpen(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setIsDetecting(false);
      const activeLoc = deliveryLocations[0] || INITIAL_LOCATIONS[0];
      setSelectedLocation(activeLoc);
      setIsLocationModalOpen(false);
    }
  };

  const handleSelectArea = (loc: LocationArea) => {
    setSelectedLocation(loc);
    addToast(`Delivery location set to ${loc.name}`, 'success');
    setIsLocationModalOpen(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 p-6 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Select Delivery Location
              </h2>
              <p className="text-xs text-zinc-400">
                ⚡ Express 10-15 Min Hubs in Visakhapatnam
              </p>
            </div>
          </div>

          {/* GPS Detector Button */}
          <button
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className="w-full mb-5 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
          >
            <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Detecting Current Location...' : 'Use Current GPS Location'}</span>
          </button>

          <div className="flex items-center justify-between text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            <span>Owner-Added Serviceable Hubs</span>
            <span className="text-[10px] text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full bg-blue-500/10">
              Google Maps Enabled
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {deliveryLocations.map((loc, locIdx) => {
              const isSelected = selectedLocation.id === loc.id;
              return (
                <button
                  key={`loc-${loc.id}-${locIdx}`}
                  onClick={() => handleSelectArea(loc)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'border-blue-500/50 bg-blue-500/10 text-white'
                      : 'border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Building2 className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-blue-400' : 'text-zinc-500'}`} />
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <span>{loc.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                          {loc.pincode}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        {loc.area} • <span className="font-semibold text-emerald-400">Serviceable Hub</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-black flex items-center justify-center shrink-0 font-bold">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 text-center font-mono">
            Primary Store: 25-1-13, Gajuwaka Bypass Road, Visakhapatnam
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
