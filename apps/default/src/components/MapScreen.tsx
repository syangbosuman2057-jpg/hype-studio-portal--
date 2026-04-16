import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Star, Phone, ExternalLink, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getShops } from '../lib/api';
import { getSellerAvatar, formatNumber } from '../lib/images';
import { cn } from '../lib/utils';

// Fix leaflet default marker
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function createCustomIcon(category: string) {
  const emojis: Record<string, string> = {
    fashion: '👗',
    food: '🍛',
    crafts: '🎨',
    accessories: '💎',
    home: '🏠',
  };
  const emoji = emojis[category] || '🏪';
  return L.divIcon({
    className: '',
    html: `<div style="background:#ef4444;width:36px;height:36px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.4)">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 12); }, [lat, lng]);
  return null;
}

interface ShopNode {
  id: string;
  fieldValues: Record<string, any>;
}

const CITIES = ['All', 'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara'];
const CITY_COORDS: Record<string, [number, number]> = {
  'All': [27.7172, 85.3240],
  'Kathmandu': [27.7172, 85.3240],
  'Lalitpur': [27.6647, 85.3246],
  'Bhaktapur': [27.6710, 85.4298],
  'Pokhara': [28.2096, 83.9856],
};

export default function MapScreen() {
  const [shops, setShops] = useState<ShopNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCity, setActiveCity] = useState('All');
  const [selectedShop, setSelectedShop] = useState<ShopNode | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([27.7172, 85.3240]);

  useEffect(() => {
    getShops().then((s) => { setShops(s); setLoading(false); });
  }, []);

  const filtered = shops.filter((s) => {
    if (activeCity === 'All') return true;
    return (s.fieldValues['/attributes/@lcity'] || '').toLowerCase() === activeCity.toLowerCase();
  });

  function handleCityChange(city: string) {
    setActiveCity(city);
    setMapCenter(CITY_COORDS[city] || [27.7172, 85.3240]);
  }

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-900 px-4 pt-4 pb-3 border-b border-zinc-800 z-10">
        <h1 className="text-white font-bold text-xl mb-3">📍 Nearby Shops</h1>
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => handleCityChange(city)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all',
                activeCity === city
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              )}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Map */}
          <div className="h-64 relative z-0">
            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <RecenterMap lat={mapCenter[0]} lng={mapCenter[1]} />
              {filtered.map((shop) => {
                const lat = shop.fieldValues['/attributes/@llat'];
                const lng = shop.fieldValues['/attributes/@llng'];
                const category = shop.fieldValues['/attributes/@lcategory'] || 'fashion';
                if (!lat || !lng) return null;
                return (
                  <Marker
                    key={shop.id}
                    position={[lat, lng]}
                    icon={createCustomIcon(category)}
                    eventHandlers={{ click: () => setSelectedShop(shop) }}
                  >
                    <Popup>
                      <div className="text-sm font-bold">{shop.fieldValues['/attributes/@lshop']}</div>
                      <div className="text-xs text-gray-500">@{shop.fieldValues['/attributes/@lseller']}</div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Shops list */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
              {filtered.length} shops found
            </p>
            {filtered.map((shop, idx) => (
              <ShopCard key={shop.id} shop={shop} index={idx} onClick={() => setSelectedShop(shop)} isSelected={selectedShop?.id === shop.id} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-10 text-zinc-500">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No shops found in {activeCity}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shop detail bottom sheet */}
      {selectedShop && (
        <>
          <div className="absolute inset-0 z-10" onClick={() => setSelectedShop(null)} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute inset-x-0 bottom-0 bg-zinc-900 rounded-t-3xl z-20 p-5 border-t border-zinc-800"
          >
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
            <div className="flex items-start gap-4">
              <img
                src={getSellerAvatar(selectedShop.fieldValues['/attributes/@lseller'] || '')}
                className="w-16 h-16 rounded-2xl bg-zinc-700"
              />
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">{selectedShop.fieldValues['/attributes/@lshop']}</h3>
                <p className="text-zinc-400 text-sm">@{selectedShop.fieldValues['/attributes/@lseller']}</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-white text-sm font-semibold">{selectedShop.fieldValues['/attributes/@lrating'] || 4.5}</span>
                  </div>
                  <span className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    selectedShop.fieldValues['/attributes/@lopen'] === 'open'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  )}>
                    {selectedShop.fieldValues['/attributes/@lopen'] === 'open' ? '● Open Now' : '● Closed'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-zinc-400">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{selectedShop.fieldValues['/attributes/@laddress']}</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button className="flex-1 py-3 border border-zinc-700 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 text-sm">
                <Navigation className="w-4 h-4" /> Directions
              </button>
              <button className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 text-sm">
                <ExternalLink className="w-4 h-4" /> Visit Shop
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

function ShopCard({ shop, index, onClick, isSelected }: {
  shop: ShopNode;
  index: number;
  onClick: () => void;
  isSelected: boolean;
}) {
  const fv = shop.fieldValues;
  const name = fv['/attributes/@lshop'] || fv['/text'] || 'Shop';
  const seller = fv['/attributes/@lseller'] || '';
  const city = fv['/attributes/@lcity'] || '';
  const rating = fv['/attributes/@lrating'] || 4.5;
  const category = fv['/attributes/@lcategory'] || 'fashion';
  const isOpen = fv['/attributes/@lopen'] === 'open';
  const address = fv['/attributes/@laddress'] || '';

  const catEmojis: Record<string, string> = { fashion: '👗', food: '🍛', crafts: '🎨', accessories: '💎', home: '🏠' };

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        'w-full text-left bg-zinc-900 rounded-2xl p-4 border transition-all',
        isSelected ? 'border-red-500' : 'border-zinc-800 hover:border-zinc-700'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
          {catEmojis[category] || '🏪'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-white font-semibold text-sm truncate">{name}</p>
            <span className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2',
              isOpen ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-500'
            )}>
              {isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          <p className="text-zinc-500 text-xs">@{seller} • {city}</p>
          <p className="text-zinc-600 text-xs mt-0.5 truncate">{address}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-zinc-300 text-xs">{rating}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
